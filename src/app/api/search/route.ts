import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/utils/api";
import { Prisma } from "@prisma/client";
import { redisHelper } from "@/lib/redis";

// 缓存时间（秒）
const CACHE_TTL = 60 * 5; // 5分钟

// 基于SQLite的搜索API
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);

    // 构建缓存键
    const cacheKey = `search:${query}:${page}:${pageSize}`;

    // 尝试从缓存获取结果
    const cachedResult = await redisHelper.get(cacheKey);
    if (cachedResult) {
      return successResponse(cachedResult);
    }

    // 构建查询条件
    const whereCondition: Prisma.ServiceWhereInput = {
      OR: [{ name: { contains: query } }, { description: { contains: query } }],
    };

    // 获取总数
    const total = await prisma.service.count({
      where: whereCondition,
    });

    // 使用SQLite的查询搜索服务
    const services = await prisma.service.findMany({
      where: whereCondition,
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        icon: true,
        clickCount: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        clickCount: "desc",
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });

    // 格式化结果
    const formattedServices = services.map(service => ({
      id: service.id,
      name: service.name,
      url: service.url,
      description: service.description,
      icon: service.icon,
      clickCount: service.clickCount,
      categoryId: service.categoryId,
      categoryName: service.category.name,
      categorySlug: service.category.slug,
    }));

    const result = {
      data: formattedServices,
      pagination: {
        current: page,
        pageSize,
        total,
      },
    };

    // 缓存结果
    await redisHelper.set(cacheKey, result, {
      ex: CACHE_TTL,
    });

    return successResponse(result);
  } catch (error) {
    console.error("搜索失败:", error);
    return serverErrorResponse(error);
  }
}
