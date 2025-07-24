"use client";

import React, { createContext, useContext } from "react";
import { toast } from "sonner";
import { Toaster } from "sonner";

// 消息上下文类型
interface MessageAPI {
  success: (content: string) => void;
  error: (content: string) => void;
  warning: (content: string) => void;
  info: (content: string) => void;
}

// 创建消息上下文
const MessageContext = createContext<{ message: MessageAPI } | null>(null);

// 创建一个自定义 hook，方便在组件中使用
export const useAdminApp = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useAdminApp must be used within AdminAppProvider");
  }
  return context;
};

interface AdminAppProviderProps {
  children: React.ReactNode;
}

/**
 * 管理后台专用的 App Provider
 * 提供消息上下文
 */
export default function AdminAppProvider({ children }: AdminAppProviderProps) {
  // 使用 Sonner 实现消息通知
  const message: MessageAPI = {
    success: (content: string) => {
      console.log("SUCCESS:", content);
      toast.success(content);
    },
    error: (content: string) => {
      console.error("ERROR:", content);
      toast.error(content);
    },
    warning: (content: string) => {
      console.warn("WARNING:", content);
      toast.warning(content);
    },
    info: (content: string) => {
      console.info("INFO:", content);
      toast.info(content);
    },
  };

  return (
    <MessageContext.Provider value={{ message }}>
      {children}
      <Toaster position="top-right" richColors closeButton duration={4000} />
    </MessageContext.Provider>
  );
}
