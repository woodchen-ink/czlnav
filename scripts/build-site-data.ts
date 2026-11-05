// 构建前拉取站点数据, 供前端静态预渲染. 须在 npm run build / edgeone makers deploy 之前单独执行.
//
// 数据源 (二选一):
//   - Blob (CI 默认): 需要 EDGEONE_PROJECT_ID + EDGEONE_API_TOKEN
//   - 线上 API (本地构建): node scripts/build-site-data.ts --from-api https://nav.czl.net
//
// 产物 (均不入库):
//   frontend/src/data/site.json      首页 / 分类页预渲染数据
//   frontend/public/data/search.json 搜索索引, 浏览器首次搜索时加载
//   frontend/public/icons/*          本地化并压缩后的图标, 文件名为内容哈希, 可永久缓存
//
// 图标处理失败时保留原地址, 不阻断构建; 数据读取失败则直接失败, 避免发布空站.

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { getStore } from "@edgeone/pages-blob";
import decodeIco from "decode-ico";
import sharp from "sharp";
import type { Category, Service, Settings, Table } from "../server/model.ts";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const FRONTEND = join(ROOT, "frontend");
const OUT_DATA = join(FRONTEND, "src", "data", "site.json");
const OUT_SEARCH = join(FRONTEND, "public", "data", "search.json");
const OUT_ICONS = join(FRONTEND, "public", "icons");
const STATIC_UPLOADS = join(FRONTEND, "public");

const ICON_SIZE = 128; // 卡片显示 40px, 留 3x 余量
const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 8;
const USER_AGENT = "Mozilla/5.0 (compatible; CZLNavBuild/1.0)";

// 与 server/model.ts 的 DEFAULT_SETTINGS 一致
const DEFAULT_SETTINGS: Settings = {
  siteName: "CZL导航",
  siteDescription: "一个导航站,包含AI, 国际快递, PDF工具, 图片在线压缩等等工具的导航站",
  statisticsCode: "",
  seoTitle: "",
  seoKeywords: "",
  seoDescription: "",
};

interface RawData {
  categories: Category[];
  services: Service[];
  settings: Settings;
  readUpload: (publicPath: string) => Promise<Buffer | null>;
}

const { values: args } = parseArgs({ options: { "from-api": { type: "string" } } });

