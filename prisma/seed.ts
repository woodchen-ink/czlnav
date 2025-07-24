import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // CZL Connect OAuth2 系统不需要本地管理员账户
  // 管理员身份通过 CZL Connect 验证
  // 这里可以添加其他初始数据，比如默认分类、设置等
  // 目前没有需要初始化的数据
}

main()
  .catch(e => {
    // eslint-disable-next-line no-console
    console.error("种子数据处理失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
