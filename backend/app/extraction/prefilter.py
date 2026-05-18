"""Layer 1: fast rule-based filter (no LLM tokens)."""

from __future__ import annotations

import re
from dataclasses import dataclass

STOP_PHRASES = frozenset(
    {
        "спасибо",
        "все спасибо",
        "все, спасибо",
        "ок",
        "окей",
        "минуту",
        "минута",
        "не-а",
        "неа",
        "не а",
        "ага",
        "понял",
        "понятно",
        "хорошо",
        "принято",
        "привет",
        "здравствуйте",
        "доброе утро",
        "добрый день",
        "добрый вечер",
        "hi",
        "hello",
    }
)

TASK_VERBS = (
    "сделай",
    "сделать",
    "исправь",
    "исправить",
    "добавь",
    "добавить",
    "обнови",
    "обновить",
    "проверь",
    "проверить",
    "реализуй",
    "реализовать",
    "нужно",
    "надо",
    "почини",
    "починить",
    "подготовь",
    "подготовить",
    "верните",
    "вернуть",
    "создай",
    "создать",
    "убери",
    "удали",
    "настрой",
    "исправления",
    "баг",
    "ошибк",
    "не работает",
    "не отображ",
    "пропал",
    "пропали",
)

GREETING_PATTERNS = re.compile(
    r"^(привет|здравствуй|доброе утро|добрый день|добрый вечер|hi|hello|hey)[\s!.,]*$",
    re.IGNORECASE,
)

# Отчёт о выполненной работе / ответ на запрос — не новая задача
STATUS_REPORT_PATTERNS = (
    re.compile(
        r"^(?:я\s+)?(?:уже\s+|только\s+что\s+)?"
        r"(?:добавил[аио]?|добавили|добавлено|сделал[аио]?|сделали|сделано|"
        r"исправил[аио]?|исправили|исправлено|реализовал[аио]?|реализовано|"
        r"внедрил[аио]?|настроил[аио]?|обновил[аио]?|починил[аио]?|вернул[аио]?|"
        r"убрал[аио]?|удалил[аио]?|отправил[аио]?|закоммитил[аио]?|запушил[аио]?|"
        r"выложил[аио]?|задеплоил[аио]?|внёс[аио]?|внес[аио]?)\b",
        re.IGNORECASE,
    ),
    re.compile(r"^(?:готово|сделано|исправлено|добавлено|реализовано)[\s!.,:—-]", re.IGNORECASE),
    re.compile(r"^теперь\s+(?:можно|есть|работает|доступн)", re.IGNORECASE),
    re.compile(r"\bуже\s+(?:добавил|сделал|исправил|готово|работает)\b", re.IGNORECASE),
    re.compile(
        r"(?:добавил|сделал|исправил|реализовал|настроил|обновил|внедрил)"
        r".{0,120}\bиз\s+(?:документа|тз|задачи|тикета)\b",
        re.IGNORECASE,
    ),
)

MIN_TEXT_LEN = 8
MIN_TEXT_LEN_WITH_MEDIA = 3
MAX_SINGLE_WORD_LEN = 24


def normalize_text(text: str | None) -> str:
    normalized = (text or "").strip().lower()
    return re.sub(r"\s+", " ", normalized)


def contains_task_keywords(text: str) -> bool:
    return any(word in text for word in TASK_VERBS)


def is_status_or_completion_report(text: str) -> bool:
    """Сообщение об уже сделанном (ответ), а не просьба что-то сделать."""
    normalized = normalize_text(text)
    if not normalized:
        return False
    return any(p.search(normalized) for p in STATUS_REPORT_PATTERNS)


@dataclass
class PrefilterResult:
    skip: bool
    reason: str
    should_call_llm: bool


def analyze_prefilter(text: str | None, has_media: bool = False) -> PrefilterResult:
    """
    Returns whether to skip entirely or proceed to LLM.
    should_call_llm=False saves tokens when message is unlikely to be a task.
    """
    normalized = normalize_text(text)

    if not normalized and not has_media:
        return PrefilterResult(True, "empty", False)

    if not normalized and has_media:
        # Photo/doc without caption — short classifier only
        return PrefilterResult(False, "", True)

    if GREETING_PATTERNS.match(normalized):
        return PrefilterResult(True, "greeting", False)

    if normalized in STOP_PHRASES:
        return PrefilterResult(True, "stop_phrase", False)

    if is_status_or_completion_report(normalized):
        return PrefilterResult(True, "status_report", False)

    for phrase in STOP_PHRASES:
        if len(normalized) <= 20 and phrase in normalized and len(normalized) - len(phrase) < 5:
            return PrefilterResult(True, "stop_phrase_partial", False)

    words = normalized.split()
    if len(words) == 1 and len(normalized) <= MAX_SINGLE_WORD_LEN:
        if not contains_task_keywords(normalized):
            return PrefilterResult(True, "single_word", False)

    min_len = MIN_TEXT_LEN_WITH_MEDIA if has_media else MIN_TEXT_LEN
    if len(normalized) < min_len:
        if not contains_task_keywords(normalized):
            return PrefilterResult(True, "too_short", False)

    if len(words) <= 2 and not contains_task_keywords(normalized):
        return PrefilterResult(True, "too_short_no_action", False)

    # Emoji / reaction-only
    if re.fullmatch(r"[\W_]+", normalized):
        return PrefilterResult(True, "no_letters", False)

    has_signals = contains_task_keywords(normalized)
    should_call = has_signals or len(normalized) >= 12 or has_media

    return PrefilterResult(False, "", should_call)


def should_skip_llm(text: str | None, has_media: bool = False) -> tuple[bool, str]:
    """Backward-compatible API."""
    result = analyze_prefilter(text, has_media)
    return result.skip, result.reason
