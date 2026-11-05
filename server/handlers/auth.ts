import { randomBytes } from "node:crypto";
import { clearCookie, readCookie, serializeCookie } from "../cookie";
import { ok, redirect, fail } from "../http";
import { authorizeUrl, exchangeCode, fetchUser } from "../auth/oauth";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_COOKIE,
  STATE_COOKIE,
  isAllowedAdmin,
  isSecure,
  issueSession,
  oauthConfig,
} from "../auth/session";
import type { Handler } from "../router";

const LOGIN_PAGE = "/admin/login";
const STATE_MAX_AGE = 600;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

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
  // state 一次性使用, 无论成败都清掉
  const clearState = clearCookie(STATE_COOKIE, secure);
  const failTo = (code: string) => redirect(`${LOGIN_PAGE}?error=${code}`, [clearState]);

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

  return redirect("/admin", [
    clearState,
    serializeCookie(ACCESS_TOKEN_COOKIE, token.access_token, { maxAge: token.expires_in, secure }),
    serializeCookie(REFRESH_TOKEN_COOKIE, token.refresh_token, { maxAge: REFRESH_TOKEN_MAX_AGE, secure }),
    issueSession(user, token.access_token, cfg.clientSecret, secure),
  ]);
};

export const logout: Handler = ({ request, env }) => {
  const secure = isSecure(request, env);
  const res = ok(null, "登出成功");
  for (const name of [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, SESSION_COOKIE]) {
    res.headers.append("Set-Cookie", clearCookie(name, secure));
  }
  return res;
};

export const account: Handler = ({ user }) => ok(user);

export const changePassword: Handler = () =>
  fail(400, "密码修改功能已迁移到 CZL Connect 平台，请前往 https://connect.czl.net 修改您的密码");
