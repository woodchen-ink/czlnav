"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";

interface PublicSettings {
  siteName: string;
  siteDescription: string;
  statisticsCode: string;
}

interface PublicSiteShellProps {
  children: React.ReactNode;
}

const defaultSettings: PublicSettings = {
  siteName: "CZL Nav",
  siteDescription: "CZL Nav 是一个导航网站，收录优质 CZL 服务和应用",
  statisticsCode: "",
};

export default function PublicSiteShell({ children }: PublicSiteShellProps) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (data.success && data.data) {
          setSettings({
            siteName: data.data.siteName || defaultSettings.siteName,
            siteDescription:
              data.data.siteDescription || defaultSettings.siteDescription,
            statisticsCode:
              data.data.statisticsCode || defaultSettings.statisticsCode,
          });
        }
      } catch (error) {
        console.error("获取网站设置失败:", error);
      }
    };

    fetchSettings();
  }, []);

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
      <SmoothScroll />
      <Navbar siteName={settings.siteName} />
      <main className="flex-grow">{children}</main>
      <Footer
        siteDescription={settings.siteDescription}
        statisticsCode={settings.statisticsCode}
      />
    </div>
  );
}
