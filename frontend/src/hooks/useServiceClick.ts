"use client";

/**
 * 服务点击处理钩子
 * 用于统一处理服务点击统计逻辑
 */
export function useServiceClick() {
  // 设置统一的来源值
  const DEFAULT_REF_SOURCE = "https://nav.czl.net";

  /**
   * 处理服务点击事件
   * @param serviceId 服务ID
   * @param url 服务URL
   * @param options 可选配置项
   */
  const handleServiceClick = async (
    serviceId: number,
    url: string,
    options?: {
      preventDefault?: boolean;
      event?: React.MouseEvent;
      refSource?: string;
    }
  ) => {
    // 如果提供了事件且需要阻止默认行为
    if (options?.preventDefault && options.event) {
      options.event.preventDefault();
    }

    try {
      // 记录点击
      await fetch(`/api/services/${serviceId}/click`, {
        method: "POST",
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("记录点击失败:", error);
      }
      // 在生产环境中静默失败，不影响用户体验
    }

    // 添加来源参数，始终使用默认来源
    const refSource = DEFAULT_REF_SOURCE;

    // 使用字符串拼接方式构建 URL，保持原始格式
    const separator = url.includes("?") ? "&" : "?";
    const finalUrl = `${url}${separator}ref=${refSource}`;

    // 无论记录是否成功，都打开URL
    window.open(finalUrl, "_blank", "noopener,noreferrer");
  };

  return handleServiceClick;
}
