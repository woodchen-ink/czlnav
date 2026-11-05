"use client";

import Image from "next/image";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "@/app/liquid-glass.css";
import { trackServiceClick } from "@/lib/analytics";

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

// 使用 React.memo 包装组件，避免不必要的重渲染
const ServiceCard = React.memo(function ServiceCard({
  service,
}: ServiceCardProps) {
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // 图标随预渲染 HTML 直接加载; 水合前就已失败的图片收不到 onError, 这里补查一次
  useEffect(() => {
    setHasError(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth === 0) setHasError(true);
  }, [service.icon]);

  const onClick = useCallback(() => {
    // 只上报统计, 不阻止默认行为, 让浏览器自然打开链接
    trackServiceClick(service, "card");
  }, [service]);

  // 直接使用原始URL,不添加ref参数
  const finalUrl = service.url;

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
      <a
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="liquid-glass rounded-lg cursor-pointer block"
        onClick={onClick}
        title={service.description || service.name}
      >
        <div className="menu-item p-3 flex items-center space-x-2 relative z-10">
          {/* 左侧图标 */}
          <div className="w-10 h-10 relative flex-shrink-0">
            {service.icon && !hasError ? (
              <Image
                ref={imgRef}
                src={service.icon}
                alt={service.name}
                fill
                sizes="40px"
                className="rounded-lg object-contain"
                unoptimized
                // 图标是首屏主体且体积很小 (构建期已压缩), 不走默认的 lazy, 随 HTML 立即加载
                loading="eager"
                onError={() => setHasError(true)}
              />
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
      </a>
    ),
    [service, hasError, onClick, renderInitial, finalUrl]
  );

  return cardContent;
});

// 添加显示名称，便于调试
ServiceCard.displayName = "ServiceCard";

export default ServiceCard;
