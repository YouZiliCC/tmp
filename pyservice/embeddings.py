"""统一的 Embedder 接口，封装本地 sentence-transformers 与远端 OpenAI 兼容 embeddings。"""

from __future__ import annotations

from typing import List, Optional

import numpy as np


class Embedder:
    def __init__(
        self,
        backend: str = "local",
        model: str = "BAAI/bge-small-zh-v1.5",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        self.backend = (backend or "local").lower()
        self.model = model
        self.api_key = api_key
        self.base_url = base_url
        self._st_model = None
        self._oa_client = None
        self._dim: Optional[int] = None
        if self.backend not in ("local", "openai"):
            raise ValueError(f"unknown embed backend: {backend}")

    # --- lazy init helpers ---

    def _ensure_local(self):
        if self._st_model is None:
            from sentence_transformers import SentenceTransformer  # lazy import

            self._st_model = SentenceTransformer(self.model)
            try:
                self._dim = int(self._st_model.get_sentence_embedding_dimension())
            except Exception:
                self._dim = None
        return self._st_model

    def _ensure_openai(self):
        if self._oa_client is None:
            from openai import OpenAI  # lazy import

            self._oa_client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        return self._oa_client

    # --- public API ---

    @property
    def dim(self) -> int:
        if self._dim is not None:
            return int(self._dim)
        if self.backend == "local":
            self._ensure_local()
            if self._dim is not None:
                return int(self._dim)
        # 探测一次
        v = self.embed(["dim-probe"])
        if v and v[0]:
            self._dim = len(v[0])
            return int(self._dim)
        return 0

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        if self.backend == "local":
            return self._embed_local(texts)
        return self._embed_openai(texts)

    # --- backends ---

    def _embed_local(self, texts: List[str]) -> List[List[float]]:
        model = self._ensure_local()
        batch = 32
        out: List[List[float]] = []
        for i in range(0, len(texts), batch):
            chunk = texts[i : i + batch]
            arr = model.encode(
                chunk,
                normalize_embeddings=True,
                convert_to_numpy=True,
                show_progress_bar=False,
                batch_size=batch,
            )
            if isinstance(arr, np.ndarray):
                out.extend(arr.astype(np.float32).tolist())
            else:
                for vec in arr:
                    out.append([float(x) for x in vec])
        if out and self._dim is None:
            self._dim = len(out[0])
        return out

    def _embed_openai(self, texts: List[str]) -> List[List[float]]:
        client = self._ensure_openai()
        batch = 64
        out: List[List[float]] = []
        for i in range(0, len(texts), batch):
            chunk = texts[i : i + batch]
            resp = client.embeddings.create(model=self.model, input=chunk)
            for item in resp.data:
                out.append([float(x) for x in item.embedding])
        if out and self._dim is None:
            self._dim = len(out[0])
        return out


__all__ = ["Embedder"]
