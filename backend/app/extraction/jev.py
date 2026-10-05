"""Typed task-triage decisions using TypeSafe Jev on OpenRouter."""

from __future__ import annotations

from dataclasses import dataclass
import time
from typing import Any

import httpx

from app.config import get_settings


@dataclass(frozen=True)
class JevDecision:
    model: str
    is_task_probability: float
    task_type: str
    task_type_confidence: float
    priority: str
    priority_confidence: float
    complexity: str
    complexity_confidence: float
    urgency_score: float
    urgency_confidence: float
    impact_score: float
    impact_confidence: float
    needs_review_probability: float
    has_deadline_probability: float
    task_count: str
    latency_ms: int
    cost_usd: float | None

    def as_dict(self) -> dict[str, Any]:
        return {
            "provider": "typesafe_jev",
            "model": self.model,
            "is_task_probability": self.is_task_probability,
            "task_type": self.task_type,
            "task_type_confidence": self.task_type_confidence,
            "priority": self.priority,
            "priority_confidence": self.priority_confidence,
            "complexity": self.complexity,
            "complexity_confidence": self.complexity_confidence,
            "urgency_score": self.urgency_score,
            "urgency_confidence": self.urgency_confidence,
            "impact_score": self.impact_score,
            "impact_confidence": self.impact_confidence,
            "needs_review_probability": self.needs_review_probability,
            "has_deadline_probability": self.has_deadline_probability,
            "task_count": self.task_count,
            "latency_ms": self.latency_ms,
            "cost_usd": self.cost_usd,
        }


def enabled() -> bool:
    return bool(get_settings().jev_openrouter_api_key)


def _noul(answer: dict[str, Any]) -> float:
    return max(0.0, min(1.0, float(answer.get("noul", 0.0))))


def _choice(answer: dict[str, Any], fallback: str) -> tuple[str, float]:
    return str(answer.get("choice") or fallback), max(0.0, min(1.0, float(answer.get("confidence", 0.0))))


def _score(answer: dict[str, Any]) -> tuple[float, float]:
    return float(answer.get("score", 0.0)), max(0.0, min(1.0, float(answer.get("confidence", 0.0))))


async def decide_task(message: str, context_lines: list[str]) -> JevDecision | None:
    """Return structured triage, or None when Jev isn't configured."""
    settings = get_settings()
    if not settings.jev_openrouter_api_key:
        return None

    state = {
        "message": message[:4000] or "(медиа без текста)",
        "recent_chat_context": context_lines[-2:],
        "language": "ru",
    }
    payload = {
        "model": settings.jev_openrouter_model,
        "state": state,
        "questions": {
            "is_task": {
                "type": "noul",
                "instructions": "Нужно ли создать рабочую задачу по этому сообщению?",
                "criteria": {
                    "true": "Есть явная просьба выполнить, исправить, проверить, подготовить, исследовать или решить рабочую проблему.",
                    "false": "Обычная переписка, приветствие, реакция, справочная информация или вопрос без требуемого действия.",
                },
            },
            "task_type": {
                "type": "choice",
                "instructions": "Какой основной тип рабочей задачи описан?",
                "criteria": {
                    "bug": "Ошибка, сбой, регрессия или неожиданное поведение существующей системы.",
                    "feature": "Новая функциональность, доработка или изменение поведения.",
                    "question": "Нужно исследовать или ответить на рабочий вопрос.",
                    "other": "Рабочее действие, не подходящее к остальным типам.",
                },
            },
            "priority": {
                "type": "choice",
                "instructions": "Какой приоритет задачи по последствиям и указанным срокам?",
                "criteria": {
                    "low": "Можно спокойно запланировать; нет заметного влияния или срока.",
                    "medium": "Обычная рабочая задача, которую следует выполнить в плановом порядке.",
                    "high": "Блокирует работу, клиентов, деньги или требует реакции сегодня/срочно.",
                },
            },
            "complexity": {
                "type": "choice",
                "instructions": "Какова предполагаемая сложность выполнения только по доступному тексту?",
                "criteria": {
                    "simple": "Чёткое локальное действие с понятным результатом.",
                    "medium": "Понадобятся несколько шагов, проверка или участие одного направления.",
                    "complex": "Неясные требования, несколько систем/команд, исследование или заметный риск.",
                },
            },
            "urgency": {
                "type": "score",
                "instructions": "Насколько срочно нужна реакция?",
                "criteria": ["Можно запланировать", "Нужно сделать в ближайшие дни", "Нужно реагировать сейчас или сегодня"],
            },
            "impact": {
                "type": "score",
                "instructions": "Насколько велико влияние, если задачу не выполнить?",
                "criteria": ["Локальное или косметическое", "Затрагивает команду или процесс", "Затрагивает клиентов, выручку, безопасность или критичный сервис"],
            },
            "needs_review": {
                "type": "noul",
                "instructions": "Нужна ли ручная проверка перед автоматическим созданием задачи из-за неоднозначности, неполных данных или риска?",
            },
            "has_deadline": {
                "type": "noul",
                "instructions": "Есть ли в сообщении явный срок, дата или требование выполнить к определённому времени?",
            },
            "task_count": {
                "type": "choice",
                "instructions": "Сколько отдельных рабочих задач содержит сообщение?",
                "criteria": {
                    "none": "Нет отдельной задачи.",
                    "one": "Одна основная задача.",
                    "multiple": "Несколько самостоятельных задач, которые стоит разделить.",
                },
            },
        },
    }
    headers = {
        "Authorization": f"Bearer {settings.jev_openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.public_web_url,
        "X-OpenRouter-Title": "TaskExtraction",
    }
    started = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post("https://openrouter.ai/api/alpha/decisions", headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    answers = data.get("answers") or {}
    task_type, task_type_confidence = _choice(answers.get("task_type") or {}, "other")
    priority, priority_confidence = _choice(answers.get("priority") or {}, "medium")
    complexity, complexity_confidence = _choice(answers.get("complexity") or {}, "medium")
    task_count, _ = _choice(answers.get("task_count") or {}, "one")
    urgency_score, urgency_confidence = _score(answers.get("urgency") or {})
    impact_score, impact_confidence = _score(answers.get("impact") or {})
    usage = data.get("usage") or {}
    return JevDecision(
        model=str(data.get("model") or settings.jev_openrouter_model),
        is_task_probability=_noul(answers.get("is_task") or {}),
        task_type=task_type,
        task_type_confidence=task_type_confidence,
        priority=priority,
        priority_confidence=priority_confidence,
        complexity=complexity,
        complexity_confidence=complexity_confidence,
        urgency_score=urgency_score,
        urgency_confidence=urgency_confidence,
        impact_score=impact_score,
        impact_confidence=impact_confidence,
        needs_review_probability=_noul(answers.get("needs_review") or {}),
        has_deadline_probability=_noul(answers.get("has_deadline") or {}),
        task_count=task_count,
        latency_ms=int((time.perf_counter() - started) * 1000),
        cost_usd=float(usage["cost"]) if usage.get("cost") is not None else None,
    )