// Blob 的 STS 凭据接口偶发返回 "credential exchange failed (code=-1): Invalid credential",
// 同一令牌重试即可成功; SDK 只对网络错误 / 5xx 重试, 这里补一层. 凭据只在成功后缓存, 重试会重新交换.
const BLOB_ATTEMPTS = 4;

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= BLOB_ATTEMPTS) throw err;
      console.warn(`blob read failed (attempt ${attempt}/${BLOB_ATTEMPTS}), retrying: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }
  }
}

async function fromBlob(): Promise<RawData> {
  const projectId = process.env.EDGEONE_PROJECT_ID;
  const token = process.env.EDGEONE_API_TOKEN;
  if (!projectId || !token) {
    throw new Error("missing EDGEONE_PROJECT_ID / EDGEONE_API_TOKEN (or pass --from-api <origin>)");
  }
  const store = getStore({ name: "czlnav", projectId, token, consistency: "strong" });
  const [categories, services, settings] = await withRetry(() =>
    Promise.all([
      store.get("db/categories.json", { type: "json" }) as Promise<Table<Category> | null>,
      store.get("db/services.json", { type: "json" }) as Promise<Table<Service> | null>,
      store.get("db/settings.json", { type: "json" }) as Promise<Settings | null>,
    ])
  );
  if (!categories || !services) throw new Error("blob data missing: db/categories.json or db/services.json");
  return {
    categories: categories.items,
    services: services.items,
    settings: settings ?? {},
    readUpload: async (p) => {
      const buf = await store.get("uploads/" + p.slice("/uploads/".length), { type: "arrayBuffer" });
      return buf ? Buffer.from(buf) : null;
    },
  };
}

async function fromApi(origin: string): Promise<RawData> {
  const get = async (path: string) => {
    const res = await fetch(origin + path, { signal: AbortSignal.timeout(30_000) });
    const body = (await res.json()) as { success: boolean; data: unknown; message: string };
    if (!res.ok || !body.success) throw new Error(`${path}: ${res.status} ${body.message}`);
    return body.data;
  };
  const home = (await get("/api/public/home")) as { categories: (Category & { services: Service[] })[] };
  const settings = (await get("/api/settings")) as Settings;
  return {
    categories: home.categories.map(({ services: _s, ...c }) => c),
    services: home.categories.flatMap((c) => c.services),
    settings,
    readUpload: (p) => download(origin + p),
  };
}

async function download(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}

function isSvg(buf: Buffer): boolean {
  const head = buf.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"));
}

function isIco(buf: Buffer): boolean {
  return buf.length > 6 && buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0;
}

// ICO 内取最大的一帧; png 帧直接交给 sharp, bmp 帧给出的是 RGBA 原始像素
function icoToSharp(buf: Buffer): ReturnType<typeof sharp> {
  const frames = decodeIco(buf);
  if (frames.length === 0) throw new Error("empty ico");
  const best = frames.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));
  if (best.type === "png") return sharp(Buffer.from(best.data));
  return sharp(Buffer.from(best.data), { raw: { width: best.width, height: best.height, channels: 4 } });
}

async function optimize(buf: Buffer): Promise<{ data: Buffer; ext: string }> {
  if (isSvg(buf)) return { data: buf, ext: "svg" };
  const img = isIco(buf) ? icoToSharp(buf) : sharp(buf, { animated: false });
  // 只缩不放、不补边, 保留原比例; 小图由前端 object-contain 放大到显示尺寸.
  // 不能用 fit: contain + withoutEnlargement: 小图会被居中贴进 128px 透明画布, 显示时图案按比例缩小.
  const data = await img
    .resize(ICON_SIZE, ICON_SIZE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  return { data, ext: "webp" };
}

async function localizeIcon(source: string, raw: RawData): Promise<string> {
  let buf: Buffer | null = null;
  if (source.startsWith("/uploads/")) {
    // 打包进 frontend/public 的历史图标优先读本地, 其余从数据源取
    const local = join(STATIC_UPLOADS, source);
    buf = existsSync(local) ? await readFile(local) : await raw.readUpload(source);
  } else if (/^https?:\/\//i.test(source)) {
    buf = await download(source);
  }
  if (!buf) throw new Error("download failed");

  const { data, ext } = await optimize(buf);
  const name = `${createHash("sha1").update(data).digest("hex").slice(0, 16)}.${ext}`;
  await writeFile(join(OUT_ICONS, name), data);
  return `/icons/${name}`;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    })
  );
  return results;
}

const raw = args["from-api"] ? await fromApi(args["from-api"].replace(/\/$/, "")) : await fromBlob();
console.log(`source: ${args["from-api"] ?? "blob"}, categories=${raw.categories.length}, services=${raw.services.length}`);
if (raw.categories.length === 0) throw new Error("no categories, refuse to build an empty site");

await rm(OUT_ICONS, { recursive: true, force: true });
await mkdir(OUT_ICONS, { recursive: true });

const sources = [...new Set([...raw.categories, ...raw.services].map((x) => x.icon).filter((x): x is string => !!x))];
const iconMap = new Map<string, string>();
let failed = 0;
await mapLimit(sources, CONCURRENCY, async (src) => {
  try {
    iconMap.set(src, await localizeIcon(src, raw));
  } catch (err) {
    failed++;
    console.warn(`icon kept as-is (${(err as Error).message}): ${src}`);
  }
});
console.log(`icons: ${iconMap.size}/${sources.length} localized, ${failed} kept as-is`);

const icon = (src: string | null) => (src ? (iconMap.get(src) ?? src) : null);
const byOrder = (a: { sortOrder: number; id: number }, b: { sortOrder: number; id: number }) =>
  a.sortOrder - b.sortOrder || a.id - b.id;
// 公开端同 sortOrder 时新建的排前面, 与 server/model.ts byServicePublicOrder 一致
const byServiceOrder = (a: Service, b: Service) => a.sortOrder - b.sortOrder || b.id - a.id;

const categories = [...raw.categories].sort(byOrder).map((c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  icon: icon(c.icon),
  seoTitle: c.seoTitle,
  seoDescription: c.seoDescription,
  seoKeywords: c.seoKeywords,
  services: raw.services
    .filter((s) => s.categoryId === c.id)
    .sort(byServiceOrder)
    .map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      description: s.description,
      icon: icon(s.icon),
      categoryId: s.categoryId,
      categorySlug: c.slug,
    })),
}));

const settings = { ...DEFAULT_SETTINGS, ...raw.settings };

const search = categories.flatMap((c) =>
  c.services.map((s) => ({ ...s, categoryName: c.name, categorySlug: c.slug }))
);

await mkdir(join(FRONTEND, "src", "data"), { recursive: true });
await mkdir(join(FRONTEND, "public", "data"), { recursive: true });
await writeFile(OUT_DATA, JSON.stringify({ generatedAt: new Date().toISOString(), settings, categories }, null, 2));
await writeFile(OUT_SEARCH, JSON.stringify(search));
console.log(`wrote ${OUT_DATA}`);
