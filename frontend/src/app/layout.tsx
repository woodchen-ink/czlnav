import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { getSettings } from "@/lib/site-data";

const settings = getSettings();

export const metadata: Metadata = {
  title: { absolute: settings.seoTitle || settings.siteName },
  description: settings.seoDescription || settings.siteDescription,
  keywords: settings.seoKeywords || undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <Script
        defer
        src="https://connect.czl.net/u6pbhv.js"
        data-id="6e2te6mzmi4u"
      />
      <body>{children}</body>
    </html>
  );
}
