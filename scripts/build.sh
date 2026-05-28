#!/usr/bin/env bash
set -e

# scripts/build.sh - 生产构建
#
# 产物:
#   dist/server     Go 后端二进制
#   dist/web/       前端静态资源
#
# 注意: 本脚本不会打包 Python 侧车，它建议以源码形式 + venv 运行。

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p dist

# ---------- Go 后端 ----------
echo "[build] 编译 Go 后端 -> dist/server"
(
  cd backend
  go build -o ../dist/server ./cmd/server
)

# ---------- 前端 ----------
echo "[build] 构建前端 (npm ci + npm run build)"
(
  cd frontend
  npm ci
  npm run build
)

echo "[build] 拷贝前端产物 frontend/dist -> dist/web"
rm -rf dist/web
mkdir -p dist/web
cp -R frontend/dist/. dist/web/

# ---------- 清单 ----------
echo ""
echo "[build] 产物清单 (dist/):"
( cd dist && find . -maxdepth 3 -print | sort )
echo ""
echo "[build] 完成。"
