// __APP_VERSION__ 在 Go ServeServiceWorker 中被替换为构建期注入的版本号.
// 版本变 ⇒ sw.js 字节变 ⇒ install 走新流程; activate 清旧 cache.
const APP_VERSION = "__APP_VERSION__";
const STATIC_CACHE = `czlnav-static-${APP_VERSION}`;
const RUNTIME_CACHE = `czlnav-runtime-${APP_VERSION}`;
const API_CACHE = `czlnav-api-${APP_VERSION}`;

const OWNED_CACHES = new Set([STATIC_CACHE, RUNTIME_CACHE, API_CACHE]);

// 公开端只读 API, 走 stale-while-revalidate
const SWR_API_PATTERNS = [
  /^\/api\/settings\/?$/,
  /^\/api\/public\/home\/?$/,
  /^\/api\/public\/category\/[^/]+\/?$/,
];

self.addEventListener("install", (event) => {
  // 跳过等待, 让新 SW 尽快接管
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("czlnav-") && !OWNED_CACHES.has(key))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 跨域请求放行 (统计脚本等)
  if (url.origin !== self.location.origin) return;

  // admin 区与 admin API: 完全不接管, 鉴权与实时数据敏感
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin")) {
    return;
  }

  // sw.js 自身: 不缓存, 让浏览器走原生 update 流程
  if (url.pathname === "/sw.js") return;

  // Next 静态资源 (文件名带内容哈希, immutable): cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 公开 API: stale-while-revalidate
  if (SWR_API_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // 用户上传 / 站点静态资源: 网络优先, 失败回退缓存
  if (
    url.pathname.startsWith("/uploads/") ||
    url.pathname.startsWith("/static/") ||
    url.pathname === "/favicon.ico" ||
    url.pathname === "/logo.png" ||
    url.pathname === "/logo.svg"
  ) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // HTML navigation: 网络优先, 失败回退缓存 (保证 Go 占位符注入的实时性)
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    // 异步刷新, 不阻塞返回
    networkPromise.catch(() => {});
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  // 兜底
  return new Response(JSON.stringify({ success: false, error: "offline" }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
