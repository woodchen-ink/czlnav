/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  images: {
    // 从 APP_URL 提取域名，如果没有则允许所有
    remotePatterns: process.env.APP_URL
      ? [
          {
            protocol: new URL(process.env.APP_URL).protocol.replace(":", ""),
            hostname: new URL(process.env.APP_URL).hostname,
          },
          // 同时支持开发环境
          { protocol: "http", hostname: "localhost" },
          { protocol: "https", hostname: "localhost" },
        ]
      : [
          // 默认配置：允许所有图片（开发环境友好）
          { protocol: "https", hostname: "**" },
          { protocol: "http", hostname: "**" },
        ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  // 添加构建ID，确保每次构建生成不同的资源URL
  generateBuildId: async () => {
    // 使用时间戳或环境变量作为构建ID
    return process.env.BUILD_ID || Date.now().toString();
  },
  // 添加HTTP头，控制缓存
  async headers() {
    return [
      {
        // 对带hash的静态资源允许长期缓存
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 对上传的静态资源允许缓存（使用更精确的匹配）
        source: "/uploads/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Vary",
            value: "Accept-Encoding",
          },
        ],
      },
      {
        // 对其他路由应用这些头，防止浏览器和CDN缓存
        source: "/((?!_next/static|uploads).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default config;
