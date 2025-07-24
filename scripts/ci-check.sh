#!/bin/bash

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}开始 CI 检查...${NC}"

# 检查 Prettier 格式
echo -e "${YELLOW}检查代码格式...${NC}"
npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}"
PRETTIER_EXIT_CODE=$?

# 检查 ESLint 规则
echo -e "${YELLOW}检查 ESLint 规则...${NC}"
npx eslint "src/**/*.{js,jsx,ts,tsx}"
ESLINT_EXIT_CODE=$?

# 检查 TypeScript 类型
echo -e "${YELLOW}检查 TypeScript 类型...${NC}"
npx tsc --noEmit
TS_EXIT_CODE=$?

# 输出结果
if [ $PRETTIER_EXIT_CODE -eq 0 ] && [ $ESLINT_EXIT_CODE -eq 0 ] && [ $TS_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}所有检查通过!${NC}"
  exit 0
else
  echo -e "${RED}检查失败!${NC}"
  
  if [ $PRETTIER_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}Prettier 格式检查失败${NC}"
    echo -e "${YELLOW}运行 'npm run format' 修复格式问题${NC}"
  fi
  
  if [ $ESLINT_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}ESLint 规则检查失败${NC}"
    echo -e "${YELLOW}运行 'npx eslint --fix \"src/**/*.{js,jsx,ts,tsx}\"' 修复 ESLint 问题${NC}"
  fi
  
  if [ $TS_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}TypeScript 类型检查失败${NC}"
  fi
  
  exit 1
fi 