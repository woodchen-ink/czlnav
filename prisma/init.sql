-- 初始化数据库完整脚本
-- 基于现有迁移文件整合而成

-- CreateTable
CREATE TABLE "Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT
);

-- CreateTable
CREATE TABLE "Service" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "categoryId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Service_categoryId_idx" ON "Service"("categoryId");
CREATE INDEX "Service_name_idx" ON "Service"("name");
CREATE INDEX "Service_clickCount_idx" ON "Service"("clickCount");
CREATE INDEX "Service_sortOrder_idx" ON "Service"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
CREATE UNIQUE INDEX "Admin_username_key" ON "Admin"("username");

-- 插入默认数据（明确指定 updatedAt）
INSERT INTO "Category" ("name", "slug", "description", "sortOrder", "createdAt", "updatedAt") VALUES
('开发工具', 'dev-tools', '编程开发相关工具', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('设计资源', 'design', '设计素材和工具', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('效率办公', 'productivity', '提高工作效率的工具', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('学习资源', 'learning', '在线学习和教育平台', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('娱乐休闲', 'entertainment', '娱乐和休闲相关', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入默认管理员账号 (密码: admin123)
INSERT INTO "Admin" ("username", "password") VALUES
('admin', '$2b$10$8K9wRlvL7tZ5K9V6X2N5eOx7Q8mF3nS6wY7sR4u2VzPkL8jC9aG3e');

-- 插入默认设置（明确指定 updatedAt）
INSERT INTO "Setting" ("key", "value", "createdAt", "updatedAt") VALUES
('site_title', 'CZL Nav', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('site_description', '一个简洁的导航网站', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('footer_text', '© 2024 CZL Nav. All rights reserved.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);