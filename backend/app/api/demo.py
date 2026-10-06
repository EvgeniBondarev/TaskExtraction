"""Публичное демо для лендинга: разбор одного сообщения тем же пайплайном, что и в панели.

Ничего не сохраняет. Защищено лимитами: длина текста, запросы с одного IP и общий
лимит в час, чтобы демо нельзя было использовать как бесплатный доступ к LLM.
"""

from __future__ import annotations

import logging
import time
from collections import deque
from threading import Lock

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.config import get_settings
from app.extraction.analysis import analyze_text, resolve_type_priority
from app.extraction.llm import extract_task_fields
from app.services.llm_settings import builtin_llm_config
from app.services.prompt_settings import default_prompt_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/demo", tags=["demo"])

MAX_TEXT_CHARS = 400
PER_IP_LIMITS = ((60, 6), (3600, 40))  # (окно в секундах, запросов)
GLOBAL_LIMIT = (3600, 500)


class _RateLimiter:
    """Скользящее окно в памяти процесса. Для одного инстанса API этого достаточно."""

    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = {}
        self._lock = Lock()

    def allow(self, key: str, limits: tuple[tuple[int, int], ...]) -> bool:
        now = time.monotonic()
        longest = max(window for window, _ in limits)
        with self._lock:
            hits = self._hits.setdefault(key, deque())
            while hits and now - hits[0] > longest:
                hits.popleft()
            for window, limit in limits:
                if sum(1 for t in hits if now - t <= window) >= limit:
                    return False
            hits.append(now)
            if len(self._hits) > 10_000:
                self._hits = {k: v for k, v in self._hits.items() if v and now - v[-1] <= longest}
            return True


_limiter = _RateLimiter()


class DemoClassifyIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_CHARS)


class DemoClassifyOut(BaseModel):
    verdict: str  # task | candidate | not_task | noise
    confidence: float | None = None
    threshold: float
    reason: str | None = None
    title: str | None = None
    description: str | None = None
    type: str | None = None
    priority: str | None = None
    has_deadline: bool | None = None
    requires_review: bool = False


def _client_ip(request: Request) -> str:
    # nginx перезаписывает X-Real-IP адресом клиента; без прокси берём адрес соединения.
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")


@router.post("/classify", response_model=DemoClassifyOut)
async def demo_classify(body: DemoClassifyIn, request: Request) -> DemoClassifyOut:
    text = body.text.strip()
    if not text:
        raise HTTPException(422, "Напишите сообщение")

    settings = get_settings()
    llm = builtin_llm_config()
    if not settings.jev_openrouter_api_key and not llm.api_key:
        raise HTTPException(503, "Демо сейчас недоступно")

    if not _limiter.allow("global", (GLOBAL_LIMIT,)):
        raise HTTPException(429, "Демо сейчас перегружено. Попробуйте через несколько минут.")
    if not _limiter.allow(f"ip:{_client_ip(request)}", PER_IP_LIMITS):
        raise HTTPException(429, "Слишком много сообщений подряд. Подождите минуту и попробуйте снова.")

    prompts = default_prompt_config()
    analysis = await analyze_text(text, prompts=prompts, llm=llm)

    if analysis.status != "classified":
        return DemoClassifyOut(verdict="noise", threshold=analysis.threshold, reason=analysis.reason)

    decision = analysis.decision
    has_deadline = decision.has_deadline_probability >= 0.5 if decision else None

    if not analysis.passes_gate:
        return DemoClassifyOut(
            verdict="candidate" if analysis.is_task else "not_task",
            confidence=analysis.confidence,
            threshold=analysis.threshold,
            reason=analysis.reason,
            has_deadline=has_deadline,
            requires_review=analysis.requires_review,
        )

    fields = await extract_task_fields(text, 0, [], prompts=prompts, llm=llm)
    task_type, priority = resolve_type_priority(decision, fields.type, fields.priority)
    return DemoClassifyOut(
        verdict="task",
        confidence=analysis.confidence,
        threshold=analysis.threshold,
        reason=analysis.reason,
        title=(fields.title or text)[:200],
        description=(fields.description or "")[:600] or None,
        type=task_type,
        priority=priority,
        has_deadline=has_deadline,
        requires_review=analysis.requires_review,
    )
