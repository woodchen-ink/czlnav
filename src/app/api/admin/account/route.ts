import { NextRequest } from "next/server";
import { verifyAdmin } from "@/utils/czl-auth";
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/utils/api";

// 获取当前管理员信息
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    // 验证管理员身份并获取用户信息
    const user = await verifyAdmin();
    if (!user) {
      return unauthorizedResponse();
    }

    // 返回用户信息
    const adminInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      createdAt: new Date().toISOString(), // CZL Connect用户没有创建时间，使用当前时间
      updatedAt: new Date().toISOString(),
    };

    return successResponse(adminInfo);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
