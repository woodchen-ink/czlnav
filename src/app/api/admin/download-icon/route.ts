import { NextRequest } from "next/server";
import { writeFile, mkdir, readFile, unlink } from "fs/promises";
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
    // 首先尝试从URL中获取图标
    let finalIconUrl = iconUrl;

    // 如果传入的不是直接的图片URL，尝试从页面中解析图标
    if (!isDirectImageUrl(iconUrl)) {
      const extractedIconUrl = await extractIconFromPage(iconUrl);
      if (extractedIconUrl) {
        finalIconUrl = extractedIconUrl;
      } else {
        // 如果无法从页面提取图标，尝试常见的favicon路径
        const baseUrl = new URL(iconUrl).origin;
        const commonPaths = [
          "/favicon.ico",
          "/favicon.png",
          "/apple-touch-icon.png",
          "/apple-touch-icon-precomposed.png",
        ];

        for (const path of commonPaths) {
          const testUrl = baseUrl + path;
          if (await isValidIcon(testUrl)) {
            finalIconUrl = testUrl;
            break;
          }
        }
      }
    }

    // 下载图标
    const iconData = await downloadIcon(finalIconUrl);
    if (!iconData) {
      return null;
    }

    // 保存文件
    const savedPath = await saveIconFile(iconData.buffer, iconData.extension);
    return savedPath;
  } catch (error) {
    console.error("下载图标失败:", error);
    return null;
  }
}

// 检查URL是否是直接的图片URL
function isDirectImageUrl(url: string): boolean {
  const imageExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
  ];
  const pathname = new URL(url).pathname.toLowerCase();
  return imageExtensions.some(ext => pathname.endsWith(ext));
}

// 从页面HTML中提取图标URL
async function extractIconFromPage(pageUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const baseUrl = new URL(pageUrl).origin;

    // 按优先级提取图标链接
    const iconSelectors = [
      /<link[^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:apple-touch-icon|apple-touch-icon-precomposed)["']/i,
      /<link[^>]+rel=["']icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']icon["']/i,
      /<link[^>]+rel=["']shortcut icon["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']shortcut icon["']/i,
    ];

    for (const regex of iconSelectors) {
      const match = html.match(regex);
      if (match && match[1]) {
        let iconUrl = match[1];
        // 处理相对URL
        if (iconUrl.startsWith("//")) {
          iconUrl = "https:" + iconUrl;
        } else if (iconUrl.startsWith("/")) {
          iconUrl = baseUrl + iconUrl;
        } else if (!iconUrl.startsWith("http")) {
          iconUrl = baseUrl + "/" + iconUrl;
        }
        return iconUrl;
      }
    }

    return null;
  } catch (error) {
    console.error("从页面提取图标失败:", error);
    return null;
  }
}

// 验证URL是否是有效的图标
async function isValidIcon(iconUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(iconUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get("content-type");
    return contentType
      ? contentType.startsWith("image/") || contentType.includes("icon")
      : false;
  } catch {
    return false;
  }
}

// 下载图标数据
async function downloadIcon(
  iconUrl: string
): Promise<{ buffer: Buffer; extension: string } | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    const response = await fetch(iconUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";

    // 更严格的图片类型验证
    if (!contentType.startsWith("image/") && !contentType.includes("icon")) {
      console.log(`无效的内容类型: ${contentType} for ${iconUrl}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证文件内容是否为有效图片
    if (!isValidImageBuffer(buffer)) {
      console.log(`无效的图片数据 for ${iconUrl}`);
      return null;
    }

    // 获取文件扩展名
    let extension = getFileExtensionFromContentType(contentType);
    if (!extension) {
      extension = detectFileExtensionFromBuffer(buffer);
    }

    return { buffer, extension };
  } catch (error) {
    console.error(`下载图标失败 ${iconUrl}:`, error);
    return null;
  }
}

// 验证buffer是否为有效的图片数据
function isValidImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;

  // 检查常见图片文件的魔数
  const signatures = [
    [0x89, 0x50, 0x4e, 0x47], // PNG
    [0xff, 0xd8, 0xff], // JPEG
    [0x47, 0x49, 0x46], // GIF
    [0x52, 0x49, 0x46, 0x46], // WEBP (RIFF)
    [0x00, 0x00, 0x01, 0x00], // ICO
    [0x3c, 0x3f, 0x78, 0x6d], // SVG (<?xml)
    [0x3c, 0x73, 0x76, 0x67], // SVG (<svg)
  ];

  return signatures.some(signature => {
    return signature.every((byte, index) => buffer[index] === byte);
  });
}

// 从内容类型获取扩展名
function getFileExtensionFromContentType(contentType: string): string {
  const typeMap: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/gif": "gif",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
    "image/ico": "ico",
  };

  for (const [type, ext] of Object.entries(typeMap)) {
    if (contentType.includes(type)) {
      return ext;
    }
  }

  return "png"; // 默认扩展名
}

// 从buffer检测文件扩展名
function detectFileExtensionFromBuffer(buffer: Buffer): string {
  if (buffer.length < 4) return "png";

  // PNG
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg";
  }
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return "gif";
  }
  // ICO
  if (
    buffer[0] === 0x00 &&
    buffer[1] === 0x00 &&
    buffer[2] === 0x01 &&
    buffer[3] === 0x00
  ) {
    return "ico";
  }
  // WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }
  // SVG
  if (
    buffer.toString("utf8", 0, Math.min(100, buffer.length)).includes("svg")
  ) {
    return "svg";
  }

  return "png"; // 默认扩展名
}

// 保存图标文件
async function saveIconFile(
  buffer: Buffer,
  extension: string
): Promise<string | null> {
  try {
    // 生成文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `icon_${timestamp}_${random}.${extension}`;

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads", "icons");
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 验证保存的文件
    const savedBuffer = await readFile(filePath);
    if (!isValidImageBuffer(savedBuffer)) {
      // 删除无效文件
      await unlink(filePath);
      return null;
    }

    // 返回本地URL
    return `/uploads/icons/${fileName}`;
  } catch (error) {
    console.error("保存图标文件失败:", error);
    return null;
  }
}
