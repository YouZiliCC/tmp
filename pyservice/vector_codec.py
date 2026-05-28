"""向量编解码：与 Go 端 store.EncodeVector / DecodeVector 等价。

存储格式：base64( little-endian float32 字节 )，base64 字符串再 .encode('ascii')
后作为 BLOB 存入 SQLite，Go 侧读出后做相同的 base64 解码。
"""

from __future__ import annotations

import base64
import struct
from typing import Iterable, Union

import numpy as np

VectorLike = Union[Iterable[float], np.ndarray, bytes]


def encode(vec) -> bytes:
    """将向量编码为 base64(little-endian float32 bytes) 后的 ASCII bytes。"""
    if vec is None:
        return b""
    if isinstance(vec, np.ndarray):
        arr = vec.astype("<f4", copy=False)
        raw = arr.tobytes()
    else:
        floats = list(vec)
        if not floats:
            return b""
        raw = struct.pack("<" + "f" * len(floats), *floats)
    if not raw:
        return b""
    return base64.standard_b64encode(raw)


def decode(blob: bytes) -> np.ndarray:
    """反向解码。空输入返回空 float32 数组。"""
    if blob is None:
        return np.zeros(0, dtype=np.float32)
    if isinstance(blob, memoryview):
        blob = bytes(blob)
    if isinstance(blob, str):
        blob = blob.encode("ascii")
    if not blob:
        return np.zeros(0, dtype=np.float32)
    try:
        raw = base64.standard_b64decode(blob)
    except Exception:
        return np.zeros(0, dtype=np.float32)
    if len(raw) % 4 != 0:
        return np.zeros(0, dtype=np.float32)
    return np.frombuffer(raw, dtype="<f4").astype(np.float32, copy=True)


__all__ = ["encode", "decode"]
