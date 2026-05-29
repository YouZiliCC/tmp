#!/usr/bin/env bash
set -e

# scripts/dev.sh - 一键启动开发环境（Python 侧车 + Go 后端 + Vite 前端）
#
# 工具链约定:
#   - Python: 用 uv 管理虚拟环境与依赖（未装 uv 时回退 stdlib venv + pip）
#   - Node:   用 fnm 管理版本（读 frontend/.nvmrc，默认 22；未装 fnm 时直接用 PATH 里的 npm）
#   - Go:     原生 go（>=1.22），无需额外版本管理
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
# 优先使用 uv（更快，无需 python3-venv apt 包）；没装时回退到 stdlib venv + pip。
ensure_venv() {
  if [[ ! -d .venv ]]; then
    echo "[dev] 未发现 .venv，正在创建虚拟环境..."
    if command -v uv >/dev/null 2>&1; then
      uv venv .venv
    else
      python3 -m venv .venv
    fi
  fi
  # 已经装过 uvicorn（最关键的运行时入口）就跳过重新装包，避免反复拉 sentence-transformers / torch。
  if [[ -f pyservice/requirements.txt && ! -x .venv/bin/uvicorn ]]; then
    echo "[dev] 首次安装 pyservice/requirements.txt 依赖..."
    if command -v uv >/dev/null 2>&1; then
      uv pip install --python .venv/bin/python -r pyservice/requirements.txt
    else
      .venv/bin/pip install --upgrade pip >/dev/null 2>&1 || true
      .venv/bin/pip install -r pyservice/requirements.txt
    fi
  else
    echo "[dev] .venv 依赖已就绪，跳过安装（rm -rf .venv 可强制重装）"
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

# ---------- 准备 Node（优先 fnm，回退 PATH 里的 npm）----------
# 检测到 fnm 时：激活 fnm 环境并按 frontend/.nvmrc（默认 22）安装/切换 Node 版本。
# 没有 fnm 时：直接用 PATH 中现有的 node/npm。
ensure_node() {
  if command -v fnm >/dev/null 2>&1; then
    echo "[dev] 检测到 fnm，激活 Node 版本管理..."
    eval "$(fnm env)"
    (
      cd frontend
      # 读 .nvmrc（若无则用默认 22）并自动安装缺失版本
      fnm use --install-if-missing
    )
  else
    echo "[dev] 未检测到 fnm，使用 PATH 中的 node/npm"
  fi
}

# ---------- 启动前端 ----------
if [[ $WITH_FRONTEND -eq 1 ]]; then
  ensure_node
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
