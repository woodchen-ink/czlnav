import { successResponse, serverErrorResponse } from "@/utils/api";
import { redisHelper } from "@/lib/redis";

export async function DELETE() {
  try {
    redisHelper.clear();
    return successResponse({ message: "缓存清理成功" });
  } catch (error) {
    console.error("清理缓存失败:", error);
    return serverErrorResponse(error);
  }
}

export async function GET() {
  try {
    const cacheSize = redisHelper.size();
    const cacheKeys = await redisHelper.keys("*");
    
    return successResponse({
      size: cacheSize,
      keys: cacheKeys.slice(0, 20), // 只返回前20个键作为示例
      totalKeys: cacheKeys.length
    });
  } catch (error) {
    console.error("获取缓存信息失败:", error);
    return serverErrorResponse(error);
  }
}