"use client";

// 导入全局样式
import "../globals.css";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  AppWindow,
  Tags,
  User,
  LogOut,
  Settings,
  Home,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import AdminAppProvider from "@/components/AdminAppProvider";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [collapsed, setCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [siteName, setSiteName] = useState("导航");
  const router = useRouter();
  const pathname = usePathname();

  // 处理客户端渲染
  useEffect(() => {
    setIsClient(true);

    // 获取网站设置
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        if (data.success && data.data?.siteName) {
          setSiteName(data.data.siteName);
        }
      } catch (error) {
        console.error("获取网站设置失败:", error);
      }
    };

    fetchSettings();
  }, []);

  // 处理登录页面
  if (pathname === "/admin/login") {
    return (
      <AdminAppProvider>
        <html lang="zh-CN">
          <body>{children}</body>
        </html>
      </AdminAppProvider>
    );
  }

  // 退出登录
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("退出登录失败:", error);
    }
  };

  // 菜单项配置
  const menuItems = [
    {
      key: "/admin",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: "控制面板",
      href: "/admin",
    },
    {
      key: "/admin/categories",
      icon: <Tags className="h-4 w-4" />,
      label: "分类管理",
      href: "/admin/categories",
    },
    {
      key: "/admin/services",
      icon: <AppWindow className="h-4 w-4" />,
      label: "网站管理",
      href: "/admin/services",
    },
    {
      key: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
      label: "网站设置",
      href: "/admin/settings",
    },
    {
      key: "/admin/account",
      icon: <User className="h-4 w-4" />,
      label: "账号管理",
      href: "/admin/account",
    },
  ];

  if (!isClient) {
    return null;
  }

  return (
    <AdminAppProvider>
      <div className="min-h-screen bg-gray-50">
        {/* 侧边栏 */}
        <div
          className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
            collapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Logo 区域 */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200">
            {collapsed ? (
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  {siteName.charAt(0)}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {siteName.charAt(0)}
                  </span>
                </div>
                <span className="font-bold text-lg text-gray-800">
                  {siteName}管理
                </span>
              </div>
            )}
          </div>

          {/* 菜单区域 */}
          <nav className="mt-4 px-2">
            {menuItems.map(item => (
              <Link key={item.key} href={item.href}>
                <div
                  className={`flex items-center px-3 py-2 mb-1 rounded-lg transition-colors cursor-pointer ${
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  {!collapsed && (
                    <span className="ml-3 text-sm font-medium">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </nav>

          {/* 底部区域 */}
          <div className="absolute bottom-4 left-2 right-2">
            <Link href="/" target="_blank">
              <div className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                <Home className="h-4 w-4" />
                {!collapsed && (
                  <span className="ml-3 text-sm font-medium">访问网站</span>
                )}
              </div>
            </Link>
            <div
              onClick={handleLogout}
              className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && (
                <span className="ml-3 text-sm font-medium">退出登录</span>
              )}
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div
          className={`transition-all duration-300 ${
            collapsed ? "ml-16" : "ml-64"
          }`}
        >
          {/* 顶部栏 */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? (
                  <Menu className="h-4 w-4" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
              <div className="text-sm text-gray-500">
                欢迎使用 {siteName} 管理后台
              </div>
            </div>
          </header>

          {/* 内容区域 */}
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AdminAppProvider>
  );
}
