#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
exec uvicorn pyservice.main:app --host 0.0.0.0 --port "${PY_PORT:-8001}" --reload
