import { db, nextId, now, uploads } from "../store";
import { HttpError, ok, parseId, readJSON } from "../http";
import { has, integer, optionalString, requiredString, sortUpdates } from "../fields";
import { byServiceAdminOrder, type Category, type Service } from "../model";
import type { Handler } from "../router";

function withCategory(svc: Service, categories: Category[]) {
  const cat = categories.find((c) => c.id === svc.categoryId);
  return { ...svc, categoryName: cat?.name ?? "", categorySlug: cat?.slug ?? "" };
}

function requireCategory(categories: Category[], raw: unknown): Category {
  const id = integer(raw, "分类不存在");
  const cat = categories.find((c) => c.id === id);
  if (!cat) throw new HttpError(400, "分类不存在");
  return cat;
}

export const list: Handler = async ({ url }) => {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.max(0, Number(url.searchParams.get("pageSize")) || 0);
  const categoryId = Number(url.searchParams.get("categoryId")) || 0;

  const [categories, services] = await Promise.all([db.categories(), db.services()]);
  const filtered = services.items
    .filter((s) => categoryId <= 0 || s.categoryId === categoryId)
    .sort(byServiceAdminOrder);

  if (pageSize <= 0) return ok(filtered.map((s) => withCategory(s, categories.items)));

  return ok({
    data: filtered.slice((page - 1) * pageSize, page * pageSize).map((s) => withCategory(s, categories.items)),
    pagination: {
      current: page,
      pageSize,
      total: filtered.length,
      pages: Math.ceil(filtered.length / pageSize),
    },
  });
};

export const get: Handler = async ({ params }) => {
  const id = parseId(params.id);
  const [categories, services] = await Promise.all([db.categories(), db.services()]);
  const svc = services.items.find((s) => s.id === id);
  if (!svc) throw new HttpError(404, "服务不存在");
  return ok(withCategory(svc, categories.items));
};

export const create: Handler = async ({ request }) => {
  const input = await readJSON(request);
  const missing = "名称、URL、描述和分类不能为空";
  const name = requiredString(input.name, missing);
  const url = requiredString(input.url, missing);
  const description = requiredString(input.description, missing);
  if (!input.categoryId) throw new HttpError(400, missing);

  const [categories, table] = await Promise.all([db.categories(), db.services()]);
  const cat = requireCategory(categories.items, input.categoryId);

  const sortOrder =
    input.sortOrder !== undefined && input.sortOrder !== null
      ? integer(input.sortOrder)
      : Math.max(0, ...table.items.filter((s) => s.categoryId === cat.id).map((s) => s.sortOrder)) + 1;

  const ts = now();
  const svc: Service = {
    id: nextId(table),
    name,
    url,
    description,
    icon: optionalString(input.icon),
    categoryId: cat.id,
    sortOrder,
    createdAt: ts,
    updatedAt: ts,
  };
  table.items.push(svc);
  await db.saveServices(table);
  return ok(withCategory(svc, categories.items), "创建服务成功");
};

export const update: Handler = async ({ params, request }) => {
  const id = parseId(params.id);
  const input = await readJSON(request);
  const [categories, table] = await Promise.all([db.categories(), db.services()]);
  const svc = table.items.find((s) => s.id === id);
  if (!svc) throw new HttpError(404, "服务不存在");

  const oldIcon = svc.icon;
  if (has(input, "name")) svc.name = requiredString(input.name, "名称不能为空");
  if (has(input, "url")) svc.url = requiredString(input.url, "URL不能为空");
  if (has(input, "description")) svc.description = requiredString(input.description, "描述不能为空");
  if (has(input, "icon")) svc.icon = optionalString(input.icon);
  if (has(input, "categoryId")) svc.categoryId = requireCategory(categories.items, input.categoryId).id;
  if (has(input, "sortOrder")) svc.sortOrder = integer(input.sortOrder);
  svc.updatedAt = now();

  await db.saveServices(table);
  if (oldIcon !== svc.icon) await uploads.removeByPublicPath(oldIcon);
  return ok(withCategory(svc, categories.items), "更新服务成功");
};

export const remove: Handler = async ({ params }) => {
  const id = parseId(params.id);
  const table = await db.services();
  const svc = table.items.find((s) => s.id === id);
  if (!svc) throw new HttpError(404, "服务不存在");

  table.items = table.items.filter((s) => s.id !== id);
  await db.saveServices(table);
  await uploads.removeByPublicPath(svc.icon);
  return ok(null, "删除服务成功");
};

export const reorder: Handler = async ({ request }) => {
  const updates = sortUpdates(await readJSON(request));
  const table = await db.services();
  const ts = now();
  for (const u of updates) {
    const svc = table.items.find((s) => s.id === u.id);
    if (svc) {
      svc.sortOrder = u.sortOrder;
      svc.updatedAt = ts;
    }
  }
  await db.saveServices(table);
  return ok(null, "批量更新排序成功");
};
