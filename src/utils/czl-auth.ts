import { cookies } from "next/headers";
import env from "@/lib/env";
import logger from "@/lib/logger";

// CZL Connect OAuth2 配置
const OAUTH_CONFIG = {
  clientId: env.CZL_CONNECT_CLIENT_ID,
  clientSecret: env.CZL_CONNECT_CLIENT_SECRET,
  redirectUri: env.AUTH_CALLBACK_URL,
  authorizeUrl: "https://connect.czl.net/oauth2/authorize",
  tokenUrl: "https://connect.czl.net/api/oauth2/token",
  userInfoUrl: "https://connect.czl.net/api/oauth2/userinfo",
};

// 用户信息接口
export interface CZLUser {
  id: number;
  username: string;
  nickname: string;
  email: string;
  avatar: string;
  upstreams: Array<{
    id: number;
    upstream_id: number;
    upstream_name: string;
    upstream_type: string;
    upstream_username: string;
    upstream_email: string;
    upstream_avatar: string;
    provider_data: Record<string, unknown>;
  }>;
}

// 生成OAuth2授权URL
export function getAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    scope: "read",
    ...(state && { state }),
  });

  return `${OAUTH_CONFIG.authorizeUrl}?${params.toString()}`;
}

// 使用授权码交换访问令牌
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  try {
    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: OAUTH_CONFIG.redirectUri,
      }),
    });

    if (!response.ok) {
      logger.error("Token exchange failed", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error("Token exchange error", error);
    return null;
  }
}

// 获取用户信息
export async function getUserInfo(
  accessToken: string
): Promise<CZLUser | null> {
  try {
    const response = await fetch(OAUTH_CONFIG.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      logger.error("Get user info failed", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error("Get user info error", error);
    return null;
  }
}

// 验证访问令牌并获取用户信息
export async function verifyAccessToken(
  accessToken: string
): Promise<CZLUser | null> {
  return await getUserInfo(accessToken);
}

// 验证管理员身份（在请求中）
export async function verifyAdmin(): Promise<CZLUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return null;
  }

  return await verifyAccessToken(accessToken);
}

// 验证管理员身份（通过Token）
export async function verifyAdminToken(): Promise<boolean> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return false;
  }

  // 验证token的有效性
  try {
    const user = await getUserInfo(accessToken);
    return user !== null;
  } catch (error) {
    logger.error("Token verification failed", error);
    return false;
  }
}

// 设置认证Cookie
export async function setAuthCookies(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  const cookieStore = await cookies();

  // 设置访问令牌（24小时）
  cookieStore.set("access_token", tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: tokens.expires_in,
    path: "/",
  });

  // 设置刷新令牌（30天）
  cookieStore.set("refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30天
    path: "/",
  });
}

// 清除认证Cookie
export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
}

// 刷新访问令牌
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
} | null> {
  try {
    const response = await fetch(OAUTH_CONFIG.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${OAUTH_CONFIG.clientId}:${OAUTH_CONFIG.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      logger.error("Token refresh failed", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    logger.error("Token refresh error", error);
    return null;
  }
}
