#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 数据库初始化脚本
 * 在容器启动时运行，检测数据库是否存在，如果不存在则自动初始化
 */

async function initializeDatabase() {
  console.log("🔍 检查数据库状态...");

  // 获取数据库路径
  const databaseUrl = process.env.DATABASE_URL || "file:./data/database.db";
  const dbPath = databaseUrl.replace("file:", "");
  const fullDbPath = path.resolve(dbPath);

  console.log(`📍 数据库路径: ${fullDbPath}`);

  // 检查数据库文件是否存在
  if (fs.existsSync(fullDbPath)) {
    console.log("✅ 数据库文件已存在，跳过初始化");
    return;
  }

  console.log("🚀 数据库文件不存在，开始初始化...");

  try {
    // 确保数据目录存在
    const dataDir = path.dirname(fullDbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`📁 创建数据目录: ${dataDir}`);
    }

    // 动态导入初始化模块
    const { initializeSystem } = await import("../src/lib/init.js");

    // 执行系统初始化
    await initializeSystem();

    console.log("✅ 数据库初始化完成!");
    console.log("🔐 管理后台登录方式: 使用 CZL Connect 账号登录");
    console.log("🌐 管理后台地址: /admin");
    console.log("⚠️  请确保已配置正确的 CZL Connect OAuth2 客户端ID和密钥");
  } catch (error) {
    console.error("❌ 数据库初始化失败:", error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase().catch(error => {
    console.error("初始化过程发生错误:", error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };
