import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { stat } from "fs/promises";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // 获取参数
    const { path } = await context.params;
    
    // 构建文件路径
    const filePath = join(process.cwd(), "public", "uploads", ...path);
    
    // 检查文件是否存在
    const fileStats = await stat(filePath);
    if (!fileStats.isFile()) {
      return new NextResponse("File not found", { status: 404 });
    }
    
    // 读取文件
    const fileBuffer = await readFile(filePath);
    
    // 根据文件扩展名设置 Content-Type
    const extension = path[path.length - 1].split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // 返回文件
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving uploaded file:', error);
    return new NextResponse("File not found", { status: 404 });
  }
}