@echo off
chcp 65001 >nul
echo 正在初始化开发环境...
echo.

REM 检查是否存在 .env 文件
if not exist ".env" (
    echo 创建 .env 文件...
    echo # 数据库配置 > .env
    echo DATABASE_URL="file:./data.db" >> .env
    echo. >> .env
    echo # 应用配置 >> .env
    echo NEXT_PUBLIC_API_URL="http://localhost:3000/api" >> .env
    echo NEXT_PUBLIC_SITE_NAME="CZL Nav" >> .env
    echo NEXT_PUBLIC_UPLOAD_DIR="uploads" >> .env
    echo .env 文件已创建
    echo.
)

REM 安装依赖
echo 安装依赖包...
call npm install
if %errorlevel% neq 0 (
    echo 依赖安装失败!
    pause
    exit /b 1
)
echo.

REM 生成 Prisma 客户端
echo 生成 Prisma 客户端...
call npx prisma generate
if %errorlevel% neq 0 (
    echo Prisma 客户端生成失败!
    pause
    exit /b 1
)
echo.

REM 运行数据库迁移
echo 运行数据库迁移...
call npx prisma migrate dev --name init
if %errorlevel% neq 0 (
    echo 数据库迁移失败!
    pause
    exit /b 1
)
echo.

echo 初始化完成! 正在启动开发服务器...
echo.
echo 服务器启动后请访问以下地址:
echo - 前端页面: http://localhost:3000
echo - 系统初始化: http://localhost:3000/api/init
echo - 管理后台: http://localhost:3000/admin
echo - 默认管理员: admin / admin123
echo.

REM 启动开发服务器
call npm run dev