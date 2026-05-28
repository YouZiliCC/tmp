"""数据分析函数：年份、作者、关键词、期刊、共现、TF-IDF。"""

from __future__ import annotations

import re
from collections import Counter
from itertools import combinations
from typing import Any, Dict, List, Tuple

from . import db as dbmod


_SEPARATORS = re.compile(r"[，,；;、/|]")


def _split_field(value) -> List[str]:
    if value is None:
        return []
    text = str(value).strip()
    if not text:
        return []
    items = _SEPARATORS.split(text)
    out: List[str] = []
    for it in items:
        t = it.strip()
        if t:
            out.append(t)
    return out


def year_distribution(conn) -> Dict[int, int]:
    cur = conn.execute(
        "SELECT publish_year, COUNT(*) AS c FROM papers_master "
        "WHERE publish_year IS NOT NULL AND publish_year != '' "
        "GROUP BY publish_year ORDER BY publish_year"
    )
    out: Dict[int, int] = {}
    for row in cur.fetchall():
        year = row[0]
        try:
            y = int(year)
        except (TypeError, ValueError):
            continue
        out[y] = int(row[1])
    return out


def top_authors(conn, n: int = 20) -> List[Tuple[str, int]]:
    counter: Counter[str] = Counter()
    for row in conn.execute("SELECT author FROM papers_master"):
        for a in _split_field(row[0]):
            counter[a] += 1
    return [(name, int(c)) for name, c in counter.most_common(n)]


def top_keywords(conn, n: int = 30) -> List[Tuple[str, int]]:
    counter: Counter[str] = Counter()
    for row in conn.execute("SELECT keywords FROM papers_master"):
        for kw in _split_field(row[0]):
            counter[kw] += 1
    return [(kw, int(c)) for kw, c in counter.most_common(n)]


def journal_distribution(conn, n: int = 20) -> List[Tuple[str, int]]:
    counter: Counter[str] = Counter()
    for row in conn.execute("SELECT source_journal FROM papers_master"):
        v = (row[0] or "").strip()
        if v:
            counter[v] += 1
    return [(j, int(c)) for j, c in counter.most_common(n)]


def keyword_cooccurrence(conn, n: int = 30) -> List[Tuple[str, str, int]]:
    counter: Counter[Tuple[str, str]] = Counter()
    for row in conn.execute("SELECT keywords FROM papers_master"):
        kws = list(dict.fromkeys(_split_field(row[0])))
        if len(kws) < 2:
            continue
        for a, b in combinations(sorted(kws), 2):
            counter[(a, b)] += 1
    return [(a, b, int(c)) for (a, b), c in counter.most_common(n)]


def tfidf_summary(conn, top_k: int = 20) -> Dict[str, List[str]]:
    from sklearn.feature_extraction.text import TfidfVectorizer  # lazy import

    paper_ids: List[str] = []
    docs: List[str] = []
    for row in conn.execute("SELECT paper_id, abstract_tokens, abstract FROM papers_master"):
        pid = row[0]
        tokens = row[1] or ""
        if not tokens.strip():
            # 兜底：摘要原文按字符 unigram 处理
            abstract = (row[2] or "").strip()
            if not abstract:
                continue
            tokens = " ".join(list(abstract))
        paper_ids.append(pid)
        docs.append(tokens)
    if not docs:
        return {}

    vectorizer = TfidfVectorizer(
        token_pattern=r"(?u)\S+",
        lowercase=False,
        max_df=0.95,
        min_df=1,
    )
    try:
        matrix = vectorizer.fit_transform(docs)
    except ValueError:
        return {}
    vocab = vectorizer.get_feature_names_out()
    out: Dict[str, List[str]] = {}
    for i, pid in enumerate(paper_ids):
        row = matrix.getrow(i)
        if row.nnz == 0:
            out[pid] = []
            continue
        # 取前 top_k 的特征索引
        data = row.data
        indices = row.indices
        order = data.argsort()[::-1][:top_k]
        words = [vocab[indices[j]] for j in order]
        out[pid] = list(words)
    return out


__all__ = [
    "year_distribution",
    "top_authors",
    "top_keywords",
    "journal_distribution",
    "keyword_cooccurrence",
    "tfidf_summary",
]


# 保持兼容：允许独立运行调试
if __name__ == "__main__":  # pragma: no cover
    import json
    import os
    import sys

    db_path = os.environ.get("DB_PATH", "/Users/deeryou/xcj-dev/data/storage/papers.db")
    conn = dbmod.connect(db_path)
    out = {
        "year": year_distribution(conn),
        "authors": top_authors(conn, 10),
        "keywords": top_keywords(conn, 10),
        "journals": journal_distribution(conn, 10),
    }
    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
