// 构建期站点数据, 由 scripts/build-site-data.ts 生成 src/data/site.json.
// 只在服务端组件 (构建时) 引用, 客户端组件通过 props 拿到需要的部分.
import data from "@/data/site.json";

export interface PublicService {
  id: number;
  name: string;
  url: string;
  description: string;
  icon: string | null;
  categoryId: number;
  categorySlug: string;
}

export interface PublicCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  services: PublicService[];
}

export interface PublicSettings {
  siteName: string;
  siteDescription: string;
  statisticsCode: string;
  seoTitle: string;
  seoKeywords: string;
  seoDescription: string;
}

interface SiteData {
  generatedAt: string;
  settings: PublicSettings;
  categories: PublicCategory[];
}

const site = data as SiteData;

export function getSettings(): PublicSettings {
  return site.settings;
}

export function getCategories(): PublicCategory[] {
  return site.categories;
}

export function getCategory(slug: string): PublicCategory | undefined {
  return site.categories.find((c) => c.slug === slug);
}
