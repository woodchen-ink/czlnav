import { prisma } from "./prisma";

// 初始化数据库
export const initializeSystem = async () => {
  try {
    // 注意：不再需要创建管理员账户，因为使用CZL Connect OAuth2登录

    // 检查是否有分类，如果没有则创建默认分类
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      await prisma.category.createMany({
        data: [
          { name: "聊天机器人", slug: "chatbots" },
          { name: "图像生成", slug: "image-generation" },
          { name: "文本处理", slug: "text-processing" },
          { name: "音频处理", slug: "audio-processing" },
          { name: "视频处理", slug: "video-processing" },
          { name: "开发工具", slug: "dev-tools" },
          { name: "其他工具", slug: "other-tools" },
        ],
      });

      if (process.env.NODE_ENV === "development") {
        console.log("已创建默认分类");
      }
    }

    // 检查是否有系统设置，如果没有则创建默认设置
    const settingCount = await prisma.setting.count();
    if (settingCount === 0) {
      await prisma.setting.createMany({
        data: [
          { key: "siteName", value: "CZL Nav" },
          { key: "siteDescription", value: "优质网站和服务导航" },
        ],
      });

      if (process.env.NODE_ENV === "development") {
        console.log("已创建默认系统设置");
      }
    }

    if (process.env.NODE_ENV === "development") {
      console.log("系统初始化完成！请使用CZL Connect账户登录管理后台。");
    }
  } catch (error) {
    console.error("系统初始化失败:", error);
  }
};
