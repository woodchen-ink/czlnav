import type { Metadata } from "next";
import { getSiteSettings } from "@/utils/settings";
import { clearCacheOnStartup } from "@/lib/startup-cache-clear";
import Script from "next/script";

// 在应用启动时清除缓存
clearCacheOnStartup();

// 使用动态元数据
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  // 使用 SEO 设置，如果没有则使用默认值
  const title = settings.seoTitle || settings.siteName;
  const description = settings.seoDescription || settings.siteDescription;
  const keywords = settings.seoKeywords;

  return {
    title: {
      absolute: title,
    },
    description: description,
    keywords: keywords,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <Script
        async
        src="https://analytics.czl.net/script.js"
        data-website-id="5703b793-bb32-42df-9bd5-37a43c78f399"
      />
      <body>{children}</body>
    </html>
  );
}
