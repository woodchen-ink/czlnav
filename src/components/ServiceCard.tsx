"use client";

import Image from "next/image";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useServiceClick } from "@/hooks/useServiceClick";
import GlassEffects from "./GlassEffects";

// 定义Service类型
type Service = {
  id: number;
  name: string;
  url: string;
  description: string;
  icon: string | null;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

interface ServiceCardProps {
  service: Service;
}

// 创建一个图片缓存对象
const imageCache: Record<string, boolean> = {};

// 使用 React.memo 包装组件，避免不必要的重渲染
const ServiceCard = React.memo(function ServiceCard({
  service,
}: ServiceCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const handleServiceClick = useServiceClick();

  // 图片加载处理
  useEffect(() => {
    let isSubscribed = true;

    // 重置状态
    setIsImageLoaded(false);
    setHasError(false);

    // 如果没有图标，直接返回
    if (!service.icon) return;

    // 检查缓存
    if (imageCache[service.icon]) {
      setIsImageLoaded(true);
      return;
    }

    // 预加载图片
    const img = new window.Image();
    img.src = service.icon;

    const handleLoad = () => {
      if (isSubscribed) {
        imageCache[service.icon!] = true;
        setIsImageLoaded(true);
      }
    };

    const handleError = () => {
      if (isSubscribed) {
        setHasError(true);
        setIsImageLoaded(true); // 即使出错也标记为已加载，以隐藏loading状态
      }
    };

    // 如果图片已经加载完成（在缓存中）
    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener("load", handleLoad);
      img.addEventListener("error", handleError);
    }

    // 清理函数
    return () => {
      isSubscribed = false;
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [service.icon]);

  const onClick = useCallback(() => {
    handleServiceClick(service.id, service.url);
  }, [handleServiceClick, service.id, service.url]);

  // 渲染首字母图标
  const renderInitial = useCallback(
    () => (
      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-primary text-xl font-bold">
        {service.name.charAt(0).toUpperCase()}
      </div>
    ),
    [service.name]
  );

  // 使用 useMemo 缓存卡片内容
  const cardContent = useMemo(
    () => (
      <div
        className="glass-container bg-white/15 backdrop-blur-xl border-0 rounded-lg shadow-xl outline-2 outline-none hover:outline-white/40 hover:bg-white/25 transition-all duration-300 cursor-pointer"
        onClick={onClick}
        title={service.description || service.name}
      >
        <div className="corner-light-br"></div>
        <div className="edge-glow"></div>
        <div className="shimmer-effect"></div>
        <div className="p-3 flex items-center space-x-2 relative z-10">
          {/* 左侧图标 */}
          <div className="w-10 h-10 relative flex-shrink-0">
            {/* 加载中显示loading样式 */}
            {service.icon && !isImageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg z-20">
                <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
              </div>
            )}

            {/* 图标显示 */}
            {service.icon && !hasError ? (
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
              >
                <Image
                  src={service.icon}
                  alt={service.name}
                  fill
                  className="rounded-lg object-contain"
                  unoptimized={service.icon.endsWith(".svg")}
                />
              </div>
            ) : (
              renderInitial()
            )}
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white/95 truncate">
              {service.name}
            </h3>
            <p className="text-sm text-white/70 line-clamp-1">
              {service.description}
            </p>
          </div>
        </div>
      </div>
    ),
    [service, isImageLoaded, hasError, onClick, renderInitial]
  );

  return (
    <>
      <GlassEffects />
      {cardContent}
    </>
  );
});

// 添加显示名称，便于调试
ServiceCard.displayName = "ServiceCard";

export default ServiceCard;
