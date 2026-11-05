// CZL Connect OAuth2 客户端, 对应旧 go-backend/pkg/oauth2.

const AUTHORIZE_URL = "https://connect.czl.net/oauth2/authorize";
const TOKEN_URL = "https://connect.czl.net/api/oauth2/token";
const USER_INFO_URL = "https://connect.czl.net/api/oauth2/userinfo";
const TIMEOUT_MS = 15_000;

export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
}

export interface CZLUser {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function authorizeUrl(cfg: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope: "read",
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function exchangeCode(cfg: OAuthConfig, code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: cfg.redirectUri,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

export async function fetchUser(accessToken: string): Promise<CZLUser> {
  const res = await fetch(USER_INFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`get user info failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as CZLUser;
}
