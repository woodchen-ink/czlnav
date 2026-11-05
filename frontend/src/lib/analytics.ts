// CZL Connect 统计 (connect.czl.net/docs/analytics.md). 脚本在根布局加载, 被拦截时 window.czl 不存在, 静默跳过.

declare global {
  interface Window {
    czl?: {
      ev: (name: string, props?: Record<string, string | number | boolean>) => void;
    };
  }
}

interface ClickedService {
  id: number;
  name: string;
  categorySlug?: string;
}

// 替代旧版 POST /api/services/:id/click 计数
export function trackServiceClick(service: ClickedService, source: "card" | "search") {
  try {
    window.czl?.ev("service_click", {
      id: service.id,
      name: service.name,
      ...(service.categorySlug ? { category: service.categorySlug } : {}),
      source,
    });
  } catch {
    // 统计失败不影响跳转
  }
}
