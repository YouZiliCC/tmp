"""中文/ASCII 分词，规则与 Go 端 backend/internal/search/tokenize.go 等价。

规则：
  - ASCII 字母数字串作为整词（小写化）
  - 中文字符（Unicode 范围 Han）按字符级 + 相邻 bigram 同时入索引
  - 其它字符（标点/空白/全角符号等）视为分隔
"""

from __future__ import annotations

from typing import List


# CJK 统一汉字主区段及常用扩展区，按 Unicode Han 范围近似。
_HAN_RANGES = (
    (0x3400, 0x4DBF),    # CJK Unified Ideographs Extension A
    (0x4E00, 0x9FFF),    # CJK Unified Ideographs
    (0x20000, 0x2A6DF),  # Extension B
    (0x2A700, 0x2B73F),  # Extension C
    (0x2B740, 0x2B81F),  # Extension D
    (0x2B820, 0x2CEAF),  # Extension E
    (0x2CEB0, 0x2EBEF),  # Extension F
    (0x30000, 0x3134F),  # Extension G
    (0xF900, 0xFAFF),    # CJK Compatibility Ideographs
    (0x2F800, 0x2FA1F),  # CJK Compatibility Ideographs Supplement
)


def _is_han(cp: int) -> bool:
    for lo, hi in _HAN_RANGES:
        if lo <= cp <= hi:
            return True
    return False


def _is_ascii_alnum(cp: int) -> bool:
    return (
        (0x61 <= cp <= 0x7A)  # a-z
        or (0x41 <= cp <= 0x5A)  # A-Z
        or (0x30 <= cp <= 0x39)  # 0-9
    )


def tokenize(text: str) -> List[str]:
    """与 Go 侧 search.Tokenize 等价。"""
    if not text:
        return []
    out: List[str] = []
    ascii_buf: List[str] = []
    han_buf: List[str] = []

    def flush_ascii() -> None:
        if ascii_buf:
            out.append("".join(ascii_buf).lower())
            ascii_buf.clear()

    def flush_han() -> None:
        n = len(han_buf)
        for i, ch in enumerate(han_buf):
            out.append(ch)
            if i + 1 < n:
                out.append(ch + han_buf[i + 1])
        han_buf.clear()

    for ch in text:
        cp = ord(ch)
        if _is_ascii_alnum(cp):
            if han_buf:
                flush_han()
            ascii_buf.append(ch)
        elif _is_han(cp):
            if ascii_buf:
                flush_ascii()
            han_buf.append(ch)
        else:
            if ascii_buf:
                flush_ascii()
            if han_buf:
                flush_han()
    if ascii_buf:
        flush_ascii()
    if han_buf:
        flush_han()
    return out


def tokenize_join(text: str) -> str:
    return " ".join(tokenize(text))


__all__ = ["tokenize", "tokenize_join"]
