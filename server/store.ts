import { getStore, type Store, type StoreOptions } from "@edgeone/pages-blob";
import type { Category, Service, Settings, Table } from "./model";

// 唯一数据源. 所有读写都走强一致, 写完下一次读必定可见.
// 数据量很小 (百级记录), 每张表一个 JSON 文档; 只有管理员写, 不存在并发覆盖问题.
const STORE_NAME = "czlnav";

export const KEYS = {
  categories: "db/categories.json",
  services: "db/services.json",
  settings: "db/settings.json",
} as const;

export const UPLOAD_PREFIX = "uploads/";

let store: Store | null = null;

function blob(): Store {
  // SDK 类型把 projectId/token 标成必填, 但在 Makers Functions 内由平台注入凭据, 只需 name.
  store ??= getStore({ name: STORE_NAME, consistency: "strong" } as StoreOptions);
  return store;
}

async function readTable<T>(key: string): Promise<Table<T>> {
  const table = (await blob().get(key, { type: "json" })) as Table<T> | null;
  return table ?? { seq: 0, items: [] };
}

async function writeTable<T>(key: string, table: Table<T>): Promise<void> {
  await blob().setJSON(key, table, { cacheControl: null });
}

export const db = {
  categories: () => readTable<Category>(KEYS.categories),
  services: () => readTable<Service>(KEYS.services),
  saveCategories: (t: Table<Category>) => writeTable(KEYS.categories, t),
  saveServices: (t: Table<Service>) => writeTable(KEYS.services, t),

  async settings(): Promise<Settings> {
    return ((await blob().get(KEYS.settings, { type: "json" })) as Settings | null) ?? {};
  },
  async saveSettings(settings: Settings): Promise<void> {
    await blob().setJSON(KEYS.settings, settings, { cacheControl: null });
  },
};

// 上传文件: 对外路径 /uploads/<rel>, Blob key uploads/<rel>
export const uploads = {
  async put(rel: string, data: ArrayBuffer): Promise<string> {
    await blob().set(UPLOAD_PREFIX + rel, data, { cacheControl: null });
    return "/uploads/" + rel;
  },
  async get(rel: string): Promise<ArrayBuffer | null> {
    return blob().get(UPLOAD_PREFIX + rel, { type: "arrayBuffer" });
  },
  // 只删除本站上传的图标; 外链图标与打包进静态资源的历史图标不动.
  async removeByPublicPath(publicPath: string | null): Promise<void> {
    if (!publicPath?.startsWith("/uploads/")) return;
    const rel = publicPath.slice("/uploads/".length);
    if (!rel || rel.includes("..")) return;
    try {
      await blob().delete(UPLOAD_PREFIX + rel);
    } catch (err) {
      console.error("delete upload failed", publicPath, err);
    }
  },
};

export function nextId<T>(table: Table<T>): number {
  table.seq += 1;
  return table.seq;
}

export function now(): string {
  return new Date().toISOString();
}
