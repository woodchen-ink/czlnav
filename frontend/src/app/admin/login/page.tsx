"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查URL参数中的错误信息
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");

    if (errorParam) {
      switch (errorParam) {
        case "oauth_error":
          setError("OAuth认证发生错误，请重试");
          break;
        case "oauth_denied":
          setError("您取消了授权，请重新尝试登录");
          break;
        case "no_code":
          setError("授权失败：未收到授权码");
          break;
        case "invalid_state":
          setError("授权失败：状态验证错误");
          break;
        case "token_exchange_failed":
          setError("令牌交换失败，请重试");
          break;
        case "get_user_failed":
          setError("获取用户信息失败，请重试");
          break;
        case "callback_error":
          setError("授权回调处理失败，请重试");
          break;
        default:
          setError("登录过程中发生未知错误");
      }

      // 清除URL中的错误参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  // CZL Connect OAuth 登录
  const handleCZLLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // 直接跳转到登录API，让服务器处理OAuth流程
      window.location.href = "/api/auth/login";
    } catch (error) {
      console.error("启动CZL Connect登录失败:", error);
      setError("启动CZL Connect登录失败，请重试");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <LogIn className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">管理员登录</CardTitle>
          <p className="text-gray-600">请使用CZL Connect账号登录后台管理系统</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            onClick={handleCZLLogin}
            disabled={loading}
            className="w-full gap-2"
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            {loading ? "登录中..." : "使用 CZL Connect 登录"}
          </Button>

          <div className="text-center text-sm text-gray-500">
            <p>登录后即可访问后台管理功能</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
