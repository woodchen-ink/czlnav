"use client";

import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { PublicSettings } from "@/lib/site-data";

interface PublicSiteShellProps {
  settings: Pick<PublicSettings, "siteName" | "siteDescription" | "statisticsCode">;
  children: React.ReactNode;
}

// 站点设置由服务端布局在构建期传入, 不再运行时请求 /api/settings
export default function PublicSiteShell({ settings, children }: PublicSiteShellProps) {
  // 注册 Service Worker (仅生产环境 + 浏览器支持时)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("Service Worker 注册失败:", err);
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar siteName={settings.siteName} />
      <main className="flex-grow">{children}</main>
      <Footer
        siteDescription={settings.siteDescription}
        statisticsCode={settings.statisticsCode}
      />
    </div>
  );
}
