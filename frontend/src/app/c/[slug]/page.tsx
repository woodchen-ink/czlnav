import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryPageClient, { CategoryView } from "@/components/CategoryPageClient";
import { getCategories, getCategory, getSettings } from "@/lib/site-data";

type Params = { slug: string };

// 只生成构建期已有的分类, 其余路径直接 404
export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getCategories().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const category = getCategory((await params).slug);
  if (!category) return {};
  const { siteName } = getSettings();
  return {
    title: { absolute: category.seoTitle || `${category.name} - ${siteName}` },
    description: category.seoDescription || category.description || undefined,
    keywords: category.seoKeywords || undefined,
  };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const category = getCategory((await params).slug);
  if (!category) notFound();

  return (
    <Suspense fallback={<CategoryView category={category} page={1} />}>
      <CategoryPageClient category={category} />
    </Suspense>
  );
}
