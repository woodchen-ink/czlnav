// 构建后把 frontend/out/sw.js 中的 __APP_VERSION__ 替换为版本号.
// 版本号变化 ⇒ sw.js 字节变化 ⇒ 浏览器安装新 SW 并清理旧缓存.
// 取值顺序: APP_VERSION (CI 显式传入, 如 tag) → 构建时间戳 (每次部署都不同, 保证 SW 切换).
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const swPath = fileURLToPath(new URL("../frontend/out/sw.js", import.meta.url));
const version = process.env.APP_VERSION || `build-${new Date().toISOString().replace(/[-:.TZ]/g, "")}`;

const source = await readFile(swPath, "utf8");
if (!source.includes("__APP_VERSION__")) {
  throw new Error(`__APP_VERSION__ placeholder not found in ${swPath}`);
}
await writeFile(swPath, source.replaceAll("__APP_VERSION__", version));
console.log(`sw.js stamped with version ${version}`);
