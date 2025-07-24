# 构建阶段
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建时依赖
RUN apk add --no-cache libc6-compat openssl

# 复制依赖配置文件
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY next.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.mjs ./
COPY components.json ./

# 配置 npm 并安装依赖
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm config set fund false && \
    npm config set audit false && \
    npm cache clean --force && \
    npm ci --no-optional --no-fund --no-audit

# 生成 Prisma 客户端
RUN npx prisma generate

# 复制源代码
COPY src ./src
COPY public ./public
COPY scripts/start.sh ./scripts/start.sh
COPY prisma/init.sql ./prisma/init.sql

# 构建应用
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL="file:/tmp/build.db"

# 创建临时数据库和表结构用于构建
RUN npx prisma migrate dev --name init --skip-generate || npx prisma db push

RUN npm run build

# 运行阶段
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 安装运行时依赖
RUN apk add --no-cache openssl dumb-init sqlite

# 复制 standalone 构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 复制 Prisma schema 和初始化脚本
COPY --from=builder /app/prisma ./prisma

# 复制脚本文件
COPY --from=builder /app/scripts/start.sh /app/start.sh

# 创建必要的目录并设置权限
RUN mkdir -p /app/data /app/public/uploads && \
    chmod +x /app/start.sh

EXPOSE 3000

ENV PORT=3000
ENV DATABASE_URL="file:/app/data/database.db"

CMD ["dumb-init", "/app/start.sh"]