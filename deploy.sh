#!/bin/bash

set -e

PROJECT_DIR="/Users/guixu/Documents/workspace/wellbeing"
API_DIR="$PROJECT_DIR/api"
FRONTEND_DIR="$PROJECT_DIR"
NGINX_WWW_DIR="/opt/homebrew/var/www/wellbeing"

echo "========================================"
echo "🚀 开始部署 Wellbeing 系统..."
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

echo "� [5/5] 正在移动前端文件到 Nginx 目录..."
sudo mkdir -p "$NGINX_WWW_DIR"
sudo cp -r "$FRONTEND_DIR/dist/"* "$NGINX_WWW_DIR/"
sudo chown -R guixu:staff "$NGINX_WWW_DIR"
sudo chmod -R 755 "$NGINX_WWW_DIR"

echo "🔄 正在重启后台服务..."
pm2 restart wellbeing-api || pm2 start npm --name "wellbeing-api" -- start
brew services restart nginx

echo "========================================"
echo "✅ 部署完成！"
echo "🌐 前端静态文件: $NGINX_WWW_DIR/"
echo "🔧 后端 API:     pm2 wellbeing-api (端口 4000)"
echo "🌍 访问地址:     http://localhost:5174"
echo "========================================"
