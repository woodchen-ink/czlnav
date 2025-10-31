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
        id="clarity-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
              (function(c,l,a,r,i,t,y){
                c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
                t=l.createElement(r);t.async=1;t.src="https://analytics.czl.net/ms/t.js?id="+ i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "tyqyu4sbrn");
            `,
        }}
      />
      <body>{children}</body>
    </html>
  );
}
