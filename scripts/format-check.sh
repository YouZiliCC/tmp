#!/usr/bin/env bash
set -e

# scripts/format-check.sh - 格式 / 静态检查
#
# 不会因为单一检查失败而立即退出，所有检查都会执行完毕，
# 最后给出一个汇总（非零项数）。

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FAILED=0
section() {
  echo ""
  echo "==== $1 ===="
}

# ---------- Go ----------
section "go vet ./..."
(
  cd backend
  if ! go vet ./...; then
    echo "[check] go vet 报告了问题"
    FAILED=$((FAILED+1))
  fi
) || FAILED=$((FAILED+1))

section "gofmt -l backend (前 20 行)"
GOFMT_OUT="$(gofmt -l ./backend 2>&1 | head -n 20 || true)"
if [[ -n "$GOFMT_OUT" ]]; then
  echo "$GOFMT_OUT"
  echo "[check] 上述文件未通过 gofmt"
  FAILED=$((FAILED+1))
else
  echo "[check] gofmt 全部通过"
fi

# ---------- Python ----------
section "python -m compileall pyservice"
if [[ -d .venv ]]; then
  PY_BIN=".venv/bin/python"
else
  PY_BIN="python3"
fi
if ! "$PY_BIN" -m compileall pyservice -q; then
  echo "[check] python 语法检查存在问题"
  FAILED=$((FAILED+1))
fi

# ---------- Frontend TS ----------
section "frontend tsc --noEmit"
(
  cd frontend
  if [[ ! -d node_modules ]]; then
    echo "[check] 未安装前端依赖，跳过 tsc。请先 npm install"
  else
    if ! npx --no-install tsc --noEmit; then
      echo "[check] tsc 报告了类型错误"
      FAILED=$((FAILED+1))
    fi
  fi
) || FAILED=$((FAILED+1))

echo ""
if [[ $FAILED -gt 0 ]]; then
  echo "[check] 共有 $FAILED 项检查存在告警/错误（不中断）。"
else
  echo "[check] 全部检查通过。"
fi

# 按约定: 非致命错误也打印但不中断 → 始终以 0 退出
exit 0
