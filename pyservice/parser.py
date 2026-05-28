"""Word 文档解析与切块。"""

from __future__ import annotations

from typing import Any, Dict, List


_RESEARCH_DESIGN_START = ("研究设计", "研究方法", "数据来源", "实验设计", "模型构建")
_RESEARCH_DESIGN_END = (
    "模型分析",
    "实证分析",
    "结果分析",
    "实验结果",
    "数据分析",
    "讨论与结论",
)


def _read_paragraphs(path: str) -> List[str]:
    from docx import Document  # python-docx, lazy import

    doc = Document(path)
    out: List[str] = []
    for p in doc.paragraphs:
        text = (p.text or "").strip()
        if text:
            out.append(text)
    # 同时把表格中的文字也拉进来，避免漏掉关键信息
    for table in getattr(doc, "tables", []) or []:
        for row in table.rows:
            for cell in row.cells:
                cell_text = (cell.text or "").strip()
                if cell_text:
                    out.append(cell_text)
    return out


def _hits(line: str, markers) -> bool:
    if not line:
        return False
    for m in markers:
        if m in line:
            return True
    return False


def parse_docx(path: str) -> Dict[str, Any]:
    """解析 docx，返回 full_text/paragraphs/research_design_text。"""
    paragraphs = _read_paragraphs(path)
    full_text = "\n\n".join(paragraphs)

    collected: List[str] = []
    state = "idle"  # idle -> collecting -> done
    for line in paragraphs:
        if state == "idle":
            if _hits(line, _RESEARCH_DESIGN_START):
                state = "collecting"
                collected.append(line)
        elif state == "collecting":
            if _hits(line, _RESEARCH_DESIGN_END):
                state = "done"
                break
            collected.append(line)
        else:
            break

    research_design_text = "\n".join(collected).strip()
    return {
        "full_text": full_text,
        "paragraphs": paragraphs,
        "research_design_text": research_design_text,
    }


def sliding_chunks(text: str, size: int = 500, overlap: int = 100) -> List[Dict[str, Any]]:
    """按字符滑动窗口切块。返回 chunk_index/offset_start/paragraph_index/chunk_text。

    size: 窗口大小（字符数）
    overlap: 相邻窗口重叠（字符数）
    """
    if not text:
        return []
    if size <= 0:
        raise ValueError("size must be positive")
    if overlap < 0 or overlap >= size:
        overlap = max(0, min(overlap, size - 1))
    step = size - overlap
    n = len(text)
    out: List[Dict[str, Any]] = []
    idx = 0
    pos = 0
    while pos < n:
        end = min(pos + size, n)
        chunk_text = text[pos:end]
        out.append(
            {
                "chunk_index": idx,
                "offset_start": pos,
                "paragraph_index": -1,
                "chunk_text": chunk_text,
            }
        )
        idx += 1
        if end >= n:
            break
        pos += step
    return out


__all__ = ["parse_docx", "sliding_chunks"]
