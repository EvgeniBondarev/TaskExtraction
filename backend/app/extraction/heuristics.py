"""Fast rule-based signals before LLM (token-saving layer)."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.extraction.prefilter import (
    contains_task_keywords,
    is_incident_report,
    is_status_or_completion_report,
    normalize_text,
)

DEADLINE_HINTS = (
    "до ",
    "к ",
    "завтра",
    "сегодня",
    "пятниц",
    "понедельник",
    "срок",
    "deadline",
    "asap",
    "срочно",
)

ASSIGNEE_HINTS = (
    "@",
    "иван",
    "пожалуйста",
    "нужно чтобы",
    "пусть ",
)


@dataclass
class HeuristicScore:
    score: float
    has_action_verb: bool
    has_deadline: bool
    has_assignee_hint: bool
    likely_task: bool
    incident_report: bool = False


def score_message(text: str | None) -> HeuristicScore:
    normalized = normalize_text(text)
    if not normalized:
        return HeuristicScore(0.0, False, False, False, False)

    if is_status_or_completion_report(normalized):
        return HeuristicScore(0.05, False, False, False, False)

    incident = is_incident_report(normalized)
    has_action = contains_task_keywords(normalized) or incident
    has_deadline = any(h in normalized for h in DEADLINE_HINTS)
    has_assignee = any(h in normalized for h in ASSIGNEE_HINTS) or bool(
        re.search(r"@\w+", normalized)
    )

    score = 0.0
    if has_action:
        score += 0.4
    if incident:
        score += 0.25
    if has_deadline:
        score += 0.2
    if has_assignee:
        score += 0.15
    if "?" in normalized and not has_action:
        score -= 0.1
    if len(normalized) >= 40:
        score += 0.1

    score = max(0.0, min(1.0, score))
    if incident:
        score = max(score, 0.55)
    likely = score >= 0.35 or (has_action and len(normalized) >= 12) or incident

    return HeuristicScore(
        score=score,
        has_action_verb=has_action,
        has_deadline=has_deadline,
        has_assignee_hint=has_assignee,
        likely_task=likely,
        incident_report=incident,
    )


def combined_confidence(heuristic: float, ai_confidence: float) -> float:
    return min(1.0, heuristic * 0.35 + ai_confidence * 0.65)
