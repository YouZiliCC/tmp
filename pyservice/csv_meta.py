"""万方数据 CSV 元数据加载。"""

from __future__ import annotations

import re
from typing import Optional


_RENAME = {
    "题名": "title",
    "标题": "title",
    "作者": "author",
    "关键词": "keywords",
    "摘要": "abstract",
    "DOI": "doi",
    "CN": "cn",
    "作者单位": "affiliation",
    "刊名": "source",
    "来源": "source",
    "ISSN": "issn",
    "页码": "pages",
    "核心类型": "db_class",
    "数据库类别": "db_class",
    "中图分类号": "subject_code",
    "分类号": "subject_code",
    "序号": "serial",
}

_YEAR_RE = re.compile(r"(19|20)\d{2}")


def _detect_encoding(path: str) -> str:
    try:
        import chardet  # type: ignore
    except Exception:
        return "gbk"
    try:
        with open(path, "rb") as f:
            raw = f.read(200_000)
        guess = chardet.detect(raw) or {}
        enc = (guess.get("encoding") or "").strip()
        return enc or "gbk"
    except Exception:
        return "gbk"


def _extract_year(s) -> Optional[int]:
    if s is None:
        return None
    text = str(s)
    m = _YEAR_RE.search(text)
    if not m:
        return None
    try:
        return int(m.group(0))
    except ValueError:
        return None


def _extract_journal(s) -> str:
    if s is None:
        return ""
    text = str(s).strip()
    if not text:
        return ""
    # 来源字段常见格式："期刊名,2024,46(8):12-20" 或 "期刊名 2024 46(8) 12-20"
    head = re.split(r"[,;，；\s]", text, maxsplit=1)[0]
    return head.strip()


def load_metadata(csv_path: str):
    """读取 CSV → DataFrame，重命名并补充 publish_year/source_journal。"""
    import pandas as pd  # lazy import

    enc = _detect_encoding(csv_path)
    last_err: Optional[Exception] = None
    df = None
    for candidate in (enc, "gbk", "gb18030", "utf-8-sig", "utf-8"):
        if not candidate:
            continue
        try:
            df = pd.read_csv(csv_path, encoding=candidate, dtype=str, keep_default_na=False)
            break
        except Exception as e:  # noqa: PERF203
            last_err = e
            continue
    if df is None:
        raise RuntimeError(f"failed to read csv {csv_path}: {last_err}")

    # 第一列大概率是序号；如果没有自定义列名则补一个
    columns = list(df.columns)
    rename_map = {}
    if columns and columns[0] not in _RENAME and columns[0].strip() not in _RENAME:
        rename_map[columns[0]] = "serial"
    for k, v in _RENAME.items():
        if k in df.columns:
            rename_map[k] = v
    df = df.rename(columns=rename_map)

    # 确保关键列存在
    for col in ("serial", "title", "author", "keywords", "abstract", "doi", "cn",
                "affiliation", "source", "issn", "pages", "db_class", "subject_code"):
        if col not in df.columns:
            df[col] = ""

    df["source_journal"] = df["source"].map(_extract_journal)
    df["publish_year"] = df["source"].map(_extract_year)

    # 去掉首尾空格
    for col in ("title", "author", "keywords", "abstract", "doi", "source_journal"):
        df[col] = df[col].astype(str).str.strip()

    return df


__all__ = ["load_metadata"]
