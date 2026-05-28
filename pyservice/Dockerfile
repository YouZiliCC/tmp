FROM python:3.11-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1

# 系统依赖：python-docx 不需要二进制；sentence-transformers 拉取模型时需要 ca-certificates；scikit-learn / pandas 自带 wheel
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyservice/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/requirements.txt

# 复制源码（保持 pyservice 包路径）
COPY pyservice /app/pyservice

ENV PY_PORT=8001 DB_PATH=/data/papers.db EMBED_BACKEND=local EMBED_MODEL=BAAI/bge-small-zh-v1.5
EXPOSE 8001
CMD ["uvicorn","pyservice.main:app","--host","0.0.0.0","--port","8001"]
