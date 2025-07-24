#!/bin/bash

# CZL Navigation 部署脚本
# 用于在服务器上快速部署应用

set -e

echo "🚀 开始部署 CZL Navigation..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装，请先安装 docker-compose"
    exit 1
fi

# 创建部署目录
DEPLOY_DIR="$HOME/czlnav-deploy"
DATA_DIR="$HOME/data"

mkdir -p "$DEPLOY_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/uploads"

cd "$DEPLOY_DIR"

# 创建 docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  web:
    image: ghcr.io/your-username/czlnav:latest
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=file:./data/database.db
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3000/api}
      - NEXT_PUBLIC_UPLOAD_DIR=uploads
      - NODE_ENV=production
    volumes:
      - ~/data:/app/data
      - ~/data/uploads:/app/public/uploads
    restart: always
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
EOF

echo "📝 docker-compose.yml 已创建"

# 创建环境变量文件模板
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# 应用访问地址（请修改为你的域名）
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# 如果使用域名，请设置为你的域名
# NEXT_PUBLIC_API_URL=https://your-domain.com/api
EOF
    echo "📝 .env 文件已创建，请根据需要修改配置"
fi

# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
# 数据备份脚本

BACKUP_DIR="$HOME/czlnav-backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "🔄 开始备份数据..."

# 备份数据库和上传文件
tar -czf "$BACKUP_DIR/czlnav_backup_$DATE.tar.gz" -C "$HOME" data

echo "✅ 备份完成: $BACKUP_DIR/czlnav_backup_$DATE.tar.gz"

# 保留最近7天的备份
find "$BACKUP_DIR" -name "czlnav_backup_*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh
echo "📝 备份脚本已创建 (backup.sh)"

# 创建更新脚本
cat > update.sh << 'EOF'
#!/bin/bash
# 应用更新脚本

echo "🔄 更新应用..."

# 拉取最新镜像
docker-compose pull

# 重启服务
docker-compose down
docker-compose up -d

# 清理旧镜像
docker image prune -f

echo "✅ 更新完成"
EOF

chmod +x update.sh
echo "📝 更新脚本已创建 (update.sh)"

echo ""
echo "🎉 部署准备完成！"
echo ""
echo "📁 部署目录: $DEPLOY_DIR"
echo "📁 数据目录: $DATA_DIR"
echo ""
echo "🔧 下一步操作："
echo "1. 修改 .env 文件中的配置"
echo "2. 运行: docker-compose up -d"
echo "3. 访问: http://localhost:3000"
echo "4. 初始化系统: http://localhost:3000/api/init"
echo ""
echo "🛠  其他命令："
echo "- 查看日志: docker-compose logs -f"
echo "- 更新应用: ./update.sh"
echo "- 备份数据: ./backup.sh"
echo ""