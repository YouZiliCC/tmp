#!/usr/bin/env bash
# 通过一次性 ingest 容器执行数据摄取，所有参数透传给 pyservice.ingest。
# 例：
#   bash scripts/docker-ingest.sh --limit 50
#   bash scripts/docker-ingest.sh --no-embed
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

exec docker compose run --rm ingest "$@"
