import { randomBytes } from "node:crypto";
import { clearCookie, readCookie, serializeCookie } from "../cookie";
import { ok, redirect, fail } from "../http";
import { authorizeUrl, exchangeCode, fetchUser } from "../auth/oauth";
import {
  SESSION_COOKIE,
  STATE_COOKIE,
  isAllowedAdmin,
  describeSession,
  isSecure,
  issueSession,
  oauthConfig,
} from "../auth/session";
import type { Handler } from "../router";

const LOGIN_PAGE = "/admin/login";
const STATE_MAX_AGE = 600;

export const login: Handler = ({ request, env }) => {
  const cfg = oauthConfig(env, request);
  if (!cfg) return redirect(`${LOGIN_PAGE}?error=missing_oauth_config`);

  const state = randomBytes(16).toString("hex");
  return redirect(authorizeUrl(cfg, state), [
    serializeCookie(STATE_COOKIE, state, { maxAge: STATE_MAX_AGE, secure: isSecure(request, env) }),
  ]);
};

export const callback: Handler = async ({ request, url, env }) => {
  const cfg = oauthConfig(env, request);
  if (!cfg) return redirect(`${LOGIN_PAGE}?error=missing_oauth_config`);

  const secure = isSecure(request, env);
  // 平台只保留最后一个 Set-Cookie (见 auth/session.ts), 成功时要写会话 cookie, oauth_state 交给 Max-Age 自然过期;
  // code 本身一次性, state 重放无害.
  const failTo = (code: string) => redirect(`${LOGIN_PAGE}?error=${code}`, [clearCookie(STATE_COOKIE, secure)]);

  const errParam = url.searchParams.get("error");
  if (errParam) return failTo(`oauth_${encodeURIComponent(errParam)}`);

  const code = url.searchParams.get("code");
  if (!code) return failTo("no_code");

  const state = url.searchParams.get("state");
  if (!state || readCookie(request, STATE_COOKIE) !== state) return failTo("invalid_state");

  let token;
  try {
    token = await exchangeCode(cfg, code);
  } catch (err) {
    console.error(err);
    return failTo("token_exchange_failed");
  }

  let user;
  try {
    user = await fetchUser(token.access_token);
  } catch (err) {
    console.error(err);
    return failTo("get_user_failed");
  }

  if (!isAllowedAdmin(user, env)) {
    console.warn("login rejected, user not in ADMIN_USERS", user.id, user.username);
    return failTo("not_admin");
  }

  const sessionCookie = issueSession(user, token.access_token, token.expires_in, cfg.clientSecret, secure);
  console.log("login ok", user.id, "session cookie length", sessionCookie.length);
  return redirect("/admin", [sessionCookie]);
};

export const logout: Handler = ({ request, env }) => {
  const secure = isSecure(request, env);
  return ok(null, "登出成功", { headers: { "Set-Cookie": clearCookie(SESSION_COOKIE, secure) } });
};

export const account: Handler = ({ user }) => ok(user);

export const changePassword: Handler = () =>
  fail(400, "密码修改功能已迁移到 CZL Connect 平台，请前往 https://connect.czl.net 修改您的密码");

// 临时排障: 浏览器带上来的 cookie 名与长度 + 会话校验结果, 不含任何 cookie 值. 登录问题解决后删除.
export const debugSession: Handler = ({ request, env }) => {
  const cookies = (request.headers.get("Cookie") ?? "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf("=");
      return { name: idx === -1 ? part : part.slice(0, idx), length: idx === -1 ? 0 : part.length - idx - 1 };
    });
  return ok({ cookies, session: describeSession(request, env) });
};
