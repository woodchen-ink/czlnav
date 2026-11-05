// Blob 中持久化的数据结构, 字段名与旧 Go/SQLite 版 JSON 输出保持一致, 前端无需改类型.

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: number;
  name: string;
  url: string;
  description: string;
  icon: string | null;
  categoryId: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type Settings = Record<string, string>;

// 自增表: seq 只增不减, 删除记录后 ID 不复用 (与 SQLite AUTOINCREMENT 一致, 避免统计事件里的 id 串号).
export interface Table<T> {
  seq: number;
  items: T[];
}

export const DEFAULT_SETTINGS: Settings = {
  siteName: "CZL导航",
  siteDescription: "一个导航站,包含AI, 国际快递, PDF工具, 图片在线压缩等等工具的导航站",
  statisticsCode: "",
  seoTitle: "",
  seoKeywords: "",
  seoDescription: "",
};

export const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function byCategoryOrder(a: Category, b: Category): number {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}

// 公开端: 同 sortOrder 时新建的排前面 (旧版 ORDER BY sortOrder ASC, id DESC)
export function byServicePublicOrder(a: Service, b: Service): number {
  return a.sortOrder - b.sortOrder || b.id - a.id;
}

// 后台列表: 同 sortOrder 时按 id 升序 (旧版 ORDER BY sortOrder ASC, SQLite 默认 rowid 序)
export function byServiceAdminOrder(a: Service, b: Service): number {
  return a.sortOrder - b.sortOrder || a.id - b.id;
}
