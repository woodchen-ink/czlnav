import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/utils/czl-auth";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
  serverErrorResponse,
} from "@/utils/api";

// 获取所有服务
export async function GET(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    // 获取分页参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "0", 10); // 默认为0表示不分页
    const categoryId = searchParams.get("categoryId");

    // 构建查询条件
    const where = categoryId ? { categoryId: parseInt(categoryId, 10) } : {};

    // 获取总数
    const total = await prisma.service.count({ where });

    // 获取数据（如果 pageSize 为 0 则不分页）
    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        icon: true,
        clickCount: true,
        categoryId: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "desc" }],
      ...(pageSize > 0
        ? {
            skip: (page - 1) * pageSize,
            take: pageSize,
          }
        : {}),
    });

    // 格式化数据，添加分类名称
    const formattedServices = services.map(service => ({
      ...service,
      categoryName: service.category.name,
    }));

    return successResponse({
      data: {
        data: formattedServices,
        pagination: {
          current: page,
          pageSize,
          total,
        },
      },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// 创建服务
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
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

    // 检查分类是否存在
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return errorResponse("所选分类不存在");
    }

    // 如果没有提供sortOrder，获取该分类下的最大sortOrder值并+1
    let finalSortOrder = sortOrder;
    if (finalSortOrder === undefined || finalSortOrder === null) {
      const maxSortOrder = await prisma.service.aggregate({
        where: { categoryId },
        _max: { sortOrder: true },
      });
      finalSortOrder = (maxSortOrder._max.sortOrder || 0) + 1;
    }

    // 创建服务
    const service = await prisma.service.create({
      data: {
        name,
        url,
        description,
        categoryId,
        icon: icon || null,
        sortOrder: finalSortOrder,
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

    return successResponse(formattedService, "创建服务成功");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
