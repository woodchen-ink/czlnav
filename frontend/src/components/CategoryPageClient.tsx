"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ServiceCard from "@/components/ServiceCard";
import Pagination from "@/components/Pagination";
import { Category, Service } from "@/types";
import { NoData } from "@/components/icons/NoData";
import "@/app/liquid-glass.css";

interface PublicCategoryPayload {
  category: Category;
  services: Service[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export default function CategoryPageClient() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const slug = pathname.replace(/^\/c\//, "").split("/")[0];
  const page = Math.max(1, Number(searchParams.get("page") || "1"));

  const [payload, setPayload] = useState<PublicCategoryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `/api/public/category/${encodeURIComponent(slug)}?page=${page}`
        );
        const data = await response.json();

        if (data.success) {
          setPayload(data.data);
        } else {
          setPayload(null);
        }
      } catch (error) {
        console.error("获取分类数据失败:", error);
        setPayload(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug, page]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        正在加载分类内容...
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        分类不存在或加载失败
      </div>
    );
  }

  const { category, services, totalCount, totalPages, currentPage } = payload;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-[-2]">
        <Image
          src="https://random-api.czl.net/pic/normal"
          alt="background"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
          priority
          unoptimized
        />
      </div>

      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-black/50 via-black/60 to-black/70 backdrop-blur-md">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        ></div>

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-radial from-pink-500/20 via-orange-500/10 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-[960px] relative z-10">
        <div className="pl-4 relative z-10 translate-y-px">
          <Link
            href="/"
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 hover:border-white/30 border-b-0 pl-2 pr-3.5 py-2 rounded-t-lg text-sm inline-flex items-center transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="text-white/70"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            返回首页
          </Link>
        </div>

        <div className="liquid-glass liquid-glass-static rounded-lg rounded-tl-none p-6 mb-6">
          <div className="flex sm:flex-row flex-col items-center justify-center sm:justify-start relative z-10">
            <h1 className="text-3xl font-bold flex items-center text-white">
              {category.icon ? (
                <div className="relative w-10 h-10 mr-2 flex-shrink-0">
                  <Image
                    src={category.icon}
                    alt={category.name}
                    fill
                    className="object-contain"
                    unoptimized={category.icon.endsWith(".svg")}
                    priority
                  />
                </div>
              ) : (
                <div className="w-10 h-10 mr-2 flex items-center justify-center bg-white/20 rounded-full flex-shrink-0">
                  <span className="text-lg font-bold text-white">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="ml-1">{category.name}</span>
            </h1>

            {category.description && (
              <div className="mt-2 sm:mt-0 ml-0 sm:ml-8 text-center">
                <p className="text-white/70 leading-relaxed">
                  {category.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white/70">
            共<span className="font-medium text-white">{totalCount}</span>{" "}
            个网站{totalPages > 1 && `(第 ${currentPage}/${totalPages} 页)`}
          </h3>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <div className="liquid-glass liquid-glass-static rounded-lg p-10 text-center flex flex-col items-center justify-center">
            <div className="relative z-10">
              <NoData />
              <p className="text-white/70 mt-8">该分类下暂无数据</p>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              baseUrl={`/c/${slug}`}
              queryParams={{}}
              pageMode="query"
            />
          </div>
        )}
      </div>
    </div>
  );
}
