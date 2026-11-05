import { db } from "../store";
import { HttpError, ok } from "../http";
import { DEFAULT_SETTINGS, byCategoryOrder, byServiceAdminOrder, byServicePublicOrder } from "../model";
import type { Handler } from "../router";

const CATEGORY_PAGE_SIZE = 24;
const SEARCH_LIMIT = 8;

export const health: Handler = () => ok({ status: "healthy", timestamp: new Date().toISOString() });

export async function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...(await db.settings()) };
}

export const settings: Handler = async () => ok(await loadSettings());

export const home: Handler = async () => {
  const [categories, services] = await Promise.all([db.categories(), db.services()]);
  const sorted = [...services.items].sort(byServicePublicOrder);
  return ok({
    categories: [...categories.items].sort(byCategoryOrder).map((c) => ({
      ...c,
      services: sorted.filter((s) => s.categoryId === c.id),
    })),
  });
};

export const category: Handler = async ({ params, url }) => {
  const slug = params.slug.trim();
  if (!slug) throw new HttpError(400, "分类 slug 不能为空");

  let page = 1;
  const rawPage = url.searchParams.get("page")?.trim();
  if (rawPage) {
    page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) throw new HttpError(400, "无效的页码");
  }

  const [categories, services] = await Promise.all([db.categories(), db.services()]);
  const cat = categories.items.find((c) => c.slug === slug);
  if (!cat) throw new HttpError(404, "分类不存在");

  const items = services.items.filter((s) => s.categoryId === cat.id).sort(byServicePublicOrder);
  const totalPages = Math.max(1, Math.ceil(items.length / CATEGORY_PAGE_SIZE));
  page = Math.min(page, totalPages);

  return ok({
    category: cat,
    services: items.slice((page - 1) * CATEGORY_PAGE_SIZE, page * CATEGORY_PAGE_SIZE),
    currentPage: page,
    totalPages,
    totalCount: items.length,
  });
};

export const liveSearch: Handler = async ({ url }) => {
  const query = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  if (!query) return ok([]);

  const [categories, services] = await Promise.all([db.categories(), db.services()]);
  const catById = new Map(categories.items.map((c) => [c.id, c]));

  const results = services.items
    .filter((s) => s.name.toLowerCase().includes(query) || s.description.toLowerCase().includes(query))
    .sort(byServiceAdminOrder)
    .slice(0, SEARCH_LIMIT)
    .map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      description: s.description,
      icon: s.icon,
      categoryId: s.categoryId,
      categoryName: catById.get(s.categoryId)?.name ?? "",
      categorySlug: catById.get(s.categoryId)?.slug ?? "",
    }));

  return ok(results);
};
