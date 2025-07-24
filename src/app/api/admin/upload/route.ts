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
import crypto from "crypto";

// 文件签名验证
const getFileSignature = (buffer: Buffer, length: number = 10): string => {
  return buffer.subarray(0, length).toString("hex").toLowerCase();
};

// 文件类型验证映射
const FILE_SIGNATURES = {
  ffd8ff: "image/jpeg", // JPEG
  "89504e": "image/png", // PNG
  "474946": "image/gif", // GIF
  "524946": "image/webp", // WEBP (部分)
  "3c3f78": "image/svg+xml", // SVG (<?xml)
  "3c7376": "image/svg+xml", // SVG (<svg)
};

// 验证文件真实类型
const validateFileType = (buffer: Buffer, declaredType: string): boolean => {
  const signature = getFileSignature(buffer);

  // 检查文件签名
  for (const [sig, actualType] of Object.entries(FILE_SIGNATURES)) {
    if (signature.startsWith(sig)) {
      return actualType === declaredType;
    }
  }

  // 如果是SVG，进行额外验证
  if (declaredType === "image/svg+xml") {
    const content = buffer.toString("utf8", 0, Math.min(buffer.length, 1000));
    return content.includes("<svg") || content.includes("<?xml");
  }

  return false;
};

// 生成安全的文件名
const generateSecureFileName = (originalExtension: string): string => {
  const randomName = crypto.randomBytes(16).toString("hex");
  const timestamp = Date.now();
  return `${timestamp}_${randomName}.${originalExtension}`;
};

// 文件上传API
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    // 解析FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "icon"; // 默认为icon类型

    if (!file) {
      return errorResponse("未找到文件");
    }

    // 验证文件类型
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      return errorResponse(
        "不支持的文件类型，请上传JPG、PNG、GIF、WEBP或SVG格式的图片"
      );
    }

    // 验证文件大小（最大2MB，降低安全风险）
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return errorResponse("文件大小不能超过2MB");
    }

    // 验证文件名长度
    if (file.name.length > 255) {
      return errorResponse("文件名过长");
    }

    // 读取文件内容并验证
    const buffer = Buffer.from(await file.arrayBuffer());

    // 验证文件真实类型与声明类型是否一致
    if (!validateFileType(buffer, file.type)) {
      return errorResponse("文件内容与声明类型不匹配，可能存在安全风险");
    }

    // 获取文件扩展名
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const validExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
    if (!validExtensions.includes(extension)) {
      return errorResponse("不支持的文件扩展名");
    }

    // 根据类型确定保存目录和URL前缀
    let uploadDir: string;
    let urlPrefix: string;

    if (type === "service" || type === "icon") {
      uploadDir = join(process.cwd(), "public", "uploads", "icons");
      urlPrefix = "/uploads/icons";
    } else if (type === "category") {
      uploadDir = join(process.cwd(), "public", "uploads", "categories");
      urlPrefix = "/uploads/categories";
    } else {
      // 未知类型，默认为icon
      uploadDir = join(process.cwd(), "public", "uploads", "icons");
      urlPrefix = "/uploads/icons";
    }

    // 生成安全的文件名
    const fileName = generateSecureFileName(extension);

    // 确保上传目录存在
    await mkdir(uploadDir, { recursive: true });

    // 保存文件
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 返回文件URL
    const fileUrl = `${urlPrefix}/${fileName}`;

    return successResponse({ url: fileUrl, path: fileUrl }, "文件上传成功");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
