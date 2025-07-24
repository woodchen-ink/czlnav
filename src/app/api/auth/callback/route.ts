import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  getUserInfo,
  setAuthCookies,
} from "@/utils/czl-auth";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // 使用环境变量中的APP_URL而不是request.url的origin
    const origin = env.APP_URL;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // 检查是否有错误
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(`${origin}/admin/login?error=oauth_denied`);
    }

    // 检查是否有授权码
    if (!code) {
      return NextResponse.redirect(`${origin}/admin/login?error=no_code`);
    }

    // 验证state（防止CSRF攻击）
    const storedState = request.cookies.get("oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(`${origin}/admin/login?error=invalid_state`);
    }

    // 使用授权码交换访问令牌
    const tokens = await exchangeCodeForToken(code);
    if (!tokens) {
      return NextResponse.redirect(
        `${origin}/admin/login?error=token_exchange_failed`
      );
    }

    // 获取用户信息
    const user = await getUserInfo(tokens.access_token);
    if (!user) {
      return NextResponse.redirect(
        `${origin}/admin/login?error=get_user_failed`
      );
    }

    // 创建重定向响应
    const response = NextResponse.redirect(`${origin}/admin`);

    // 设置认证Cookie
    await setAuthCookies(tokens);

    // 清除state cookie
    response.cookies.delete("oauth_state");

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    // 使用环境变量中的APP_URL而不是request.url的origin
    const origin = env.APP_URL;
    return NextResponse.redirect(`${origin}/admin/login?error=callback_error`);
  }
}
