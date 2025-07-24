// 网络错误类型定义
interface NetworkError {
  code?: string;
  name?: string;
  message?: string;
}

// 类型守卫函数
function isNetworkError(error: unknown): error is NetworkError {
  return typeof error === "object" && error !== null;
}

import { NextRequest } from "next/server";
import { verifyAdmin } from "@/utils/czl-auth";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
} from "@/utils/api";

// 获取网站信息
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return errorResponse("网址不能为空");
    }

    // 验证URL格式
    let targetUrl: URL;
    try {
      targetUrl = new URL(url);
    } catch {
      return errorResponse("无效的网址格式");
    }

    // 确保是HTTP或HTTPS协议
    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      return errorResponse("只支持HTTP和HTTPS协议");
    }

    // 获取网站信息
    const siteInfo = await fetchSiteInfo(targetUrl.href);

    if (!siteInfo) {
      return errorResponse("无法获取网站信息，请检查网址是否正确");
    }

    return successResponse(siteInfo);
  } catch (error) {
    console.error("获取网站信息失败:", error);
    return serverErrorResponse("获取网站信息失败");
  }
}

// 获取网站信息的核心函数
async function fetchSiteInfo(url: string): Promise<{
  title: string;
  description: string;
  icon: string | null;
} | null> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;

      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 增加到15秒超时

      // 设置请求头，模拟浏览器访问
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: controller.signal,
        // 添加更多选项来处理网络问题
        redirect: "follow",
        referrerPolicy: "no-referrer-when-downgrade",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempts < maxAttempts) {
          console.warn(
            `获取网站信息失败 (尝试 ${attempts}/${maxAttempts}), 状态码: ${response.status}, 将重试...`
          );
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // 递增延迟
          continue;
        }
        return null;
      }

      const html = await response.text();
      const baseUrl = new URL(url);

      // 解析HTML获取信息
      const title = extractTitle(html);
      const description = extractDescription(html);
      const icon = await extractIcon(html, baseUrl);

      return {
        title: title || baseUrl.hostname,
        description: description || "",
        icon,
      };
    } catch (error: unknown) {
      console.error(
        `Fetch site info error (尝试 ${attempts}/${maxAttempts}):`,
        error
      );

      if (attempts < maxAttempts) {
        // 如果是网络错误，等待后重试
        if (isNetworkError(error)) {
          if (
            error.code === "ECONNRESET" ||
            error.code === "ENOTFOUND" ||
            error.name === "AbortError"
          ) {
            console.warn(`网络错误，将在 ${attempts * 2} 秒后重试...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // 递增延迟
            continue;
          }
        }
      }

      return null;
    }
  }

  return null;
}

// 提取网站标题
function extractTitle(html: string): string {
  // 尝试多种方式提取标题
  const patterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "";
}

// 提取网站描述
function extractDescription(html: string): string {
  // 尝试多种方式提取描述
  const patterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i,
    /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "";
}

// 提取网站图标
async function extractIcon(html: string, baseUrl: URL): Promise<string | null> {
  // 尝试多种方式提取图标
  const iconPatterns = [
    /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']shortcut icon["'][^>]*href=["']([^"']+)["']/i,
    /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  ];

  for (const pattern of iconPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let iconUrl = match[1].trim();

      // 处理相对URL
      if (iconUrl.startsWith("//")) {
        iconUrl = baseUrl.protocol + iconUrl;
      } else if (iconUrl.startsWith("/")) {
        iconUrl = baseUrl.origin + iconUrl;
      } else if (!iconUrl.startsWith("http")) {
        iconUrl = new URL(iconUrl, baseUrl.href).href;
      }

      // 验证图标URL是否有效
      if (await isValidIcon(iconUrl)) {
        // 下载并保存图标到本地
        const localIconUrl = await downloadAndSaveIcon(iconUrl);
        return localIconUrl || iconUrl; // 如果下载失败，返回原URL作为备用
      }
    }
  }

  // 尝试默认的favicon.ico
  const defaultFavicon = new URL("/favicon.ico", baseUrl.href).href;
  if (await isValidIcon(defaultFavicon)) {
    // 下载并保存图标到本地
    const localIconUrl = await downloadAndSaveIcon(defaultFavicon);
    return localIconUrl || defaultFavicon; // 如果下载失败，返回原URL作为备用
  }

  return null;
}

// 验证图标URL是否有效
async function isValidIcon(iconUrl: string): Promise<boolean> {
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      attempts++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒超时

      const response = await fetch(iconUrl, {
        method: "HEAD",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return false;
      }

      const contentType = response.headers.get("content-type");
      return !!(contentType && contentType.startsWith("image/"));
    } catch (error: unknown) {
      console.warn(
        `验证图标失败 (尝试 ${attempts}/${maxAttempts}):`,
        isNetworkError(error) ? error.message : String(error)
      );
      if (attempts < maxAttempts && isNetworkError(error)) {
        if (error.code === "ECONNRESET" || error.name === "AbortError") {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      return false;
    }
  }

  return false;
}

// 下载并保存图标到本地
async function downloadAndSaveIcon(iconUrl: string): Promise<string | null> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      attempts++;

      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");

      // 创建AbortController用于超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

      // 下载图标
      const response = await fetch(iconUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "image/*,*/*;q=0.8",
          "Accept-Encoding": "gzip, deflate, br",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempts < maxAttempts) {
          console.warn(
            `下载图标失败 (尝试 ${attempts}/${maxAttempts}), 状态码: ${response.status}, 将重试...`
          );
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
        return null;
      }

      // 验证是否为图片类型
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        console.warn("响应不是有效的图片类型:", contentType);
        return null;
      }

      // 获取文件扩展名
      let extension = "png"; // 默认扩展名
      if (contentType.includes("svg")) {
        extension = "svg";
      } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        extension = "jpg";
      } else if (contentType.includes("gif")) {
        extension = "gif";
      } else if (contentType.includes("webp")) {
        extension = "webp";
      } else if (contentType.includes("ico")) {
        extension = "ico";
      }

      // 生成唯一文件名
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileName = `icon_${timestamp}_${randomStr}.${extension}`;

      // 确保上传目录存在
      const uploadDir = join(process.cwd(), "public", "uploads", "icons");
      await mkdir(uploadDir, { recursive: true });

      // 保存文件
      const filePath = join(uploadDir, fileName);
      const buffer = Buffer.from(await response.arrayBuffer());

      if (buffer.length === 0) {
        console.warn("下载的图标文件为空");
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }

      await writeFile(filePath, buffer);

      // 验证文件是否成功写入
      const { existsSync } = await import("fs");
      if (!existsSync(filePath)) {
        console.error("文件写入失败:", filePath);
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }

      console.log(`图标下载成功: ${fileName}, 大小: ${buffer.length} bytes`);

      // 返回本地URL
      return `/uploads/icons/${fileName}`;
    } catch (error: unknown) {
      console.error(
        `下载图标失败 (尝试 ${attempts}/${maxAttempts}):`,
        isNetworkError(error) ? error.message : String(error)
      );

      if (attempts < maxAttempts && isNetworkError(error)) {
        if (
          error.code === "ECONNRESET" ||
          error.code === "ENOTFOUND" ||
          error.name === "AbortError" ||
          error.name === "TimeoutError"
        ) {
          console.warn(`网络错误，将在 ${attempts} 秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          continue;
        }
      }

      return null;
    }
  }

  return null;
}
