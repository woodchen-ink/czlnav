"use client";

import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminApp } from "@/components/AdminAppProvider";

// 管理员信息类型
interface AdminInfo {
  id: number;
  username: string;
}

export default function AccountPage() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const { message: adminMessage } = useAdminApp();

  // 获取管理员信息
  const fetchAdminInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/account");
      const data = await response.json();

      if (data.success) {
        setAdminInfo(data.data);
      } else {
        adminMessage.error(data.message || "获取账号信息失败");
      }
    } catch (error) {
      console.error("获取账号信息失败:", error);
      adminMessage.error("获取账号信息失败，请稍后重试");
    }
  }, [adminMessage]);

  // 初始加载
  useEffect(() => {
    fetchAdminInfo();
  }, [fetchAdminInfo]);

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">账号管理</h1>

      {adminInfo && (
        <Card>
          <CardHeader>
            <CardTitle>账号信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>管理员ID</Label>
              <p className="text-sm text-gray-600">{adminInfo.id}</p>
            </div>
            <div className="space-y-2">
              <Label>用户名</Label>
              <p className="text-sm text-gray-600">{adminInfo.username}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
