import { prisma } from "@/lib/prisma";
import CategorySection from "@/components/CategorySection";
import { Category } from "@/types";
import SmoothScrollScript from "@/components/SmoothScrollScript";
import BackToTopButton from "@/components/BackToTopButton";
import CategoryNavStyles from "@/components/CategoryNavStyles";
// import CategoryIcon from "@/components/CategoryIcon";
import { Prisma } from "@prisma/client";

// 设置 ISR 缓存 - 页面将在首次访问时生成，然后缓存1小时
export const revalidate = 3600; // 1小时重新验证

// 获取所有分类及其网站
async function getCategoriesWithServices(): Promise<Category[]> {
  const categories = await prisma.category.findMany({
    include: {
      services: {
        take: 12,
        orderBy: [
          { sortOrder: "asc" },
          { clickCount: "desc" },
        ] as Prisma.ServiceOrderByWithRelationInput[],
      },
    },
    orderBy: {
      sortOrder: "asc",
    } as Prisma.CategoryOrderByWithRelationInput,
  });

  return categories as unknown as Category[];
}

export default async function Home() {
  const categories = await getCategoriesWithServices();

  return (
    <div className="relative">
      {/* 浮动侧边栏 - 向左调整，避免覆盖主内容 */}
      <div className="hidden xl:block fixed left-[max(16px,calc(50%-720px))] top-[100px] w-60 z-10">
        <div className="sidebar-container bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-lg overflow-hidden">
          {/* 侧边栏标题 */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              分类导航
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              选择分类快速跳转
            </p>
          </div>

          {/* 分类列表 */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="p-3 space-y-1">
              {categories.map((category, index) => (
                <a
                  key={category.id}
                  href={`#category-${category.slug}`}
                  className="category-nav-link loaded group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-muted/50 hover:shadow-sm border border-transparent hover:border-muted relative overflow-hidden"
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
                    <span className="category-name block text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                      {category.name}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
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
          <div className="border-t border-border bg-muted/20 p-4">
            <BackToTopButton className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-background hover:bg-muted border border-border hover:border-primary/30 rounded-lg transition-all duration-200 group">
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
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-lg overflow-hidden">
            {/* 移动端标题 */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                分类导航
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                选择分类快速跳转
              </p>
            </div>

            {/* 移动端分类网格 */}
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categories.map((category, index) => (
                  <a
                    key={category.id}
                    href={`#category-${category.slug}`}
                    className="category-nav-link loaded group flex flex-col items-center gap-2 p-4 bg-background hover:bg-muted/50 border border-border hover:border-primary/30 rounded-lg transition-all duration-200 hover:shadow-md"
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
                      <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        {category.name}
                      </span>
                      <span className="block text-xs text-muted-foreground mt-0.5">
                        {category.services?.length || 0}个
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
        <BackToTopButton className="group flex items-center justify-center w-14 h-14 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-xl hover:shadow-2xl text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105">
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

      {/* 添加分类导航样式 */}
      <CategoryNavStyles />

      {/* 添加平滑滚动功能 */}
      <SmoothScrollScript />
    </div>
  );
}
