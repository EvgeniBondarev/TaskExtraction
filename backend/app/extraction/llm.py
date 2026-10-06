import json
import logging
import re

from app.schemas.extraction import ClassifierResult, TaskFieldsResult
from app.services.llm_settings import EffectiveLlmConfig, get_effective_llm_config
from app.services.openrouter import chat_completion
from app.services.prompt_settings import PromptConfig, get_prompt_config

logger = logging.getLogger(__name__)

MAX_MESSAGE_CHARS = 600
MAX_CONTEXT_LINE_CHARS = 120
MAX_CONTEXT_LINES = 2


def _truncate(text: str, limit: int) -> str:
    text = (text or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1] + "…"


def _compact_context(context_lines: list[str]) -> str:
    if not context_lines:
        return "(нет)"
    trimmed = [_truncate(line, MAX_CONTEXT_LINE_CHARS) for line in context_lines[-MAX_CONTEXT_LINES:]]
    return "\n".join(trimmed)


async def classify_message(
    text: str,
    context_lines: list[str] | None = None,
    *,
    prompts: PromptConfig | None = None,
    llm: EffectiveLlmConfig | None = None,
) -> ClassifierResult:
    """Stage 1: cheap task vs non-task (minimal tokens).

    prompts/llm можно передать явно (демо без рабочей области), иначе берутся настройки tenant.
    """
    prompts = prompts or await get_prompt_config()
    llm = llm or await get_effective_llm_config()

    body = _truncate(text or "(медиа без текста)", MAX_MESSAGE_CHARS)
    ctx = _compact_context(context_lines or [])

    user_content = f"Context:\n{ctx}\n\nMessage:\n{body}\n\nJSON:"

    messages = [
        {"role": "system", "content": prompts.classifier_system},
        {"role": "user", "content": user_content},
    ]

    try:
        result = await chat_completion(
            llm,
            messages,
            max_tokens=80,
            temperature=0.0,
            json_mode=True,
        )
        parsed = _parse_json(result.content)
        return ClassifierResult(
            is_task=bool(parsed.get("is_task", False)),
            confidence=float(parsed.get("confidence", 0.0)),
            reason=str(parsed.get("reason", ""))[:200],
        )
    except Exception:
        logger.exception("Classifier LLM failed")
        return ClassifierResult(is_task=False, confidence=0.0, reason="llm_error")


async def extract_task_fields(
    text: str,
    message_id: int,
    context_lines: list[str] | None = None,
    *,
    prompts: PromptConfig | None = None,
    llm: EffectiveLlmConfig | None = None,
) -> TaskFieldsResult:
    """Stage 2: task card fields (only after positive classification)."""
    prompts = prompts or await get_prompt_config()
    llm = llm or await get_effective_llm_config()

    body = _truncate(text or "(медиа)", MAX_MESSAGE_CHARS)
    ctx = _compact_context(context_lines or [])

    user_content = prompts.extractor_user_template.format(
        context=ctx,
        message_id=message_id,
        text=body,
    )

    messages = [
        {"role": "system", "content": prompts.extractor_system},
        {"role": "user", "content": user_content},
    ]

    try:
        result = await chat_completion(
            llm,
            messages,
            max_tokens=280,
            temperature=0.1,
            json_mode=True,
        )
        parsed = _parse_json(result.content)
        return TaskFieldsResult(
            title=str(parsed.get("title", ""))[:500],
            description=str(parsed.get("description", ""))[:4000],
            type=str(parsed.get("type", "other"))[:32],
            priority=str(parsed.get("priority", "medium"))[:16],
        )
    except Exception:
        logger.exception("Extractor LLM failed")
        return TaskFieldsResult(title=body[:120] or "Новая задача", description=body)


def _parse_json(content: str) -> dict:
    content = content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", content)
        if match:
            return json.loads(match.group())
        raise
