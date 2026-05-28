"""FastAPI 应用：嵌入、查询重写、生成、数据分析。

启动：
    uvicorn pyservice.main:app --host 0.0.0.0 --port 8001 --reload
"""

from __future__ import annotations

import json
import os
import re
import threading
import traceback
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import analyze as analyze_mod
from . import db as dbmod
from . import llm as llm_mod
from .embeddings import Embedder
from .tokenize_cn import tokenize

DEFAULT_DB = "/Users/deeryou/xcj-dev/data/storage/papers.db"

app = FastAPI(title="xcj-dev pyservice", version="0.1.0")


# --- lazy resources ---

_embedder_lock = threading.Lock()
_embedder: Optional[Embedder] = None


def _get_embedder() -> Embedder:
    global _embedder
    if _embedder is not None:
        return _embedder
    with _embedder_lock:
        if _embedder is None:
            backend = os.environ.get("EMBED_BACKEND") or "local"
            model = os.environ.get("EMBED_MODEL") or "BAAI/bge-small-zh-v1.5"
            api_key = os.environ.get("LLM_API_KEY")
            base_url = os.environ.get("LLM_BASE_URL")
            _embedder = Embedder(
                backend=backend, model=model, api_key=api_key, base_url=base_url
            )
        return _embedder


def _get_conn():
    db_path = os.environ.get("DB_PATH") or DEFAULT_DB
    conn = dbmod.connect(db_path)
    return conn


# --- schemas ---


class EmbedRequest(BaseModel):
    texts: List[str] = Field(default_factory=list)


class EmbedResponse(BaseModel):
    vectors: List[List[float]]


class RewriteRequest(BaseModel):
    q: str


class GeneratePaper(BaseModel):
    paper_id: str = ""
    title: str = ""
    doi: str = ""
    author: str = ""
    keywords: str = ""
    abstract: str = ""
    publish_year: Optional[int] = None
    research_design_text: str = ""
    top_chunk_text: str = ""
    relevance_score: float = 0.0


class GenerateRequest(BaseModel):
    query: str
    papers: List[GeneratePaper] = Field(default_factory=list)


class AnalyzeRequest(BaseModel):
    kind: str
    params: Dict[str, Any] = Field(default_factory=dict)


# --- routes ---


@app.get("/health")
def health() -> Dict[str, Any]:
    dim = 0
    try:
        # 不强制初始化模型；如果还没加载就返回 0
        if _embedder is not None:
            dim = _embedder.dim
    except Exception:
        dim = 0
    return {"status": "ok", "dim": int(dim)}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest) -> EmbedResponse:
    try:
        embedder = _get_embedder()
        vectors = embedder.embed(req.texts or [])
        return EmbedResponse(vectors=vectors)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": "embed_failed", "message": str(e)})


# --- rewrite ---

_REWRITE_SYSTEM = (
    "你是学术检索查询重写助手。请严格按 JSON Schema 输出，不要解释，"
    "不要使用 markdown 代码块。\n"
    "返回结构：\n"
    "{\n"
    '  "filter_conditions": { "publish_year": 整数或 null },\n'
    '  "search_payload": {\n'
    '    "core_semantic_sentence": 字符串,\n'
    '    "academic_keywords": [字符串...],\n'
    '    "synonyms_and_extensions": [字符串...],\n'
    '    "potential_variables": [字符串...],\n'
    '    "research_design_terms": [字符串...]\n'
    "  }\n"
    "}\n"
    "规则：\n"
    "- 如果用户没指定年份则 publish_year 为 null。\n"
    "- 如果没有明确的方法/模型/算法/实验设计意图，research_design_terms 必须为 []。\n"
    "- 关键词列表不要包含停用词，去重，使用中文学术词。"
)


_YEAR_RE = re.compile(r"(19|20)\d{2}")


def _fallback_rewrite(q: str) -> Dict[str, Any]:
    """LLM 失败时的启发式回退：直接分词 + 年份正则。"""
    year_match = _YEAR_RE.search(q or "")
    year: Optional[int] = None
    if year_match:
        try:
            year = int(year_match.group(0))
        except ValueError:
            year = None
    # 简易关键词：取 token 中长度 >= 2 的中文 bigram + ASCII 词
    raw_tokens = tokenize(q or "")
    keywords: List[str] = []
    seen = set()
    for t in raw_tokens:
        if t.isascii():
            if len(t) >= 2 and t not in seen:
                seen.add(t)
                keywords.append(t)
        else:
            if len(t) >= 2 and t not in seen:
                seen.add(t)
                keywords.append(t)
    return {
        "filter_conditions": {"publish_year": year},
        "search_payload": {
            "core_semantic_sentence": q or "",
            "academic_keywords": keywords[:12],
            "synonyms_and_extensions": [],
            "potential_variables": [],
            "research_design_terms": [],
        },
    }


