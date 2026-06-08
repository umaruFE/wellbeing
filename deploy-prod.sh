#!/bin/bash

set -e

PROJECT_DIR="/home/newstar/wellbeing"
API_DIR="$PROJECT_DIR/api"
FRONTEND_DIR="$PROJECT_DIR"
NGINX_WWW_DIR="/home/newstar/wellbeing/dist"

echo "========================================"
echo "🚀 开始部署 Wellbeing 系统..."
echo "========================================"

echo "📦 [1/4] 正在检查并安装前端依赖..."
cd "$FRONTEND_DIR"
npm install

echo "🏗️  [2/4] 正在构建前端 (Vite Build)..."
npm run build

echo "📦 [3/4] 正在检查并安装后端依赖..."
cd "$API_DIR"
npm install

echo "🏗️  [4/4] 正在构建后端 (Next.js Build)..."
npm run build

echo "🔄 正在重启后台服务..."
pm2 restart wellbeing-api || pm2 start npm --name "wellbeing-api" -- start
sudo systemctl restart nginx

echo "========================================"
echo "✅ 部署完成！"
echo "🌐 前端静态文件: $NGINX_WWW_DIR/"
echo "🔧 后端 API:     pm2 wellbeing-api (端口 4000)"
echo "🌍 访问地址:     http://localhost:5174"
echo "========================================"
