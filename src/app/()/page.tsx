import { prisma } from "@/lib/prisma";
import CategorySection from "@/components/CategorySection";
import { Category } from "@/types";
import SmoothScrollScript from "@/components/SmoothScrollScript";
import BackToTopButton from "@/components/BackToTopButton";
import CategoryNavStyles from "@/components/CategoryNavStyles";
// import CategoryIcon from "@/components/CategoryIcon";
import { Prisma } from "@prisma/client";
import Image from "next/image";

// 使用ISR缓存 - 构建时可能为空，运行时获取真实数据
export const revalidate = 60; // 60秒重新验证

// 获取所有分类及其网站
async function getCategoriesWithServices(): Promise<Category[]> {
  try {
    // 构建时如果数据库不可用，返回空数组
    const categories = await prisma.category.findMany({
      include: {
        services: {
          orderBy: {
            sortOrder: "asc",
          } as Prisma.ServiceOrderByWithRelationInput,
        },
      },
      orderBy: {
        sortOrder: "asc",
      } as Prisma.CategoryOrderByWithRelationInput,
    });

    return categories as unknown as Category[];
  } catch {
    // 构建时数据库可能不可用，返回空数组让构建成功
    console.log("Database not available during build, returning empty array");
    return [];
  }
}

export default async function Home() {
  const categories = await getCategoriesWithServices();

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

        {/* SVG科技装饰元素 */}
        <svg
          className="absolute top-10 right-10 w-32 h-32 opacity-20"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="20" className="tech-svg-outline" />
          <circle cx="50" cy="50" r="30" className="tech-svg-outline" />
          <line x1="30" y1="50" x2="70" y2="50" className="tech-svg-outline" />
          <line x1="50" y1="30" x2="50" y2="70" className="tech-svg-outline" />
        </svg>

        <svg
          className="absolute bottom-20 left-20 w-24 h-24 opacity-15"
          viewBox="0 0 100 100"
        >
          <polygon points="50,15 85,75 15,75" className="tech-svg-outline" />
          <circle cx="50" cy="50" r="5" fill="rgba(255,255,255,0.3)" />
        </svg>
      </div>

      {/* 浮动侧边栏 - 向左调整，避免覆盖主内容 */}
      <div className="hidden xl:block fixed left-[max(16px,calc(50%-720px))] top-[100px] w-60 z-10">
        <div className="liquid-glass bg-white/10 border-0 rounded-xl shadow-2xl">
          {/* 侧边栏标题 */}
          <div className="bg-white/5 backdrop-blur-sm px-6 py-4 border-b border-white/10 relative z-10">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse"></div>
              分类导航
            </h2>
            <p className="text-xs text-white/70 mt-1">选择分类快速跳转</p>
          </div>

          {/* 分类列表 */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="p-3 space-y-1">
              {categories.map((category, index) => (
                <a
                  key={category.id}
                  href={`#category-${category.slug}`}
                  className="category-nav-link loaded menu-item group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border border-transparent hover:border-white/20 relative overflow-hidden backdrop-blur-sm"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* 背景光效 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* 图标容器 */}
                  {/* <div className="category-icon-container relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-muted/30 group-hover:bg-primary/10 transition-colors duration-200">
                    <CategoryIcon
                      icon={category.icon}
                      name={category.name}
                      size={18}
                    />
                  </div> */}

                  {/* 分类信息 */}
                  <div className="flex-1 min-w-0">
                    <span className="category-name block text-sm font-medium text-white/90 group-hover:text-white transition-colors duration-200 truncate">
                      {category.name}
                    </span>
                    <span className="block text-xs text-white/60 mt-0.5">
                      {category.services?.length || 0} 个网站
                    </span>
                  </div>

                  {/* 箭头指示器 */}
                  <div className="arrow-indicator flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg
                      className="w-4 h-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>

                  {/* 活跃状态指示器 */}
                  <div className="active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-primary rounded-r-full transition-all duration-300"></div>
                </a>
              ))}
            </div>
          </div>

          {/* 底部操作区 */}
          <div className="border-t border-white/10 bg-white/5 p-4 relative z-10">
            <BackToTopButton className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200 group backdrop-blur-sm">
              <svg
                className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
              返回顶部
            </BackToTopButton>
          </div>
        </div>
      </div>

      {/* 主内容区域 - 保持原来的居中布局 */}
      <div className="container mx-auto px-4 py-8 max-w-[960px]">
        {/* 移动端分类导航 */}
        <div className="xl:hidden mb-10">
          <div className="liquid-glass bg-white/10 border-0 rounded-xl shadow-2xl">
            {/* 移动端标题 */}
            <div className="bg-white/5 backdrop-blur-sm px-6 py-4 border-b border-white/10 relative z-10">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse"></div>
                分类导航
              </h2>
              <p className="text-sm text-white/70 mt-1">选择分类快速跳转</p>
            </div>

            {/* 移动端分类网格 */}
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((category, index) => (
                  <a
                    key={category.id}
                    href={`#category-${category.slug}`}
                    className="category-nav-link loaded menu-item group flex flex-col items-center gap-2 p-4 bg-white/10 border border-white/20 hover:border-white/40 rounded-lg transition-all duration-200 hover:shadow-lg backdrop-blur-sm relative z-10"
                    data-category-id={`category-${category.slug}`}
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    {/* 图标容器 */}
                    {/* <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 group-hover:bg-primary/10 transition-colors duration-200">
                      <CategoryIcon
                        icon={category.icon}
                        name={category.name}
                        size={22}
                      />
                    </div> */}

                    {/* 分类名称 */}
                    <div className="text-center">
                      <span className="block text-sm font-medium text-white/90 group-hover:text-white transition-colors duration-200">
                        {category.name}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 所有分类及网站 */}
        <div className="space-y-10">
          {categories.map(category => (
            <CategorySection
              key={category.id}
              category={category}
              services={category.services || []}
            />
          ))}
        </div>
      </div>

      {/* 移动端返回顶部按钮 */}
      <div className="xl:hidden fixed bottom-6 right-6 z-50">
        <div className="liquid-glass group w-14 h-14 rounded-2xl bg-white/15 border-0 shadow-2xl hover:shadow-3xl hover:bg-white/25 transition-all duration-300 hover:scale-105">
          <BackToTopButton className="flex items-center justify-center w-full h-full text-white/70 hover:text-white relative z-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 group-hover:-translate-y-0.5 transition-transform duration-200"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </BackToTopButton>
        </div>
      </div>

      {/* 添加分类导航样式 */}
      <CategoryNavStyles />

      {/* 添加玻璃光效样式 */}

      {/* 添加平滑滚动功能 */}
      <SmoothScrollScript />
    </div>
  );
}
