import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    absolute: process.env.NEXT_PUBLIC_SITE_NAME || "CZL Nav",
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "CZL Nav 是一个导航网站，收录优质 CZL 服务和应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <Script
        async
        src="https://l.czl.net/script.js"
        data-website-id="5703b793-bb32-42df-9bd5-37a43c78f399"
      />
      <body>{children}</body>
    </html>
  );
}
