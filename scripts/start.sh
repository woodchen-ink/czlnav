#!/bin/sh

echo "🚀 启动 CZL Nav 应用..."

# 检查数据库初始化
echo "🔧 检查并初始化数据库..."

# 数据库路径
DATABASE_URL=${DATABASE_URL:-"file:/app/data/database.db"}
DB_PATH=$(echo $DATABASE_URL | sed "s/file://")
DB_DIR=$(dirname "$DB_PATH")

echo "📍 数据库路径: $DB_PATH"

# 检查数据库文件是否存在
if [ -f "$DB_PATH" ]; then
  echo "✅ 数据库文件已存在，跳过初始化"
else
  echo "🚀 数据库文件不存在，开始初始化..."
  
  # 创建数据目录
  if [ ! -d "$DB_DIR" ]; then
    mkdir -p "$DB_DIR"
    echo "📁 创建数据目录: $DB_DIR"
  fi
  
  # 使用 SQLite 执行初始化脚本
  echo "🔄 正在初始化数据库结构和数据..."
  
  if sqlite3 "$DB_PATH" < /app/prisma/init.sql; then
    echo "✅ 数据库初始化完成!"
    echo "🔐 默认管理员账号: admin"
    echo "🔑 默认密码: admin123"
    echo "🌐 管理后台地址: /admin"
  else
    echo "❌ 数据库初始化失败"
    exit 1
  fi
fi

# 启动应用 (standalone 模式)
echo "🌟 启动应用服务器..."
exec node server.js