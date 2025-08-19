import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join, extname } from "path";
import { lookup } from "mime-types";

// 允许的文件类型
const ALLOWED_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
];
const ALLOWED_PATHS = ["icons", "images"]; // 允许的上传路径

// 验证文件是否为有效的图片
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

// 服务上传的文件
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const params = await context.params;
    const filePath = params.path.join("/");
    const fullPath = join(process.cwd(), "public", "uploads", filePath);

    // 安全检查：防止路径遍历攻击
    if (filePath.includes("..") || filePath.includes("\\")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    // 检查是否为允许的路径
    const pathParts = params.path;
    if (pathParts.length < 2 || !ALLOWED_PATHS.includes(pathParts[0])) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    // 检查文件名格式（兼容新旧格式）
    const fileName = pathParts[pathParts.length - 1];
    const isOldFormat = /^icon_\d+\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(
      fileName
    );
    const isNewFormat = /^[\w.-]+_\d+\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(
      fileName
    );

    if (!isOldFormat && !isNewFormat) {
      return new NextResponse("Invalid file name format", { status: 400 });
    }

    // 检查文件扩展名
    const extension = extname(filePath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return new NextResponse("File type not allowed", { status: 400 });
    }

    // 检查文件是否存在
    const fileStats = await stat(fullPath);
    if (!fileStats.isFile()) {
      return new NextResponse("File not found", { status: 404 });
    }

    // 读取文件
    const fileBuffer = await readFile(fullPath);

    // 验证文件内容是否为有效图片（除了SVG）
    if (extension !== ".svg" && !isValidImageBuffer(fileBuffer)) {
      return new NextResponse("Invalid image file", { status: 400 });
    }

    // 获取MIME类型
    const mimeType = lookup(fullPath) || "application/octet-stream";

    // 返回文件内容
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch (error) {
    console.error("文件服务错误:", error);
    return new NextResponse("File not found", { status: 404 });
  }
}
