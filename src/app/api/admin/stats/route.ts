import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/utils/czl-auth";
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/utils/api";

// 获取统计数据
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    // 获取服务总数
    const serviceCount = await prisma.service.count();

    // 获取分类总数
    const categoryCount = await prisma.category.count();

    // 获取总点击次数
    const clicksResult = await prisma.service.aggregate({
      _sum: {
        clickCount: true,
      },
    });

    const totalClicks = clicksResult._sum.clickCount || 0;

    // 返回统计数据
    return successResponse({
      serviceCount,
      categoryCount,
      totalClicks,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
