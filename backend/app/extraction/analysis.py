"""Решение «задача или нет» для одного текста, без работы с БД.

Используется пайплайном (process_message) и публичным демо на лендинге, чтобы оба
работали по одним и тем же правилам: префильтр → Jev или классификатор → порог.
"""

from __future__ import annotations

import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from typing import Any

from app.extraction.heuristics import combined_confidence, score_message
from app.extraction.jev import JevDecision, decide_task
from app.extraction.llm import classify_message
from app.extraction.prefilter import analyze_prefilter, is_incident_report
from app.schemas.extraction import ClassifierResult
from app.services.llm_settings import EffectiveLlmConfig
from app.services.prompt_settings import PromptConfig

logger = logging.getLogger(__name__)

ContextLoader = Callable[[], Awaitable[list[str]]]


async def _no_context() -> list[str]:
    return []


@dataclass
class TextAnalysis:
    status: str  # prefilter_skip | no_signals | classified
    threshold: float
    passes_gate: bool = False
    is_task: bool = False
    confidence: float | None = None
    ai_confidence: float | None = None
    heuristic: float | None = None
    reason: str | None = None
    skip_reason: str | None = None
    incident_report: bool = False
    requires_review: bool = False
    decision: JevDecision | None = None
    context: list[str] = field(default_factory=list)

    def classification(self, *, created: bool = False) -> dict[str, Any]:
        """Формат message.raw["classification"], который читает лента."""
        if self.status == "prefilter_skip":
            return {"status": "prefilter_skip", "reason": self.reason, "is_task": False, "threshold": self.threshold}
        if self.status == "no_signals":
            return {
                "status": "no_signals",
                "is_task": False,
                "heuristic": self.heuristic,
                "threshold": self.threshold,
                "reason": self.reason,
            }
        data: dict[str, Any] = {
            "status": "classified",
            "is_task": True if created else self.is_task,
            "confidence": self.confidence,
            "ai_confidence": self.ai_confidence,
            "reason": self.reason,
            "heuristic": self.heuristic,
            "threshold": self.threshold,
        }
        if not created:
            data["skip_reason"] = self.skip_reason
            data["incident_report"] = self.incident_report
        data["requires_review"] = self.requires_review
        data["decision"] = self.decision.as_dict() if self.decision else None
        return data


_TYPES = ("bug", "feature", "question", "other")
_PRIORITIES = ("low", "medium", "high")


def resolve_type_priority(decision: JevDecision | None, field_type: str, field_priority: str) -> tuple[str, str]:
    """Тип и приоритет карточки: из решения Jev, иначе из извлечённых полей; неизвестное → other/medium."""
    task_type = decision.task_type if decision else field_type
    priority = decision.priority if decision else field_priority
    return (task_type if task_type in _TYPES else "other", priority if priority in _PRIORITIES else "medium")


async def analyze_text(
    text: str | None,
    *,
    prompts: PromptConfig,
    has_media: bool = False,
    force_create: bool = False,
    context_loader: ContextLoader = _no_context,
    llm: EffectiveLlmConfig | None = None,
) -> TextAnalysis:
    """Rules → classifier → score → gate. Контекст чата загружается, только если дело дошло до LLM."""
    threshold = prompts.confidence_threshold
    pre = analyze_prefilter(text, has_media)

    if pre.skip:
        return TextAnalysis(status="prefilter_skip", threshold=threshold, reason=pre.reason)

    if not pre.should_call_llm:
        h = score_message(text)
        return TextAnalysis(
            status="no_signals",
            threshold=threshold,
            heuristic=h.score,
            reason="Нет сигналов для классификатора",
        )

    heuristic = score_message(text)
    context = await context_loader()

    decision = None
    try:
        decision = await decide_task(text or "", context)
    except Exception:
        logger.exception("Jev decision failed; using legacy classifier")

    if decision:
        classification = ClassifierResult(
            is_task=decision.is_task_probability >= 0.5,
            confidence=decision.is_task_probability,
            reason="TypeSafe Jev structured decision",
        )
    else:
        classification = await classify_message(text or "", context, prompts=prompts, llm=llm)

    # Jev already returns a calibrated task probability. Do not dilute a clear
    # decision with keyword heuristics that were designed for the legacy LLM.
    final_confidence = (
        decision.is_task_probability if decision else combined_confidence(heuristic.score, classification.confidence)
    )
    incident = heuristic.incident_report or is_incident_report(text or "")
    requires_review = bool(
        decision
        and (
            decision.needs_review_probability >= 0.55
            or decision.task_count == "multiple"
            or decision.task_type_confidence < 0.45
            or decision.priority_confidence < 0.45
        )
    )
    effective_is_task = classification.is_task or (
        incident and heuristic.has_action_verb and classification.confidence >= min(0.50, threshold - 0.15)
    )
    if decision:
        # Review is shown to the user, but must not prevent an unambiguous,
        # high-confidence incident from reaching the board.
        passes_gate = (
            decision.is_task_probability >= threshold
            and decision.task_type_confidence >= 0.45
            and decision.priority_confidence >= 0.45
        )
    else:
        passes_gate = (classification.is_task and classification.confidence >= threshold) or (
            incident and heuristic.has_action_verb and classification.confidence >= min(0.50, threshold - 0.15)
        )
    if force_create and effective_is_task:
        passes_gate = True

    skip_reason = None
    if not passes_gate:
        skip_reason = "not_task" if not effective_is_task else ("needs_review" if requires_review else "ai_below_threshold")

    return TextAnalysis(
        status="classified",
        threshold=threshold,
        passes_gate=passes_gate,
        is_task=effective_is_task,
        confidence=final_confidence,
        ai_confidence=classification.confidence,
        heuristic=heuristic.score,
        reason=classification.reason,
        skip_reason=skip_reason,
        incident_report=incident,
        requires_review=requires_review,
        decision=decision,
        context=context,
    )
