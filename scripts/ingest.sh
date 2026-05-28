#!/usr/bin/env bash
set -e

# scripts/ingest.sh - 数据摄取入口
#
# 调用 pyservice.ingest 模块，把 data/ 下的 CSV + docx 解析入库，并尝试
# 触发后端的 /api/reload 接口热重载索引。
#
# 用法:
#   bash scripts/ingest.sh                  # 全量摄取
#   bash scripts/ingest.sh --no-embed       # 首次跑通可跳过向量
#   bash scripts/ingest.sh --limit 100      # 仅处理前 100 条
#   bash scripts/ingest.sh --help           # 透传 ingest CLI 的帮助

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# ---------- 加载 .env ----------
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# ---------- LLM / 嵌入凭据硬编码（允许覆盖）----------
export LLM_API_KEY="${LLM_API_KEY:-602ff18b-1166-4e51-bb42-82d9556d47f8}"
export LLM_BASE_URL="${LLM_BASE_URL:-https://ark.cn-beijing.volces.com/api/v3}"
export LLM_MODEL="${LLM_MODEL:-deepseek-v3-2-251201}"
export LLM_TEMPERATURE="${LLM_TEMPERATURE:-0.2}"
export EMBED_BACKEND="${EMBED_BACKEND:-local}"
export EMBED_MODEL="${EMBED_MODEL:-BAAI/bge-small-zh-v1.5}"

# ---------- 确保 venv ----------
if [[ ! -d .venv ]]; then
  echo "[ingest] 未发现 .venv，正在创建虚拟环境..."
  python3 -m venv .venv
fi
if [[ -f pyservice/requirements.txt ]]; then
  echo "[ingest] 同步 pyservice/requirements.txt 依赖..."
  .venv/bin/pip install --upgrade pip >/dev/null 2>&1 || true
  .venv/bin/pip install -r pyservice/requirements.txt
fi

mkdir -p data/storage

echo "[ingest] 开始摄取数据..."
.venv/bin/python -m pyservice.ingest --data-dir "./data" "$@"
INGEST_RC=$?

if [[ $INGEST_RC -ne 0 ]]; then
  echo "[ingest] 摄取失败，跳过 reload 通知" >&2
  exit $INGEST_RC
fi

# ---------- 通知后端热重载 ----------
RELOAD_URL="http://127.0.0.1:8080/api/reload"
echo "[ingest] 通知后端热重载: $RELOAD_URL"
if curl -fsS -X POST "$RELOAD_URL" >/dev/null 2>&1; then
  echo "[ingest] 后端已重载索引"
else
  echo "[ingest] 后端未在运行或拒绝 reload（已忽略）"
fi

echo "[ingest] 完成。"
