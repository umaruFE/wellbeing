#!/bin/bash

set -e

# 加载 nvm，避免 sudo 环境下 PATH 丢失导致 npm/node 找不到
export NVM_DIR="/home/newstar/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

PROJECT_DIR="/home/newstar/wellbeing"
API_DIR="$PROJECT_DIR/api"
FRONTEND_DIR="$PROJECT_DIR"
NGINX_WWW_DIR="/home/newstar/wellbeing/dist"

# Load the production upload settings before build/restart so `pm2 --update-env`
# replaces any FTP values retained by the previous process.
if [ -f "$API_DIR/.env" ]; then
  set -a
  . "$API_DIR/.env"
  set +a
fi

# Production always uses FTP, regardless of NODE_ENV or values retained by PM2.
export UPLOAD_PROVIDER=ftp
for required_ftp_var in FTP_HOST FTP_USER FTP_PASSWORD FTP_CDN_DOMAIN FTP_BASE_DIR; do
  if [ -z "${!required_ftp_var:-}" ]; then
    echo "❌ 缺少生产 FTP 配置: $required_ftp_var"
    exit 1
  fi
done

echo "========================================"
echo "🚀 开始部署 Wellbeing 系统..."
echo "========================================"

echo "📦 [1/5] 正在检查并安装前端依赖..."
cd "$FRONTEND_DIR"
npm install

echo "🧹 [2/5] 正在清理旧的构建产物..."
rm -rf "$FRONTEND_DIR/dist"

echo "🏗️  [3/5] 正在构建前端 (Vite Build)..."
npm run build

echo "📦 [4/5] 正在检查并安装后端依赖..."
cd "$API_DIR"
npm install

echo "🏗️  [5/5] 正在构建后端 (Next.js Build)..."
npm run build

echo "🔄 正在重启后台服务..."
pm2 restart wellbeing-api --update-env || pm2 start npm --name "wellbeing-api" -- start
sudo systemctl restart nginx

echo "========================================"
echo "✅ 部署完成！"
echo "🌐 前端静态文件: $NGINX_WWW_DIR/"
echo "🔧 后端 API:     pm2 wellbeing-api (端口 4000)"
echo "🌍 访问地址:     http://localhost:80"
echo "========================================"
