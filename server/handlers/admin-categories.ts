import { db, nextId, now, uploads } from "../store";
import { HttpError, ok, parseId, readJSON } from "../http";
import { has, integer, optionalString, requiredString, sortUpdates } from "../fields";
import { SLUG_PATTERN, byCategoryOrder, type Category } from "../model";
import type { Handler } from "../router";

const NULLABLE_FIELDS = ["description", "icon", "seoTitle", "seoDescription", "seoKeywords"] as const;

export const list: Handler = async () => {
  const [categories, services] = await Promise.all([db.categories(), db.services()]);
  return ok(
    [...categories.items].sort(byCategoryOrder).map((c) => ({
      ...c,
      // 后台列表只用来计数, 与旧版 Preload Select("id","categoryId") 一致
      services: services.items.filter((s) => s.categoryId === c.id).map((s) => ({ id: s.id, categoryId: s.categoryId })),
    }))
  );
};

export const get: Handler = async ({ params }) => {
  const id = parseId(params.id);
  const cat = (await db.categories()).items.find((c) => c.id === id);
  if (!cat) throw new HttpError(404, "分类不存在");
  return ok(cat);
};

export const create: Handler = async ({ request }) => {
  const input = await readJSON(request);
  const name = requiredString(input.name, "名称和slug不能为空");
  const slug = requiredString(input.slug, "名称和slug不能为空");
  if (!SLUG_PATTERN.test(slug)) throw new HttpError(400, "slug格式无效，只能包含小写字母、数字和连字符");

  const table = await db.categories();
  if (table.items.some((c) => c.name === name || c.slug === slug)) {
    throw new HttpError(400, "分类名称或slug已存在");
  }

  const sortOrder =
    input.sortOrder !== undefined && input.sortOrder !== null
      ? integer(input.sortOrder)
      : Math.max(0, ...table.items.map((c) => c.sortOrder)) + 10;

  const ts = now();
  const cat: Category = {
    id: nextId(table),
    name,
    slug,
    description: optionalString(input.description),
    icon: optionalString(input.icon),
    sortOrder,
    seoTitle: optionalString(input.seoTitle),
    seoDescription: optionalString(input.seoDescription),
    seoKeywords: optionalString(input.seoKeywords),
    createdAt: ts,
    updatedAt: ts,
  };
  table.items.push(cat);
  await db.saveCategories(table);
  return ok(cat, "创建分类成功");
};

export const update: Handler = async ({ params, request }) => {
  const id = parseId(params.id);
  const input = await readJSON(request);
  const table = await db.categories();
  const cat = table.items.find((c) => c.id === id);
  if (!cat) throw new HttpError(404, "分类不存在");

  if (has(input, "slug")) {
    const slug = requiredString(input.slug, "slug格式无效");
    if (!SLUG_PATTERN.test(slug)) throw new HttpError(400, "slug格式无效");
    if (table.items.some((c) => c.slug === slug && c.id !== id)) throw new HttpError(400, "slug已被其他分类使用");
    cat.slug = slug;
  }
  if (has(input, "name")) {
    const name = requiredString(input.name, "名称不能为空");
    if (table.items.some((c) => c.name === name && c.id !== id)) throw new HttpError(400, "名称已被其他分类使用");
    cat.name = name;
  }
  if (has(input, "sortOrder")) cat.sortOrder = integer(input.sortOrder);
  for (const field of NULLABLE_FIELDS) {
    if (has(input, field)) cat[field] = optionalString(input[field]);
  }
  cat.updatedAt = now();

  await db.saveCategories(table);
  return ok(cat, "更新分类成功");
};

export const remove: Handler = async ({ params }) => {
  const id = parseId(params.id);
  const [table, services] = await Promise.all([db.categories(), db.services()]);
  const cat = table.items.find((c) => c.id === id);
  if (!cat) throw new HttpError(404, "分类不存在");

  // 旧版 SQLite 外键 ON DELETE RESTRICT 会拒绝删除, 但 Go 未检查错误照样返回成功; 这里明确拒绝.
  if (services.items.some((s) => s.categoryId === id)) {
    throw new HttpError(400, "该分类下还有服务，请先删除或移动这些服务");
  }

  table.items = table.items.filter((c) => c.id !== id);
  await db.saveCategories(table);
  await uploads.removeByPublicPath(cat.icon);
  return ok(null, "删除分类成功");
};

export const reorder: Handler = async ({ request }) => {
  const updates = sortUpdates(await readJSON(request));
  const table = await db.categories();
  const ts = now();
  for (const u of updates) {
    const cat = table.items.find((c) => c.id === u.id);
    if (cat) {
      cat.sortOrder = u.sortOrder;
      cat.updatedAt = ts;
    }
  }
  await db.saveCategories(table);
  return ok(null, "批量更新排序成功");
};
