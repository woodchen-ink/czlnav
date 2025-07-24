import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/utils/czl-auth";

export async function POST() {
  // 创建响应
  const response = NextResponse.json({
    success: true,
    message: "登出成功",
  });

  // 清除认证Cookie
  await clearAuthCookies();

  return response;
}
