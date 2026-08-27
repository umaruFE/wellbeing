#!/usr/bin/env bash
# 在 Wiki.js 所在服务器上执行（Linux）：
#   1. 创建内容裸仓库（作为 Wiki.js Git Storage 的 remote）
#   2. 生成 Wiki.js 容器专用的 SSH 部署密钥
# 用法: bash setup-server.sh [裸仓库路径，默认 ~/wiki-content.git]
set -euo pipefail

REPO_PATH="${1:-$HOME/wiki-content.git}"

if [[ -d "$REPO_PATH" ]]; then
  echo "已存在裸仓库: $REPO_PATH（跳过创建）"
else
  git init --bare -b main "$REPO_PATH"
  echo "已创建裸仓库: $REPO_PATH"
fi

# 为 Wiki.js 容器生成部署密钥（若已存在则复用）
KEY="$HOME/wiki_deploy_key"
if [[ ! -f "$KEY" ]]; then
  ssh-keygen -t ed25519 -f "$KEY" -N "" -C "wikijs-deploy"
  cat "$KEY.pub" >> "$HOME/.ssh/authorized_keys"
  chmod 600 "$HOME/.ssh/authorized_keys"
  echo "已生成部署密钥: $KEY（公钥已加入 authorized_keys）"
else
  echo "部署密钥已存在: $KEY"
fi

IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
USER_NAME="$(whoami)"
cat <<EOF

==========================================================
后续手动步骤：
1. 内容仓库地址（本地/CI 推送用）：
   ssh://${USER_NAME}@${IP:-<服务器IP>}${REPO_PATH}

2. 把私钥全文粘贴到 Wiki.js：
   Administration -> Storage -> Git -> SSH Private Key
   cat ${KEY}

3. 获取 SSH Host Key（取输出第 2、3 列）填入 Wiki.js：
   ssh-keyscan -t ed25519 ${IP:-localhost}
==========================================================
EOF