def _strip_codefence(text: str) -> str:
    if not text:
        return ""
    s = text.strip()
    if s.startswith("```"):
        # 去掉 ```json ... ``` 包裹
        s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
        s = re.sub(r"\s*```\s*$", "", s)
    return s.strip()


def _normalize_rewrite(raw: Dict[str, Any], q: str) -> Dict[str, Any]:
    base = _fallback_rewrite(q)
    if not isinstance(raw, dict):
        return base
    filt = raw.get("filter_conditions") or {}
    if not isinstance(filt, dict):
        filt = {}
    publish_year = filt.get("publish_year")
    if isinstance(publish_year, str):
        m = _YEAR_RE.search(publish_year)
        publish_year = int(m.group(0)) if m else None
    elif isinstance(publish_year, (int, float)):
        publish_year = int(publish_year)
    else:
        publish_year = None

    payload = raw.get("search_payload") or {}
    if not isinstance(payload, dict):
        payload = {}

    def _as_list(v) -> List[str]:
        if v is None:
            return []
        if isinstance(v, str):
            return [v] if v.strip() else []
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        return []

    return {
        "filter_conditions": {"publish_year": publish_year},
        "search_payload": {
            "core_semantic_sentence": str(payload.get("core_semantic_sentence") or q or "").strip(),
            "academic_keywords": _as_list(payload.get("academic_keywords"))
            or base["search_payload"]["academic_keywords"],
            "synonyms_and_extensions": _as_list(payload.get("synonyms_and_extensions")),
            "potential_variables": _as_list(payload.get("potential_variables")),
            "research_design_terms": _as_list(payload.get("research_design_terms")),
        },
    }


@app.post("/rewrite")
def rewrite(req: RewriteRequest) -> Dict[str, Any]:
    q = (req.q or "").strip()
    if not q:
        return _fallback_rewrite("")
    model = os.environ.get("LLM_MODEL") or ""
    base_url = os.environ.get("LLM_BASE_URL")
    api_key = os.environ.get("LLM_API_KEY")
    try:
        temperature = float(os.environ.get("LLM_TEMPERATURE") or 0.2)
    except ValueError:
        temperature = 0.2

    if not model or not api_key:
        return _fallback_rewrite(q)

    messages = [
        {"role": "system", "content": _REWRITE_SYSTEM},
        {"role": "user", "content": q},
    ]
    try:
        content = llm_mod.chat(
            messages,
            model=model,
            temperature=temperature,
            base_url=base_url,
            api_key=api_key,
            response_format={"type": "json_object"},
        )
        content = _strip_codefence(content)
        if not content:
            return _fallback_rewrite(q)
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            # 再尝试取首个 JSON 对象
            m = re.search(r"\{[\s\S]*\}", content)
            if not m:
                return _fallback_rewrite(q)
            try:
                data = json.loads(m.group(0))
            except json.JSONDecodeError:
                return _fallback_rewrite(q)
        return _normalize_rewrite(data, q)
    except Exception:
        traceback.print_exc()
        return _fallback_rewrite(q)


# --- generate ---


_GENERATE_SYSTEM = (
    "你是严谨的学术研究助理，负责基于提供的核心文献生成文献综述/研究设计分析报告。\n"
    "请遵守以下三条硬性规则：\n"
    "规则 1：学术溯源。每一处引述、实验数据或结论句末必须标注对应的 [DOI:xxx] 锚点；若文献无 DOI 则使用 [PaperID:xxx]。\n"
    "规则 2：零幻觉红线。只能基于提供的资料回答，若资料中无相关变量或数据，必须直接回答“无法得出结论”，严禁编造。\n"
    "规则 3：结构化论证。使用总-分-总结构：先总述研究问题与核心结论；中段分条罗列自变量、因变量与中介路径的关联；末段总结研究局限与未来方向。\n"
    "输出语言：简体中文，正文使用 Markdown，但禁止使用任何代码块。"
)


