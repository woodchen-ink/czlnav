#!/bin/sh

# 容器启动脚本 - 确保数据库正确初始化

set -e

echo "🚀 启动 CZL Navigation..."

# 确保数据目录存在
mkdir -p /app/data
mkdir -p /app/public/uploads

# 检查数据库文件是否存在
if [ ! -f "/app/data/database.db" ]; then
    echo "📦 初次部署，正在初始化数据库..."
    
    # 运行 Prisma 数据库推送（创建表结构）
    cd /app && npx prisma db push --accept-data-loss
    
    echo "✅ 数据库表结构创建完成"
else
    echo "📦 数据库文件已存在，检查是否需要更新表结构..."
    
    # 如果数据库存在，运行 db push 以确保表结构是最新的
    cd /app && npx prisma db push
    
    echo "✅ 数据库表结构检查完成"
fi

echo "🔄 启动应用服务器..."

# 启动 Next.js 应用
cd /app && exec node server.js