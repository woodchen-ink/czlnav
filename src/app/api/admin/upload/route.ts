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

// 生成安全的文件名
const generateSecureFileName = (originalName: string): string => {
  const extension = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const randomSuffix = crypto.randomBytes(3).toString("hex");
  const timestamp = Date.now();
  return `icon_${timestamp}_${randomSuffix}.${extension}`;
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

    if (!file) {
      return errorResponse("未找到文件");
    }

    // 简单的文件类型验证
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/x-icon",
    ];
    if (!validTypes.includes(file.type)) {
      return errorResponse("不支持的文件类型");
    }

    // 文件大小限制
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return errorResponse("文件大小不能超过5MB");
    }

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer());

    // 确定保存路径
    const baseDir =
      process.env.NODE_ENV === "production" ? "/app" : process.cwd();
    const uploadDir = join(baseDir, "public", "uploads", "icons");
    const urlPrefix = "/uploads/icons";

    // 生成文件名
    const fileName = generateSecureFileName(file.name);

    // 确保目录存在
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
