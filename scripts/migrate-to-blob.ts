// 一次性迁移: 旧版 SQLite (go-backend/data/database.db) + 上传目录 → EdgeOne Blob.
//
// 用法 (Node ≥ 22.13, 直接运行 TS):
//   node scripts/migrate-to-blob.ts --db <database.db> [--uploads <uploads 目录>] --dry-run [--out <目录>]
//   EDGEONE_PROJECT_ID=... EDGEONE_BLOB_TOKEN=... node scripts/migrate-to-blob.ts --db <database.db> [--uploads <目录>]
//
// --dry-run 只把转换结果写到 --out (默认 ./.migrate-out), 不碰 Blob.
// 正式写入会覆盖 Blob 中的 db/*.json; 上传目录下的文件按相对路径写到 uploads/<rel>.

import { DatabaseSync } from "node:sqlite";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { parseArgs } from "node:util";
import { getStore } from "@edgeone/pages-blob";
import type { Category, Service, Settings, Table } from "../server/model.ts";

// 与 server/store.ts 保持一致
const STORE_NAME = "czlnav";
const KEYS = {
  categories: "db/categories.json",
  services: "db/services.json",
  settings: "db/settings.json",
};
const UPLOAD_PREFIX = "uploads/";
const UPLOAD_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "ico"]);

const { values: args } = parseArgs({
  options: {
    db: { type: "string" },
    uploads: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    out: { type: "string", default: ".migrate-out" },
  },
});

if (!args.db) {
  console.error("missing --db <database.db>");
  process.exit(1);
}

// 旧库时间字段可能是毫秒/秒时间戳或日期字符串 (见 go-backend/model/time.go FlexTime)
function toISO(value: unknown): string {
  if (value === null || value === undefined || value === "") return new Date(0).toISOString();
  if (typeof value === "number" || typeof value === "bigint" || /^\d+$/.test(String(value))) {
    const n = Number(value);
    return new Date(n > 1e12 ? n : n * 1000).toISOString();
  }
  const d = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) throw new Error(`unsupported time value: ${value}`);
  return d.toISOString();
}

function nullableText(value: unknown): string | null {
  return value === null || value === undefined || value === "" ? null : String(value);
}

type Row = Record<string, unknown>;

function seqOf(sqlite: DatabaseSync, table: string, items: { id: number }[]): number {
  const row = sqlite.prepare("SELECT seq FROM sqlite_sequence WHERE name = ?").get(table) as Row | undefined;
  return Math.max(Number(row?.seq ?? 0), ...items.map((i) => i.id), 0);
}

function readDatabase(path: string) {
  const sqlite = new DatabaseSync(path, { readOnly: true });

  const categories: Category[] = (sqlite.prepare('SELECT * FROM "Category" ORDER BY id').all() as Row[]).map((r) => ({
    id: Number(r.id),
    name: String(r.name),
    slug: String(r.slug),
    description: nullableText(r.description),
    icon: nullableText(r.icon),
    sortOrder: Number(r.sortOrder ?? 0),
    seoTitle: nullableText(r.seoTitle),
    seoDescription: nullableText(r.seoDescription),
    seoKeywords: nullableText(r.seoKeywords),
    createdAt: toISO(r.createdAt),
    updatedAt: toISO(r.updatedAt ?? r.createdAt),
  }));

  const categoryIds = new Set(categories.map((c) => c.id));
  const services: Service[] = [];
  for (const r of sqlite.prepare('SELECT * FROM "Service" ORDER BY id').all() as Row[]) {
    const categoryId = Number(r.categoryId);
    if (!categoryIds.has(categoryId)) {
      console.warn(`skip service #${r.id} ${r.name}: category ${r.categoryId} not found`);
      continue;
    }
    services.push({
      id: Number(r.id),
      name: String(r.name),
      url: String(r.url),
      description: String(r.description ?? ""),
      icon: nullableText(r.icon),
      categoryId,
      sortOrder: Number(r.sortOrder ?? 0),
      createdAt: toISO(r.createdAt),
      updatedAt: toISO(r.updatedAt ?? r.createdAt),
    });
  }

  const settings: Settings = {};
  for (const r of sqlite.prepare('SELECT "key", "value" FROM "Setting"').all() as Row[]) {
    settings[String(r.key)] = String(r.value);
  }

  const result = {
    categories: { seq: seqOf(sqlite, "Category", categories), items: categories } satisfies Table<Category>,
    services: { seq: seqOf(sqlite, "Service", services), items: services } satisfies Table<Service>,
    settings,
  };
  sqlite.close();
  return result;
}

async function listUploadFiles(dir: string): Promise<{ rel: string; abs: string }[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && UPLOAD_EXTENSIONS.has(e.name.split(".").pop()?.toLowerCase() ?? ""))
    .map((e) => {
      const abs = join(e.parentPath, e.name);
      return { abs, rel: relative(dir, abs).split(sep).join("/") };
    });
}

const data = readDatabase(args.db);
const files = args.uploads ? await listUploadFiles(args.uploads) : [];

console.log(
  `categories=${data.categories.items.length} (seq ${data.categories.seq}), ` +
    `services=${data.services.items.length} (seq ${data.services.seq}), ` +
    `settings=${Object.keys(data.settings).length}, uploads=${files.length}`
);

// 引用了本站上传路径但文件不在上传目录里的图标, 迁移后会 404, 提前列出来
const uploadedPaths = new Set(files.map((f) => "/uploads/" + f.rel));
for (const item of [...data.categories.items, ...data.services.items]) {
  if (item.icon?.startsWith("/uploads/") && !uploadedPaths.has(item.icon)) {
    console.warn(`icon not in uploads dir (ok if bundled in frontend/public): #${item.id} ${item.name} ${item.icon}`);
  }
}

if (args["dry-run"]) {
  const out = args.out!;
  await mkdir(out, { recursive: true });
  await writeFile(join(out, "categories.json"), JSON.stringify(data.categories, null, 2));
  await writeFile(join(out, "services.json"), JSON.stringify(data.services, null, 2));
  await writeFile(join(out, "settings.json"), JSON.stringify(data.settings, null, 2));
  console.log(`dry run: wrote JSON to ${out}, Blob untouched`);
  process.exit(0);
}

const projectId = process.env.EDGEONE_PROJECT_ID;
const token = process.env.EDGEONE_BLOB_TOKEN;
if (!projectId || !token) {
  console.error("missing EDGEONE_PROJECT_ID / EDGEONE_BLOB_TOKEN");
  process.exit(1);
}

const store = getStore({ name: STORE_NAME, projectId, token, consistency: "strong" });

for (const f of files) {
  const buf = await readFile(f.abs);
  await store.set(UPLOAD_PREFIX + f.rel, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, {
    cacheControl: null,
  });
  console.log(`uploaded ${f.rel}`);
}

// 数据最后写, 保证写入后引用的图标都已就位
await store.setJSON(KEYS.settings, data.settings, { cacheControl: null });
await store.setJSON(KEYS.categories, data.categories, { cacheControl: null });
await store.setJSON(KEYS.services, data.services, { cacheControl: null });

const check = (await store.get(KEYS.services, { type: "json" })) as Table<Service> | null;
if (check?.items.length !== data.services.items.length) {
  throw new Error(`verify failed: expected ${data.services.items.length} services, got ${check?.items.length}`);
}
console.log("migration done, verified services count");
