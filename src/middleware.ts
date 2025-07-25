import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "./utils/czl-auth";

// 需要保护的路径
const PROTECTED_PATHS = ["/admin"];
// 不需要保护的路径
const PUBLIC_PATHS = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 处理 admin API 路由保护
  if (pathname.startsWith("/api/admin/")) {
    // 排除认证相关的API
    if (
      pathname === "/api/auth/login" ||
      pathname === "/api/auth/callback" ||
      pathname === "/api/auth/logout"
    ) {
      return NextResponse.next();
    }

    // 验证管理员身份
    const isAdmin = await verifyAdminToken();
    if (!isAdmin) {
      return new NextResponse(JSON.stringify({ error: "未授权访问" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // 为静态资源添加缓存控制头
  if (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/static/")
  ) {
    // 带hash的静态文件可以长期缓存
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable"
    );
    return response;
  }

  // 对其他_next文件和动态资源禁用缓存
  if (
    pathname.startsWith("/_next/") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js")
  ) {
    const response = NextResponse.next();
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // 处理分类URL重写：将/c/xxx映射到/category/xxx
  if (pathname.startsWith("/c/")) {
    const slug = pathname.replace("/c/", "");
    const url = request.nextUrl.clone();
    url.pathname = `/category/${slug}`;
    return NextResponse.rewrite(url);
  }

  // 检查是否是管理后台路径
  const isAdminPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));

  // 如果不是管理后台路径，直接放行
  if (!isAdminPath) {
    return NextResponse.next();
  }

  // 为所有 /admin/ 路径添加强制不缓存的头部
  const response = NextResponse.next();
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Surrogate-Control", "no-store");

  // 如果是公开路径，直接放行（但仍保持不缓存头部）
  if (PUBLIC_PATHS.some(path => pathname === path)) {
    return response;
  }

  // 验证管理员身份 - 只检查Token，不查询数据库
  const isAdmin = await verifyAdminToken();

  // 如果验证失败，重定向到登录页面
  if (!isAdmin) {
    const url = new URL("/admin/login", request.url);
    const redirectResponse = NextResponse.redirect(url);
    // 确保重定向响应也不被缓存
    redirectResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
    );
    redirectResponse.headers.set("Pragma", "no-cache");
    redirectResponse.headers.set("Expires", "0");
    return redirectResponse;
  }

  // 验证成功，返回带有不缓存头部的响应
  return response;
}

// 配置匹配的路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - 公共api 路由 (非admin)
     * - 静态文件 (如 images, js, css, etc.)
     * - favicon.ico
     */
    "/((?!api/(?!admin)|_next/static|_next/image|favicon.ico).*)",
    // 明确包含admin API路由
    "/api/admin/:path*",
    // 静态资源缓存控制
    "/_next/static/:path*",
  ],
};
