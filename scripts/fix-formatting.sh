#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始修复代码格式问题...${NC}"

# 运行 Prettier 格式化
echo -e "${YELLOW}运行 Prettier 格式化...${NC}"
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Prettier 格式化成功${NC}"
else
  echo -e "${RED}Prettier 格式化失败${NC}"
  exit 1
fi

# 运行 ESLint 修复
echo -e "${YELLOW}运行 ESLint 修复...${NC}"
npx eslint --fix "src/**/*.{js,jsx,ts,tsx}"
if [ $? -eq 0 ]; then
  echo -e "${GREEN}ESLint 修复成功${NC}"
else
  echo -e "${RED}ESLint 修复失败，但继续执行${NC}"
fi

echo -e "${GREEN}代码格式修复完成!${NC}" 