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
        defer
        src="https://connect.czl.net/u6pbhv.js"
        data-id="6e2te6mzmi4u"
      />
      <body>{children}</body>
    </html>
  );
}