def _build_context_stream(papers: List[GeneratePaper]) -> str:
    parts: List[str] = []
    for idx, p in enumerate(papers, start=1):
        doi = p.doi.strip() or f"PaperID:{p.paper_id}"
        title = p.title.strip() or p.paper_id
        year = p.publish_year if p.publish_year is not None else "未知"
        author = p.author.strip() or "（未提供）"
        keywords = p.keywords.strip() or "（未提供）"
        abstract = p.abstract.strip() or "（未提供）"
        chunk = p.top_chunk_text.strip() or "（未提供）"
        design = p.research_design_text.strip() or "（未提供）"
        block = (
            f"【核心文献 {idx}】\n"
            f"标题: {title} | DOI: {doi} | 发表年份: {year}\n"
            f"作者: {author}\n"
            f"关键词: {keywords}\n"
            f"摘要: {abstract}\n"
            f"相关语义片段: {chunk}\n"
            f"独立研究设计原文: {design}\n"
        )
        parts.append(block)
    return "\n\n".join(parts)


@app.post("/generate")
def generate(req: GenerateRequest) -> Dict[str, Any]:
    query = (req.query or "").strip()
    papers = req.papers or []
    if not query:
        raise HTTPException(status_code=400, detail={"error": "empty_query"})

    model = os.environ.get("LLM_MODEL") or ""
    base_url = os.environ.get("LLM_BASE_URL")
    api_key = os.environ.get("LLM_API_KEY")
    if not model or not api_key:
        raise HTTPException(
            status_code=500,
            detail={"error": "llm_not_configured", "message": "LLM_MODEL / LLM_API_KEY missing"},
        )
    try:
        temperature = float(os.environ.get("LLM_TEMPERATURE") or 0.2)
    except ValueError:
        temperature = 0.2

    context_stream = _build_context_stream(papers)
    user_prompt = (
        f"用户研究问题：{query}\n\n"
        f"以下是检索系统返回的 Top {len(papers)} 篇核心文献，按相关性从高到低排序：\n\n"
        f"{context_stream}\n\n"
        "请严格按系统规则生成学术分析。"
    )
    messages = [
        {"role": "system", "content": _GENERATE_SYSTEM},
        {"role": "user", "content": user_prompt},
    ]

    try:
        answer = llm_mod.chat(
            messages,
            model=model,
            temperature=temperature,
            base_url=base_url,
            api_key=api_key,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={"error": "generate_failed", "message": str(e)},
        )

    citations: List[Dict[str, Any]] = []
    for p in papers:
        citations.append(
            {
                "paper_id": p.paper_id,
                "title": p.title,
                "doi": p.doi,
                "author": p.author,
                "keywords": p.keywords,
                "abstract": p.abstract,
                "publish_year": p.publish_year,
                "relevance_score": p.relevance_score,
                "chunk_text": p.top_chunk_text,
            }
        )

    return {"answer": answer or "", "citations": citations}


# --- analyze ---


_ANALYZE_FUNCS = {
    "year": analyze_mod.year_distribution,
    "authors": analyze_mod.top_authors,
    "keywords": analyze_mod.top_keywords,
    "journals": analyze_mod.journal_distribution,
    "cooccurrence": analyze_mod.keyword_cooccurrence,
    "tfidf": analyze_mod.tfidf_summary,
}


@app.post("/analyze")
def analyze(req: AnalyzeRequest) -> Dict[str, Any]:
    kind = (req.kind or "").strip().lower()
    if kind not in _ANALYZE_FUNCS:
        raise HTTPException(
            status_code=400,
            detail={"error": "unknown_kind", "kind": kind, "supported": list(_ANALYZE_FUNCS)},
        )
    fn = _ANALYZE_FUNCS[kind]
    params = req.params or {}
    try:
        conn = _get_conn()
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "db_open_failed", "message": str(e)})
    try:
        if kind == "year":
            data = fn(conn)
        elif kind == "tfidf":
            data = fn(conn, top_k=int(params.get("top_k", 20)))
        elif kind in ("authors", "keywords", "journals", "cooccurrence"):
            data = fn(conn, n=int(params.get("n", 20 if kind == "authors" else 30)))
        else:  # pragma: no cover
            data = fn(conn)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": "analyze_failed", "message": str(e)})
    finally:
        try:
            conn.close()
        except Exception:
            pass

    return {"data": data}


@app.exception_handler(Exception)
async def _unhandled(request, exc):  # pragma: no cover
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": str(exc)},
    )
