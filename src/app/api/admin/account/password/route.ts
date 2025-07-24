import { NextRequest } from "next/server";
import { verifyAdmin } from "@/utils/czl-auth";
import { unauthorizedResponse, errorResponse } from "@/utils/api";

// 修改密码 - 注意：CZL Connect OAuth2 不支持本地密码修改
// 用户需要通过 CZL Connect 平台修改密码
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function PUT(_request: NextRequest) {
  try {
    // 验证管理员身份
    const currentUser = await verifyAdmin();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    return errorResponse(
      "密码修改功能已迁移到 CZL Connect 平台，请前往 https://connect.czl.net 修改您的密码"
    );
  } catch (error) {
    console.error("密码修改API错误:", error);
    return errorResponse("服务器内部错误");
  }
}
