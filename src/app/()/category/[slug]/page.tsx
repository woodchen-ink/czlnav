import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ServiceCard from "@/components/ServiceCard";
import Link from "next/link";
import { Category, Service } from "@/types";
import { getSiteSettings } from "@/utils/settings";
import Image from "next/image";
import { NoData } from "@/components/icons/NoData";
import Pagination from "@/components/Pagination";

// 每页显示的数据条数
const PAGE_SIZE = 24;

// 设置页面缓存，提高访问速度
export const revalidate = 3600; // 1小时重新验证

// 定义路由参数类型
export interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// 动态生成元数据
export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  // 解析Promise获取参数
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 解析searchParams
  await searchParams;

  // 查找分类
  const category = (await prisma.category.findUnique({
    where: { slug: slug } as { slug: string },
  })) as unknown as Category | null;

  if (!category) {
    return {
      title: "分类不存在",
    };
  }

  // 获取网站设置
  const settings = await getSiteSettings();

  // 使用分类的 SEO 设置，如果没有则使用默认值
  const title = category.seoTitle || `${category.name} - ${settings.siteName}`;
  const description =
    category.seoDescription ||
    category.description ||
    `${category.name}分类下的AI服务和应用`;
  const keywords = category.seoKeywords || settings.seoKeywords;

  return {
    title: title,
    description: description,
    keywords: keywords,
  };
}

// 获取分类下的服务总数
async function getServiceCount(categoryId: number): Promise<number> {
  const count = await prisma.service.count({
    where: {
      categoryId: categoryId,
    },
  });

  return count;
}

// 获取分类及其网站（带分页）
async function getCategoryWithServices(
  slug: string,
  page: number = 1
): Promise<{
  category: Category | null;
  services: Service[];
  totalCount: number;
  totalPages: number;
}> {
  // 获取分类信息
  const category = (await prisma.category.findUnique({
    where: { slug: slug } as { slug: string },
  })) as unknown as Category | null;

  if (!category) {
    return {
      category: null,
      services: [],
      totalCount: 0,
      totalPages: 0,
    };
  }

  // 获取服务总数
  const totalCount = await getServiceCount(category.id);

  // 计算总页数
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // 确保页码有效
  const validPage = Math.max(1, Math.min(page, totalPages || 1));

  // 获取当前页的服务，只按sortOrder排序
  const services = (await prisma.service.findMany({
    where: {
      categoryId: category.id,
    },
    skip: (validPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    orderBy: {
      sortOrder: "asc",
    },
  })) as unknown as Service[];

  return {
    category: {
      ...category,
      services: [],
    },
    services,
    totalCount,
    totalPages,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  // 解析Promise获取参数
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  // 解析searchParams
  const resolvedSearchParams = await searchParams;
  const pageParam = resolvedSearchParams.page;
  const page = pageParam
    ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam)
    : 1;

  // 获取分类及其服务
  const { category, services, totalCount, totalPages } =
    await getCategoryWithServices(slug, page);

  // 如果分类不存在，返回404
  if (!category) {
    notFound();
  }

  return (
    <div className="relative min-h-screen">
      {/* 背景图片 */}
      <div className="fixed inset-0 z-[-2]">
        <Image
          src="https://random-api.czl.net/pic/normal"
          alt="background"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
          priority
          unoptimized
        />
      </div>

      {/* 暗色蒙版和模糊效果 - 增强沉浸式科技氛围 */}
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-black/50 via-black/60 to-black/70 backdrop-blur-md">
        {/* 科技网格背景 */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>

        {/* 动态光晕效果 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-pink-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-[960px] relative z-10">
        <div className="pl-4 relative -bottom-1">
          <Link
            href="/"
            className="text-white/70 hover:text-white bg-white/10 backdrop-blur-xl border border-white/20 hover:border-white/40 pl-2 pr-3.5 py-2 rounded-t-lg text-sm inline-flex items-center transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-white/70"
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

        <div className="liquid-glass bg-white/10 border-0 rounded-lg shadow-2xl p-6 mb-6">
          <div className="flex sm:flex-row flex-col items-center justify-center sm:justify-start relative z-10">
            <h1 className="text-3xl font-bold flex items-center text-white">
              {category.icon ? (
                <div className="relative w-10 h-10 mr-2 flex-shrink-0">
                  <Image
                    src={category.icon}
                    alt={category.name}
                    fill
                    className="object-contain"
                    unoptimized={category.icon.endsWith(".svg")}
                    priority
                  />
                </div>
              ) : (
                <div className="w-10 h-10 mr-2 flex items-center justify-center bg-white/20 rounded-full flex-shrink-0">
                  <span className="text-lg font-bold text-white">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="ml-1">{category.name}</span>
            </h1>

            {category.description && (
              <div className="mt-2 sm:mt-0 ml-0 sm:ml-8 text-center">
                <p className="text-white/70 leading-relaxed">
                  {category.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white/70">
            共 <span className="font-medium text-white">{totalCount}</span>{" "}
            个网站 {totalPages > 1 && `(第 ${page}/${totalPages} 页)`}
          </h3>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="liquid-glass bg-white/10 border-0 rounded-lg shadow-2xl p-10 text-center flex flex-col items-center justify-center">
            <div className="relative z-10">
              <NoData />
              <p className="text-white/70 mt-8">该分类下暂无数据</p>
            </div>
          </div>
        )}

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl={`/c/${slug}`}
              queryParams={{}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
