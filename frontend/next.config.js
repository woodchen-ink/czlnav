import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

/** @type {import('next').NextConfig} */
const config = {
  // 静态导出仅在生产构建时启用；dev 模式保留完整 Next 服务以支持 rewrites 反代
  ...(isDev ? {} : { output: "export" }),
  trailingSlash: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    unoptimized: true,
  },
  // 开发模式下将 /api/* 反代到本地 Go 后端 (3000)
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:3000/api/:path*",
      },
    ];
  },
};

export default config;
