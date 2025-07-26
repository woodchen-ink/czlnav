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

// 批量更新分类排序
export async function POST(request: NextRequest) {
  try {
    // 验证管理员身份
    const admin = await verifyAdmin();
    if (!admin) {
      return unauthorizedResponse();
    }

    // 解析请求数据
    const body = await request.json();
    const { updates } = body;

    // 验证数据格式
    if (!Array.isArray(updates)) {
      return errorResponse("更新数据格式错误");
    }

    // 验证每个更新项的格式
    for (const update of updates) {
      if (
        typeof update.id !== "number" ||
        typeof update.sortOrder !== "number"
      ) {
        return errorResponse("更新数据项格式错误");
      }
    }

    // 批量更新排序
    const updatePromises = updates.map(({ id, sortOrder }) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder },
      })
    );

    await Promise.all(updatePromises);

    // 刷新首页缓存
    revalidatePath("/");
    // 刷新所有分类详情页缓存
    revalidatePath("/category/[slug]", "page");

    return successResponse(null, "批量更新排序成功");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
