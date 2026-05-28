#!/usr/bin/env bash
# 启动 xcj-dev Docker 部署：build → up -d → 等待 pyservice 健康。
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "[docker-up] build images..."
docker compose build

echo "[docker-up] up -d (pyservice + backend + frontend)..."
docker compose up -d pyservice backend frontend

echo "[docker-up] waiting for pyservice to become healthy..."
for i in $(seq 1 60); do
  status="$(docker inspect -f '{{.State.Health.Status}}' xcjdev-pyservice 2>/dev/null || echo unknown)"
  if [ "$status" = "healthy" ]; then
    echo "[docker-up] pyservice is healthy."
    break
  fi
  if [ "$i" = "60" ]; then
    echo "[docker-up] timeout waiting for pyservice (last status=$status)."
    docker compose logs --tail=50 pyservice || true
    exit 1
  fi
  sleep 2
done

echo
echo "[docker-up] services up:"
docker compose ps
echo
echo "[docker-up] frontend: http://localhost:8088"
echo "[docker-up] backend : http://localhost:8080/api/health"
echo "[docker-up] py-svc  : http://localhost:8001/health"
echo
echo "[docker-up] 如需摄取数据，运行: bash scripts/docker-ingest.sh"
