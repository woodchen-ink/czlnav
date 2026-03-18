"use client";

import { useState, useEffect } from "react";
import Logo from "@/components/Logo"; // 确保Logo组件路径正确
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import LiveSearch from "./LiveSearch";

type NavbarProps = {
  siteName: string;
};

export default function Navbar({ siteName }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // 监听滚动事件，用于导航栏样式变化
  useEffect(() => {
    // 只在客户端执行
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // 初始检查滚动位置
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-slate-900 transition-all duration-300 ${
        isScrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 py-4 max-w-[960px]">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* 左侧Logo */}
          <div className="flex items-center mb-4 md:mb-0 md:w-1/4">
            <Link
              href="/"
              className="text-3xl font-bold text-white flex items-center"
            >
              <Logo
                width={40}
                height={40}
                fill="white" // 或者 fill="#ffffff"
                className="mr-1.5"
              />
              <div>{siteName}</div>
            </Link>
          </div>

          {/* 中间搜索框 */}
          <div className="w-full md:w-2/4 px-4 mb-4 md:mb-0 flex justify-center">
            <div className="w-full max-w-xl">
              <LiveSearch />
            </div>
          </div>

          {/* 右侧导航 */}
          <nav className="md:w-1/4 flex justify-end">
            <ul className="flex space-x-6">
              <li className="hidden md:block">
                <Link
                  href="/admin"
                  className={`hover:text-primary transition-colors ${
                    pathname === "/admin"
                      ? "font-medium text-primary"
                      : "text-white"
                  }`}
                  title="管理"
                >
                  <Settings className="h-6 w-6" />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
