"""薄封装：调用 OpenAI 兼容 chat completions。"""

from __future__ import annotations

from typing import Any, Dict, Iterator, List, Optional


def chat(
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.2,
    base_url: Optional[str] = None,
    api_key: Optional[str] = None,
    response_format: Optional[Dict[str, Any]] = None,
    timeout: Optional[float] = 120.0,
) -> str:
    """调用 chat completion 并返回 message.content。

    response_format 例：{"type": "json_object"}；不支持的后端会自动回退。
    """
    from openai import OpenAI  # lazy import

    client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout)
    kwargs: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if response_format is not None:
        try:
            resp = client.chat.completions.create(response_format=response_format, **kwargs)
        except Exception:
            # 后端不支持 response_format 时静默回退
            resp = client.chat.completions.create(**kwargs)
    else:
        resp = client.chat.completions.create(**kwargs)

    if not resp.choices:
        return ""
    msg = resp.choices[0].message
    content = getattr(msg, "content", None)
    return content or ""


def chat_stream(
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.2,
    base_url: Optional[str] = None,
    api_key: Optional[str] = None,
    timeout: Optional[float] = 300.0,
) -> Iterator[str]:
    """流式调用 chat completion，逐块 yield message.content 增量文本。"""
    from openai import OpenAI  # lazy import

    client = OpenAI(api_key=api_key, base_url=base_url, timeout=timeout)
    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        stream=True,
    )
    for chunk in stream:
        choices = getattr(chunk, "choices", None)
        if not choices:
            continue
        delta = getattr(choices[0], "delta", None)
        text = getattr(delta, "content", None) if delta is not None else None
        if text:
            yield text


__all__ = ["chat", "chat_stream"]
