# xcj-dev 顶层 Makefile
# 所有真实逻辑都在 scripts/ 下，本文件仅提供常用快捷目标。

SHELL := /usr/bin/env bash

.PHONY: help dev ingest build check clean docker-build docker-up docker-ingest docker-down

help:
	@echo "可用目标:"
	@echo "  make dev      启动开发环境 (Python 侧车 + Go 后端 + Vite 前端)"
	@echo "  make ingest   摄取 data/ 下的数据并通知后端 reload"
	@echo "  make build    构建 Go 二进制 + 前端静态资源到 dist/"
	@echo "  make check    运行 go vet / gofmt / compileall / tsc 检查"
	@echo "  make clean    清理 SQLite / dist / node_modules / .venv (需确认)"

dev:
	bash scripts/dev.sh

ingest:
	bash scripts/ingest.sh

build:
	bash scripts/build.sh

check:
	bash scripts/format-check.sh

clean:
	@echo "即将删除以下内容:"
	@echo "  - data/storage/*.db data/storage/*.db-*"
	@echo "  - dist/"
	@echo "  - frontend/node_modules"
	@echo "  - .venv"
	@read -r -p "确认? [y/N] " ans; \
	if [[ "$$ans" == "y" || "$$ans" == "Y" ]]; then \
		rm -f data/storage/*.db data/storage/*.db-* 2>/dev/null || true ; \
		rm -rf dist 2>/dev/null || true ; \
		rm -rf frontend/node_modules 2>/dev/null || true ; \
		rm -rf .venv 2>/dev/null || true ; \
		echo "已清理。" ; \
	else \
		echo "已取消。" ; \
	fi

docker-build:
	docker compose build

docker-up:
	bash scripts/docker-up.sh

docker-ingest:
	bash scripts/docker-ingest.sh $(ARGS)

docker-down:
	docker compose down
