#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始 Prisma 迁移部署...${NC}"

# 使用 Prisma Migrate Deploy 应用所有迁移
echo -e "${YELLOW}应用所有迁移...${NC}"
npx prisma migrate deploy
if [ $? -eq 0 ]; then
  echo -e "${GREEN}迁移应用成功${NC}"
else
  echo -e "${RED}迁移应用失败${NC}"
  exit 1
fi

# 更新 Prisma 客户端
echo -e "${YELLOW}更新 Prisma 客户端...${NC}"
npx prisma generate
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Prisma 客户端更新成功${NC}"
else
  echo -e "${RED}Prisma 客户端更新失败${NC}"
  exit 1
fi

echo -e "${GREEN}Prisma 迁移部署完成!${NC}" 