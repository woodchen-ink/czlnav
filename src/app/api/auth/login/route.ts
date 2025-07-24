import { NextResponse } from "next/server";
import { getAuthUrl } from "@/utils/czl-auth";

export async function GET() {
  try {
    // 生成随机state用于防止CSRF攻击
    const state = Math.random().toString(36).substring(2, 15);

    // 获取授权URL
    const authUrl = getAuthUrl(state);

    // 将state存储在cookie中用于验证
    const response = NextResponse.redirect(authUrl);
    response.cookies.set("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10分钟
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OAuth login error:", error);
    return NextResponse.redirect("/admin/login?error=oauth_error");
  }
}
