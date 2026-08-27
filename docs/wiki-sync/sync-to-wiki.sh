#!/usr/bin/env bash
# 将 docs/markdown 镜像同步到 Wiki.js 内容仓库（新增/修改/删除均同步）
# 适用环境：Git Bash（Windows）/ Linux / CI
# 用法:
#   ./sync-to-wiki.sh ssh://newstar@<服务器IP>/home/newstar/wiki-content.git
# 或通过环境变量:
#   WIKI_GIT_REMOTE=ssh://newstar@<IP>/home/newstar/wiki-content.git ./sync-to-wiki.sh
set -euo pipefail

REMOTE="${1:-${WIKI_GIT_REMOTE:-}}"
BRANCH="${WIKI_GIT_BRANCH:-main}"

if [[ -z "$REMOTE" ]]; then
  echo "ERROR: 缺少远程仓库地址" >&2
  echo "用法: $0 ssh://<user>@<server-ip>/home/newstar/wiki-content.git" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/docs/markdown"
if [[ ! -d "$SRC" ]]; then
  echo "ERROR: 未找到内容目录 $SRC" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# 远程已有分支则克隆，否则初始化空仓库
if git ls-remote --heads "$REMOTE" "$BRANCH" | grep -q "refs/heads/$BRANCH"; then
  echo ">> 克隆远程内容仓库..."
  git clone --quiet --branch "$BRANCH" "$REMOTE" "$TMP/repo"
else
  echo ">> 远程为空，初始化内容仓库..."
  mkdir -p "$TMP/repo"
  git -C "$TMP/repo" init --quiet -b "$BRANCH"
  git -C "$TMP/repo" remote add origin "$REMOTE"
fi

# 镜像拷贝：先清空仓库内除 .git 外的全部内容，再拷入，保证删除也能同步
find "$TMP/repo" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -a "$SRC/." "$TMP/repo/"

git -C "$TMP/repo" add -A
if git -C "$TMP/repo" diff --cached --quiet; then
  echo ">> 内容无变化，无需同步。"
  exit 0
fi

git -C "$TMP/repo" \
  -c user.name="wellbeing-docs-sync" \
  -c user.email="docs-sync@wellbeing.local" \
  commit --quiet -m "sync: docs/markdown $(date '+%Y-%m-%d %H:%M:%S')"

git -C "$TMP/repo" push --quiet origin "$BRANCH"
COUNT="$(find "$SRC" -name '*.md' | wc -l)"
echo ">> 已推送 ${COUNT} 个 md 到 $BRANCH。"
echo ">> Wiki.js 将在下次同步周期自动拉取（或 Administration -> Storage -> Sync Now）。"
