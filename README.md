# 🧭 CZL Nav - 现代化导航网站

<div align="center">

![CZL Nav Logo](https://img.shields.io/badge/CZL-Nav-blue?style=for-the-badge&logo=compass)

一个功能丰富、响应式设计的现代化导航网站，帮助用户快速发现和管理优质网站与服务。

[![GitHub license](https://img.shields.io/github/license/woodchen-ink/czlnav)](https://github.com/woodchen-ink/czlnav/blob/main/LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://hub.docker.com/r/woodchen/czlnav)
[![Node.js](https://img.shields.io/badge/Node.js-22+-green?logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)

[🌐 在线演示](https://nav.czl.net) | [📖 部署文档](./DEPLOYMENT.md) | [🐛 问题反馈](https://github.com/woodchen-ink/czlnav/issues)

</div>

---

## 📖 项目介绍

CZL Nav 是一个基于 Next.js 15 构建的现代化导航网站，专为收录和展示优质网站服务而设计。它采用响应式设计，支持多设备访问，提供强大的搜索和分类功能，让用户能够快速找到所需的网站资源。

### ✨ 核心特色

- 🎨 **现代化 UI** - 基于 Tailwind CSS 和 shadcn/ui 的精美界面
- 🔐 **安全认证** - 集成 CZL Connect OAuth2 统一认证
- ⚡ **高性能** - Next.js 15 + Turbopack 极速开发体验
- 🐳 **容器化部署** - Docker 一键部署，支持 GitHub Actions CI/CD
- 📱 **响应式设计** - 完美适配桌面、平板、手机等设备
- 🎯 **智能搜索** - 实时搜索，支持分类筛选和热门推荐

---

## 🏗 项目架构

### 技术栈

```
Frontend     │ Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend      │ Next.js API Routes + Prisma ORM
Database     │ SQLite (轻量级，易部署)
Auth         │ NextAuth.js + CZL Connect OAuth2
Deployment   │ Docker + GitHub Actions
UI Components│ Radix UI + Lucide React Icons
Styling      │ Tailwind CSS + CSS-in-JS
```

### 系统架构图

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │   Database      │
│                 │    │                  │    │                 │
│ • Next.js App   │◄──►│ • API Routes     │◄──►│ • SQLite        │
│ • React 19      │    │ • Prisma ORM     │    │ • File Storage  │
│ • Tailwind CSS  │    │ • NextAuth.js    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Static Files  │    │   Authentication │    │   Data Storage  │
│                 │    │                  │    │                 │
│ • Images        │    │ • CZL Connect    │    │ • Categories    │
│ • Uploads       │    │ • OAuth2 Flow    │    │ • Services      │
│ • Assets        │    │ • Session Mgmt   │    │ • Settings      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 目录结构

```
czlnav/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (public)/          # 公开页面路由
│   │   ├── admin/             # 管理后台路由
│   │   └── api/               # API 接口
│   ├── components/            # React 组件
│   │   ├── ui/               # 基础 UI 组件
│   │   └── admin/            # 管理后台组件
│   ├── lib/                  # 工具库和配置
│   ├── types/                # TypeScript 类型定义
│   └── utils/                # 工具函数
├── prisma/                   # 数据库 Schema 和迁移
├── public/                   # 静态资源
├── docker-compose.yml        # Docker 编排配置
├── Dockerfile               # Docker 镜像构建
└── .github/workflows/       # GitHub Actions 工作流
```

---

## 🚀 主要功能和亮点

### 🎯 核心功能

| 功能模块        | 描述                           | 技术实现                  |
| --------------- | ------------------------------ | ------------------------- |
| 🏠 **首页导航** | 分类展示网站，支持搜索和筛选   | Next.js SSR + 实时搜索    |
| 🔍 **智能搜索** | 全文搜索，支持拼音和关键词匹配 | 内存缓存 + 模糊搜索       |
| 📊 **数据统计** | 点击统计、热门推荐、访问分析   | SQLite + 统计算法         |
| 👤 **用户认证** | OAuth2 统一登录，安全可靠      | NextAuth.js + CZL Connect |
| ⚙️ **管理后台** | 网站管理、分类管理、系统设置   | React + 表单验证          |
| 📱 **响应式**   | 适配所有设备，PWA 支持         | Tailwind CSS + 响应式设计 |

### ✨ 产品亮点

#### 🎨 **用户体验**

- **极速加载** - Next.js 15 + Turbopack 提供毫秒级热更新
- **流畅交互** - React 19 并发特性，丝滑的用户体验
- **无障碍设计** - 遵循 WCAG 标准，支持键盘导航和屏幕阅读器

#### 🔧 **技术特色**

- **现代化架构** - 采用最新的 React 19 和 Next.js 15
- **类型安全** - 全面的 TypeScript 支持，减少运行时错误
- **组件化开发** - 基于 shadcn/ui 的可复用组件库

#### 🛡️ **安全性**

- **OAuth2 认证** - 集成 CZL Connect 统一身份认证
- **会话管理** - NextAuth.js 提供安全的会话处理
- **数据验证** - Zod 模式验证，防止恶意输入

#### ⚡ **性能优化**

- **图片优化** - Next.js Image 组件自动优化
- **缓存策略** - 多层缓存机制，提升响应速度
- **CDN 支持** - 静态资源 CDN 加速

---

## 🚀 生产环境部署

```bash
# 1. 拉取最新镜像
docker pull woodchen/czlnav:latest

# 2. 启动服务
cd /opt/1panel/docker/compose/czlnav
git clone https://github.com/woodchen-ink/czlnav.git
#修改配置后
docker-compose up -d

# 3. 查看服务状态
docker-compose ps
docker-compose logs -f
```

### 🔧 部署后配置

#### 1. 系统自动初始化

容器启动时会自动检测数据库是否存在，如果不存在将自动进行初始化：

- 创建默认分类和示例数据
- 初始化系统设置

🔐 **管理后台登录**：使用 CZL Connect 账号登录，需要先在 CZL Connect 中注册账号。

⚠️ **安全提醒**：请确保配置了正确的 CZL Connect OAuth2 客户端ID和密钥！

#### 2. 管理后台

访问 `https://your-domain.com/admin` 使用 CZL Connect 账户登录

#### 3. 反向代理配置（Nginx）

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 💻 本地开发测试流程

### 环境要求

- **Node.js** >= 22.0.0
- **npm** >= 10.0.0
- **Git** 最新版本

### 快速开始

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/czlnav.git
cd czlnav
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 环境配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件.

#### 4. 数据库初始化

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库模式
npx prisma db push
```

#### 5. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

#### 6. 系统自动初始化

开发环境启动后，系统会自动检测数据库是否存在：

- 如果数据库不存在，将自动初始化系统数据和默认分类
- 如果数据库已存在，跳过初始化过程

🔐 管理后台登录：访问 http://localhost:3000/admin 使用 CZL Connect 账号登录

⚠️ 已提供测试的CZL Connect OAuth2 客户端ID和密钥, 回调地址需要确保是`http://localhost:3000/api/auth/callback`

### 开发工具

#### 可用脚本

```bash
npm run dev          # 启动开发服务器（Turbopack）
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # ESLint 代码检查
npm run format       # Prettier 代码格式化
npm run ci-check     # CI 检查（格式化 + 检查 + 类型检查）
npm run fix-format   # 自动修复格式问题
```

#### 数据库管理

```bash
npx prisma studio          # 打开数据库可视化管理界面
npx prisma db push         # 推送模式更改到数据库
npx prisma generate        # 重新生成 Prisma 客户端
npx prisma migrate dev     # 创建并应用迁移
```

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源协议。
