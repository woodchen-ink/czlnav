import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { verifyAdmin } from "@/utils/czl-auth";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
} from "@/utils/api";

// 下载并保存图标到本地
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { iconUrl } = body;

    if (!iconUrl) {
      return errorResponse("图标URL不能为空");
    }

    // 下载图标并保存到本地
    const localIconUrl = await downloadAndSaveIcon(iconUrl);

    if (!localIconUrl) {
      return errorResponse("下载图标失败");
    }

    return successResponse({ localUrl: localIconUrl });
  } catch (error) {
    console.error("下载图标失败:", error);
    return serverErrorResponse("下载图标失败");
  }
}

// 下载并保存图标的核心函数
async function downloadAndSaveIcon(iconUrl: string): Promise<string | null> {
  try {
    // 创建AbortController用于超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

    // 下载图标
    const response = await fetch(iconUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    // 验证是否为图片类型
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.startsWith("image/")) {
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
    }

    // 生成文件名
    const timestamp = Date.now();
    const fileName = `icon_${timestamp}.${extension}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads", "icons");
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const filePath = join(uploadDir, fileName);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);

    // 返回本地URL
    return `/uploads/icons/${fileName}`;
  } catch (error) {
    console.error("下载图标失败:", error);
    return null;
  }
}
