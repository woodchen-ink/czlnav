import { db } from "../store";
import { HttpError, ok, readJSON } from "../http";
import { loadSettings } from "./public";
import type { Handler } from "../router";

export const get: Handler = async () => ok(await loadSettings());

export const update: Handler = async ({ request }) => {
  const input = await readJSON(request);
  const current = await db.settings();
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== "string") throw new HttpError(400, "请求数据格式错误");
    current[key] = value;
  }
  await db.saveSettings(current);
  return ok(null, "设置更新成功");
};

export const stats: Handler = async () => {
  const [categories, services] = await Promise.all([db.categories(), db.services()]);
  return ok({
    serviceCount: services.items.length,
    categoryCount: categories.items.length,
  });
};
