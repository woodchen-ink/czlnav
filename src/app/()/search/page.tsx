import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import ServiceCard from "@/components/ServiceCard";
import { getSiteSettings } from "@/utils/settings";
import env from "@/lib/env";

// 服务类型定义
type Service = {
  id: number;
  name: string;
  url: string;
  description: string;
  icon: string | null;
  clickCount: number;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
};

// 定义页面参数类型
interface SearchPageProps {
  params: Promise<Record<string, never>>; // 空参数对象，因为搜索页面没有路由参数
  searchParams: Promise<{ q?: string }>;
}

// 动态生成元数据
export async function generateMetadata({
  searchParams,
  params,
}: SearchPageProps): Promise<Metadata> {
  // 解析Promise获取参数
  await params;

  // 解析searchParams
  const resolvedSearchParams = await searchParams;

  // 获取网站设置
  const settings = await getSiteSettings();
  const query = resolvedSearchParams?.q || "";

  let title = `搜索 - ${settings.siteName}`;
  if (query) {
    title = `${query} - 搜索结果 - ${settings.siteName}`;
  }

  return {
    title,
    description: settings.siteDescription,
  };
}

// 搜索服务
async function searchServices(query: string): Promise<Service[]> {
  if (!query) return [];

  try {
    // 构建搜索URL
    const searchUrl = `${env.API_URL}/search?q=${encodeURIComponent(query)}`;

    // 使用搜索API
    const response = await fetch(searchUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!data.success) {
      return [];
    }

    return data.data.data;
  } catch {
    return [];
  }
}

// 使用正确的Next.js 15参数类型
export default async function SearchPage({
  searchParams,
  params,
}: SearchPageProps) {
  // 解析Promise获取参数
  await params;

  // 解析searchParams
  const resolvedSearchParams = await searchParams;

  // 从 searchParams 获取查询参数
  const query =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";

  // 如果没有查询参数，重定向到首页
  if (!query) {
    redirect("/");
  }

  // 搜索网站
  const services = await searchServices(query);

  // 按分类分组
  const servicesByCategory: Record<string, Service[]> = {};
  services.forEach(service => {
    const categoryName = service.categoryName || "未分类";
    if (!servicesByCategory[categoryName]) {
      servicesByCategory[categoryName] = [];
    }
    servicesByCategory[categoryName].push(service);
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-[960px]">
      <div className="pl-4 relative -bottom-1">
        <Link
          href="/"
          className="text-brand-300 hover:text-brand-400 bg-white bg-opacity-80 pl-2 pr-3.5 py-2 rounded-t-lg text-sm inline-flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-brand-300"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          返回首页
        </Link>
      </div>

      <div className="bg-white bg-opacity-60 rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold">
          搜索 <span className="text-brand-400">&quot;{query}&quot;</span>{" "}
          共找到{" "}
          <span className="font-medium text-brand-400">{services.length}</span>{" "}
          个结果
        </h1>
      </div>

      {/* 搜索结果 */}
      {services.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(servicesByCategory).map(
            ([categoryName, categoryServices]) => (
              <div
                key={categoryName}
                className="bg-white bg-opacity-60 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                  <span>{categoryName}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({categoryServices.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categoryServices.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="bg-white bg-opacity-60 rounded-lg shadow-sm p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            未找到相关结果
          </h2>
          <p className="text-gray-500 mb-6">
            没有找到与&quot;{query}&quot;相关的服务
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-brand-400 text-white rounded-md hover:bg-brand-500 transition-colors"
          >
            返回首页
          </Link>
        </div>
      )}
    </div>
  );
}
