import { createHmac, timingSafeEqual } from "node:crypto";
import { readCookie, serializeCookie } from "../cookie";
import type { Env } from "../env";
import { fetchUser, type CZLUser, type OAuthConfig } from "./oauth";

export type AdminUser = CZLUser;

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const SESSION_COOKIE = "admin_session";
export const STATE_COOKIE = "oauth_state";

// 旧版在进程内存缓存 access_token→用户 10 分钟; Serverless 实例随时冷启动, 改为签名 cookie 承载同样的 10 分钟缓存.
const SESSION_TTL_SECONDS = 10 * 60;

interface SessionPayload {
  user: AdminUser;
  token: string; // access_token 的签名摘要, 换 token 后旧会话自动失效
  exp: number;
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
  const accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);
  const secret = env.CZL_CONNECT_CLIENT_SECRET;
  if (!accessToken || !secret) return { user: null };

  const session = verifySession(readCookie(request, SESSION_COOKIE), secret);
  if (session && session.token === digest(secret, accessToken)) {
    // 白名单改动后已签发的会话也要立即生效
    return isAllowedAdmin(session.user, env) ? { user: session.user } : { user: null };
  }

  try {
    const user = await fetchUser(accessToken);
    if (!isAllowedAdmin(user, env)) return { user: null };
    return { user, setCookie: issueSession(user, accessToken, secret, isSecure(request, env)) };
  } catch (err) {
    console.error("auth verification failed", err);
    return { user: null };
  }
}

export function issueSession(user: AdminUser, accessToken: string, secret: string, secure: boolean): string {
  const payload: SessionPayload = {
    user,
    token: digest(secret, accessToken),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return serializeCookie(SESSION_COOKIE, `${body}.${sign(secret, body)}`, {
    maxAge: SESSION_TTL_SECONDS,
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
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch {
    return null;
  }
}

function sign(secret: string, value: string): string {
  return createHmac("sha256", `czlnav-session:${secret}`).update(value).digest("base64url");
}

function digest(secret: string, token: string): string {
  return sign(secret, `token:${token}`).slice(0, 22);
}
