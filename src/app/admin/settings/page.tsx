"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Trash2 } from "lucide-react";
import { useAdminApp } from "@/components/AdminAppProvider";

interface SettingsFormValues {
  siteName: string;
  siteDescription: string;
  statisticsCode: string;
  seoTitle: string;
  seoKeywords: string;
  seoDescription: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{
    size: number;
    totalKeys: number;
    keys: string[];
  } | null>(null);
  const [formData, setFormData] = useState<SettingsFormValues>({
    siteName: "",
    siteDescription: "",
    statisticsCode: "",
    seoTitle: "",
    seoKeywords: "",
    seoDescription: "",
  });
  const { message: adminMessage } = useAdminApp();

  // 初始加载
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/settings");
        const data = await response.json();
        if (data.success) {
          setFormData(data.data);
        } else {
          adminMessage.error(data.message || "获取设置失败");
        }
      } catch (error) {
        console.error("获取设置失败:", error);
        adminMessage.error("获取设置失败，请稍后重试");
      } finally {
        setLoading(false);
      }
    };

    const fetchCacheInfo = async () => {
      try {
        const response = await fetch("/api/admin/cache");
        const data = await response.json();
        if (data.success) {
          setCacheInfo(data.data);
        }
      } catch (error) {
        console.error("获取缓存信息失败:", error);
      }
    };

    fetchSettings();
    fetchCacheInfo();
  }, [adminMessage]);

  // 处理表单输入变化
  const handleInputChange = (name: keyof SettingsFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 保存设置
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        adminMessage.success("设置保存成功");
      } else {
        adminMessage.error(data.message || "保存设置失败");
      }
    } catch (error) {
      console.error("保存设置失败:", error);
      adminMessage.error("保存设置失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  // 清除缓存
  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const response = await fetch("/api/admin/cache", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        adminMessage.success("缓存清理成功");
        // 重新获取缓存信息
        const cacheResponse = await fetch("/api/admin/cache");
        const cacheData = await cacheResponse.json();
        if (cacheData.success) {
          setCacheInfo(cacheData.data);
        }
      } else {
        adminMessage.error(data.message || "清理缓存失败");
      }
    } catch (error) {
      console.error("清理缓存失败:", error);
      adminMessage.error("清理缓存失败，请稍后重试");
    } finally {
      setClearingCache(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">网站设置</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="siteName">网站名称</Label>
              <Input
                id="siteName"
                value={formData.siteName}
                onChange={e => handleInputChange("siteName", e.target.value)}
                placeholder="请输入网站名称"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteDescription">网站描述</Label>
              <Textarea
                id="siteDescription"
                value={formData.siteDescription}
                onChange={e =>
                  handleInputChange("siteDescription", e.target.value)
                }
                placeholder="请输入网站描述"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO 设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO 标题</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={e => handleInputChange("seoTitle", e.target.value)}
                placeholder="请输入 SEO 标题"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoKeywords">SEO 关键词</Label>
              <Input
                id="seoKeywords"
                value={formData.seoKeywords}
                onChange={e => handleInputChange("seoKeywords", e.target.value)}
                placeholder="请输入 SEO 关键词，多个关键词用英文逗号分隔"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO 描述</Label>
              <Textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={e =>
                  handleInputChange("seoDescription", e.target.value)
                }
                placeholder="请输入 SEO 描述"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>统计代码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="statisticsCode">统计代码</Label>
              <Textarea
                id="statisticsCode"
                value={formData.statisticsCode}
                onChange={e =>
                  handleInputChange("statisticsCode", e.target.value)
                }
                placeholder="请输入统计代码（如 Google Analytics、百度统计等）"
                rows={6}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>缓存管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">
                {cacheInfo ? (
                  <>
                    <p>缓存项数量: {cacheInfo.size}</p>
                    <p>总键数: {cacheInfo.totalKeys}</p>
                    {cacheInfo.keys.length > 0 && (
                      <p>示例键: {cacheInfo.keys.slice(0, 3).join(", ")}</p>
                    )}
                  </>
                ) : (
                  <p>加载缓存信息中...</p>
                )}
              </div>
              <Button
                type="button"
                variant="destructive"
                onClick={handleClearCache}
                disabled={clearingCache}
                className="w-fit"
              >
                {clearingCache ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                清除所有缓存
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            保存设置
          </Button>
        </div>
      </form>
    </div>
  );
}
