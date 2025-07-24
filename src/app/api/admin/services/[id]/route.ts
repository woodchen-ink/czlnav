import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { PrismaClient } from "@prisma/client";
import { verifyAdmin } from "@/utils/czl-auth";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
} from "@/utils/api";
import { RouteContext } from "../../categories/[id]/route";
import { join } from "path";
import { existsSync, unlinkSync } from "fs";

const prisma = new PrismaClient();

// 获取单个服务
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    // 解析Promise获取参数
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return errorResponse("无效的服务ID");
    }

    // 查找服务
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!service) {
      return errorResponse("服务不存在", 404);
    }

    // 格式化返回数据
    const formattedService = {
      ...service,
      categoryName: service.category.name,
    };

    return successResponse(formattedService);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// 更新服务
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    // 解析Promise获取参数
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return errorResponse("无效的服务ID");
    }

    // 解析请求数据
    const body = await request.json();
    const { name, url, description, categoryId, icon, sortOrder } = body;

    // 验证数据
    if (!name || typeof name !== "string") {
      return errorResponse("服务名称不能为空");
    }

    if (!url || typeof url !== "string") {
      return errorResponse("服务网址不能为空");
    }

    if (!description || typeof description !== "string") {
      return errorResponse("服务简介不能为空");
    }

    if (!categoryId || typeof categoryId !== "number") {
      return errorResponse("所属分类不能为空");
    }

    // 检查服务是否存在
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return errorResponse("服务不存在", 404);
    }

    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse("所选分类不存在");
    }

    // 更新服务
    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        url,
        description,
        categoryId,
        icon: icon || null,
        ...(sortOrder !== undefined && { sortOrder }),
      },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // 格式化返回数据
    const formattedService = {
      ...service,
      categoryName: service.category.name,
    };

    // 刷新首页缓存
    revalidatePath('/');
    // 刷新所有分类详情页缓存
    revalidatePath('/category/[slug]', 'page');

    return successResponse(formattedService, "更新服务成功");
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// 删除服务
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    // 解析Promise获取参数
    const resolvedParams = await context.params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return errorResponse("无效的服务ID");
    }

    // 检查服务是否存在
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return errorResponse("服务不存在", 404);
    }

    // 删除服务图标文件（如果存在）
    if (service.icon) {
      try {
        // 从URL中提取文件路径
        const iconPath = service.icon.replace(/^\/uploads\//, "");
        const filePath = join(process.cwd(), "public", "uploads", iconPath);

        // 检查文件是否存在
        if (existsSync(filePath)) {
          // 删除文件
          unlinkSync(filePath);
          console.log(`已删除图标文件: ${filePath}`);
        }
      } catch (fileError) {
        // 文件删除失败不影响数据库操作，只记录日志
        console.error("删除图标文件失败:", fileError);
      }
    }

    // 删除服务
    await prisma.service.delete({
      where: { id },
    });

    // 刷新首页缓存
    revalidatePath('/');
    // 刷新所有分类详情页缓存
    revalidatePath('/category/[slug]', 'page');

    return successResponse(null, "删除服务成功");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
