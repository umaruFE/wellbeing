#!/bin/bash

set -e

PROJECT_DIR="/var/www/wellbeing"
API_DIR="$PROJECT_DIR/api"
FRONTEND_DIR="$PROJECT_DIR"

echo "========================================"
echo "🚀 开始更新部署 Wellbeing 系统..."
echo "========================================"

echo "📦 [1/5] 正在检查并安装前端依赖..."
cd "$FRONTEND_DIR"
npm install

echo "🏗️  [2/5] 正在构建前端 (Vite Build)..."
npm run build

echo "📦 [3/5] 正在检查并安装后端依赖..."
cd "$API_DIR"
npm install

echo "🏗️  [4/5] 正在构建后端 (Next.js Build)..."
npm run build

echo "🔄 [5/5] 正在重启后台服务..."
pm2 restart wellbeing-api || pm2 start npm --name "wellbeing-api" -- start

echo "========================================"
echo "✅ 部署完成！"
echo "🌐 前端静态文件: $FRONTEND_DIR/dist/"
echo "🔧 后端 API:     pm2 wellbeing-api (端口 4000)"
echo "========================================"
