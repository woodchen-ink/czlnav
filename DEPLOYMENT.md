# CZL Nav 部署指南

## 📦 部署准备

### 1. 服务器环境要求

- Docker & Docker Compose
- 至少 1GB 内存和 2GB 磁盘空间

### 2. 创建部署目录和配置

```bash
# 创建部署目录
mkdir -p /opt/1panel/docker/compose/czlnav
cd /opt/1panel/docker/compose/czlnav

# 创建数据目录
mkdir -p /opt/data/uploads
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
cp .env.production.example .env
```

编辑 `.env` 文件，配置以下必要参数：

```env
# 修改为你的域名
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXTAUTH_URL=https://your-domain.com

# CZL Connect OAuth2 配置（必须配置）
CZL_CONNECT_CLIENT_ID=your_client_id
CZL_CONNECT_CLIENT_SECRET=your_client_secret
CZL_CONNECT_REDIRECT_URI=https://your-domain.com/api/auth/callback

# 生成随机密钥
NEXTAUTH_SECRET=your_random_secret_string_here
```

### 4. 创建 docker-compose.yml

将 `docker-compose.prod.yml` 复制为 `docker-compose.yml`：

```bash
cp docker-compose.prod.yml docker-compose.yml
```

## 🚀 部署方式

### 方式一：GitHub Actions 自动部署

配置以下 GitHub Secrets：

- `ACCESS_TOKEN` - Docker Hub 访问令牌
- `SERVER_HOST` - 服务器地址
- `SERVER_SSH_KEY` - SSH 私钥

推送代码到 main 分支即可自动部署。

### 方式二：手动部署

```bash
# 拉取最新镜像
docker-compose pull

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 🔧 初次部署后

1. 访问应用：`https://your-domain.com`
2. 系统初始化：`https://your-domain.com/api/init`
3. 登录管理后台：使用 CZL Connect 账户登录

## 📁 目录结构

```
/opt/
├── 1panel/docker/compose/czlnav/
│   ├── docker-compose.yml
│   └── .env
└── data/
    ├── database.db
    └── uploads/
```

## 🛠 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 更新服务
docker-compose pull && docker-compose up -d

# 备份数据
tar -czf backup.tar.gz /opt/data

# 停止服务
docker-compose down
```

## 🔐 安全建议

1. 定期备份 `/opt/data` 目录
2. 使用强密码设置 `NEXTAUTH_SECRET`
3. 配置防火墙只开放必要端口
4. 定期更新 Docker 镜像

## 🆘 故障排除

### 容器无法启动

```bash
# 查看详细日志
docker-compose logs --tail=50

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

### 数据库问题

```bash
# 进入容器检查数据库
docker-compose exec web sh
ls -la /app/data/
```

### 重新初始化系统

```bash
# 停止服务
docker-compose down

# 清空数据库（谨慎操作）
rm /opt/data/database.db

# 重启服务
docker-compose up -d

# 重新初始化
curl http://localhost:3000/api/init
```
