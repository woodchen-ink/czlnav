import { createHmac, timingSafeEqual } from "node:crypto";
import { readCookie, serializeCookie } from "../cookie";
import type { Env } from "../env";
import { fetchUser, type CZLUser, type OAuthConfig } from "./oauth";

// 会话里只存后台用得到的字段, 让 cookie 尽量小 (浏览器单个 cookie 上限约 4KB)
export type AdminUser = Pick<CZLUser, "id" | "username">;

function toAdminUser(user: CZLUser): AdminUser {
  return { id: user.id, username: user.username };
}

export const SESSION_COOKIE = "admin_session";
export const STATE_COOKIE = "oauth_state";

// EdgeOne Makers 函数网关只保留响应里最后一个 Set-Cookie, 所以会话只用一个 cookie 承载:
// access_token + 用户信息缓存, 整体 HMAC 签名. 用户信息每 10 分钟用 access_token 重新拉取一次 (白名单 / 账号状态变更及时生效).
const USER_RECHECK_SECONDS = 10 * 60;
// CZL Connect 未返回有效期时的兜底
const DEFAULT_TOKEN_TTL_SECONDS = 2 * 60 * 60;

interface SessionPayload {
  user: AdminUser;
  token: string; // CZL Connect access_token
  checkedAt: number; // 上次拉取用户信息的时间 (秒)
  exp: number; // access_token 过期时间 (秒), 也是 cookie 的过期时间
}

export function oauthConfig(env: Env, request: Request): OAuthConfig | null {
  if (!env.CZL_CONNECT_CLIENT_ID || !env.CZL_CONNECT_CLIENT_SECRET) return null;
  return {
    clientId: env.CZL_CONNECT_CLIENT_ID,
    clientSecret: env.CZL_CONNECT_CLIENT_SECRET,
    redirectUri: env.AUTH_CALLBACK_URL ?? new URL("/api/auth/callback", request.url).toString(),
  };
}

// 以对外回调地址的协议为准; 函数内部拿到的 request.url 可能是回源的 http.
export function isSecure(request: Request, env: Env): boolean {
  if (env.AUTH_CALLBACK_URL) return env.AUTH_CALLBACK_URL.startsWith("https://");
  return new URL(request.url).protocol === "https:" || request.headers.get("X-Forwarded-Proto") === "https";
}

export function isAllowedAdmin(user: AdminUser, env: Env): boolean {
  if (!env.ADMIN_USERS) return true;
  const allowed = env.ADMIN_USERS.split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.includes(String(user.id)) || allowed.includes(user.username);
}

export async function requireAdmin(
  request: Request,
  env: Env
): Promise<{ user: AdminUser | null; setCookie?: string }> {
  const secret = env.CZL_CONNECT_CLIENT_SECRET;
  if (!secret) return { user: null };

  const session = verifySession(readCookie(request, SESSION_COOKIE), secret);
  if (!session) return { user: null };

  const now = nowSeconds();
  if (now - session.checkedAt < USER_RECHECK_SECONDS) {
    // 白名单改动后已签发的会话也要立即生效
    return isAllowedAdmin(session.user, env) ? { user: session.user } : { user: null };
  }

  try {
    const user = toAdminUser(await fetchUser(session.token));
    if (!isAllowedAdmin(user, env)) return { user: null };
    const renewed: SessionPayload = { ...session, user, checkedAt: now };
    return { user, setCookie: serializeSession(renewed, secret, isSecure(request, env)) };
  } catch (err) {
    console.error("auth verification failed", err);
    return { user: null };
  }
}

export function issueSession(
  user: CZLUser,
  accessToken: string,
  expiresIn: unknown,
  secret: string,
  secure: boolean
): string {
  const now = nowSeconds();
  const seconds = Number(expiresIn);
  const ttl = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : DEFAULT_TOKEN_TTL_SECONDS;
  return serializeSession(
    { user: toAdminUser(user), token: accessToken, checkedAt: now, exp: now + ttl },
    secret,
    secure
  );
}

// 临时排障用: 只描述会话 cookie 的状态, 不返回任何值
export function describeSession(request: Request, env: Env): string {
  const secret = env.CZL_CONNECT_CLIENT_SECRET;
  if (!secret) return "no_secret";
  const raw = readCookie(request, SESSION_COOKIE);
  if (!raw) return "missing";
  return verifySession(raw, secret) ? "ok" : "invalid_or_expired";
}

function serializeSession(payload: SessionPayload, secret: string, secure: boolean): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return serializeCookie(SESSION_COOKIE, `${body}.${sign(secret, body)}`, {
    maxAge: Math.max(payload.exp - nowSeconds(), 0),
    secure,
  });
}

function verifySession(raw: string | null, secret: string): SessionPayload | null {
  if (!raw) return null;
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(secret, body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    return typeof payload.token === "string" && payload.exp > nowSeconds() ? payload : null;
  } catch {
    return null;
  }
}

function sign(secret: string, value: string): string {
  return createHmac("sha256", `czlnav-session:${secret}`).update(value).digest("base64url");
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
