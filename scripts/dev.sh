#!/usr/bin/env bash
set -e

# scripts/dev.sh - 一键启动开发环境（Python 侧车 + Go 后端 + Vite 前端）
#
# 用法:
#   bash scripts/dev.sh                # 启动三件套
#   bash scripts/dev.sh --no-frontend  # 跳过前端
#   bash scripts/dev.sh --no-py        # 跳过 Python 侧车
#
# 退出方式: Ctrl-C 会触发 trap 清理所有子进程

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ---------- 解析参数 ----------
WITH_FRONTEND=1
WITH_PY=1
WITH_BACKEND=1
for arg in "$@"; do
  case "$arg" in
    --no-frontend) WITH_FRONTEND=0 ;;
    --no-py)       WITH_PY=0 ;;
    --no-backend)  WITH_BACKEND=0 ;;
    -h|--help)
      grep -E '^# ' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) echo "[dev] 未知参数: $arg" >&2 ; exit 1 ;;
  esac
done

# ---------- 加载 .env ----------
if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    echo "[dev] 未发现 .env，已从 .env.example 复制一份"
    cp .env.example .env
  else
    echo "[dev] 警告: 既无 .env 也无 .env.example，将以默认值运行" >&2
  fi
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# ---------- LLM / 嵌入凭据硬编码（允许 .env 或环境变量覆盖）----------
# 默认走火山方舟（Volces Ark）的 DeepSeek 部署
export LLM_API_KEY="${LLM_API_KEY:-602ff18b-1166-4e51-bb42-82d9556d47f8}"
export LLM_BASE_URL="${LLM_BASE_URL:-https://ark.cn-beijing.volces.com/api/v3}"
export LLM_MODEL="${LLM_MODEL:-deepseek-v3-2-251201}"
export LLM_TEMPERATURE="${LLM_TEMPERATURE:-0.2}"
# 嵌入走本地（火山方舟没有兼容的 embeddings 接口）
export EMBED_BACKEND="${EMBED_BACKEND:-local}"
export EMBED_MODEL="${EMBED_MODEL:-BAAI/bge-small-zh-v1.5}"

# ---------- 日志目录 ----------
mkdir -p data/storage
PY_LOG="$ROOT_DIR/data/storage/py.log"
API_LOG="$ROOT_DIR/data/storage/api.log"
WEB_LOG="$ROOT_DIR/data/storage/web.log"

# 清空旧日志
: > "$PY_LOG"
: > "$API_LOG"
: > "$WEB_LOG"

# ---------- 子进程清单 ----------
PIDS=()

cleanup() {
  echo ""
  echo "[dev] 收到退出信号，正在停止子进程..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      # 杀掉整个进程组，确保 npm/uvicorn 派生的进程也退出
      kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  # 给点时间优雅退出
  sleep 1
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
  done
  echo "[dev] 已退出。"
  exit 0
}
trap cleanup INT TERM EXIT

# ---------- setsid 在 macOS 上默认不存在；做个 noop 兜底 ----------
if ! command -v setsid >/dev/null 2>&1; then
  setsid() { "$@"; }
fi

# ---------- 准备 Python venv ----------
ensure_venv() {
  if [[ ! -d .venv ]]; then
    echo "[dev] 未发现 .venv，正在创建虚拟环境..."
    python3 -m venv .venv
  fi
  if [[ -f pyservice/requirements.txt ]]; then
    echo "[dev] 安装/更新 pyservice/requirements.txt 依赖..."
    .venv/bin/pip install --upgrade pip >/dev/null 2>&1 || true
    .venv/bin/pip install -r pyservice/requirements.txt
  fi
}

# ---------- 启动 Python 侧车 ----------
if [[ $WITH_PY -eq 1 ]]; then
  ensure_venv
  echo "[dev] 启动 Python 侧车 (uvicorn :8001) -> $PY_LOG"
  (
    setsid .venv/bin/uvicorn pyservice.main:app \
      --host 0.0.0.0 --port 8001 --reload \
      >>"$PY_LOG" 2>&1
  ) &
  PIDS+=($!)
fi

# ---------- 启动 Go 后端 ----------
if [[ $WITH_BACKEND -eq 1 ]]; then
  echo "[dev] 启动 Go 后端 (:8080) -> $API_LOG"
  (
    cd backend
    setsid go run ./cmd/server >>"$API_LOG" 2>&1
  ) &
  PIDS+=($!)
fi

# ---------- 启动前端 ----------
if [[ $WITH_FRONTEND -eq 1 ]]; then
  echo "[dev] 准备前端依赖 (npm install)..."
  (
    cd frontend
    if [[ ! -d node_modules ]]; then
      npm install --no-audit --no-fund
    fi
  )
  echo "[dev] 启动前端 (vite :5173) -> $WEB_LOG"
  (
    cd frontend
    setsid npm run dev -- --host >>"$WEB_LOG" 2>&1
  ) &
  PIDS+=($!)
fi

echo ""
echo "[dev] ================================================"
echo "[dev]   Python sidecar : http://127.0.0.1:8001"
echo "[dev]   Go API         : http://127.0.0.1:8080"
echo "[dev]   Frontend       : http://localhost:5173"
echo "[dev] ================================================"
echo "[dev] 正在 tail 日志，Ctrl-C 退出..."
echo ""

# ---------- 前台 tail 日志 ----------
# 使用 -F 跟踪文件，遇到文件 rotate 也能继续
tail -F "$PY_LOG" "$API_LOG" "$WEB_LOG"
