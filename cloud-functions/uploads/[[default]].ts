import { uploads } from "../../server/store";

// /uploads/* 从 Blob 读取后台上传的图标. 打包进 frontend/public/uploads 的历史图标是静态资源, 优先命中, 不会走到这里.
const CACHE_CONTROL = "public, max-age=3600";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const pathname = decodeURIComponent(new URL(context.request.url).pathname);
  const rel = pathname.replace(/^\/uploads\//, "");
  if (!rel || rel === pathname || rel.includes("..")) return notFound();

  const ext = rel.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME_BY_EXT[ext];
  if (!mime) return notFound();

  try {
    const data = await uploads.get(rel);
    if (!data) return notFound();
    return new Response(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
        // SVG 可内嵌脚本, 直接打开时禁止执行
        ...(ext === "svg" ? { "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } : {}),
      },
    });
  } catch (err) {
    console.error("read upload failed", rel, err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

function notFound(): Response {
  return new Response("Not Found", { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
}
