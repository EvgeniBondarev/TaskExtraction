from app.models.entities import Message
from app.schemas.messages import MessageClassificationOut


def build_classification_out(msg: Message, default_threshold: float = 0.75) -> MessageClassificationOut:
    task_created = getattr(msg, "task", None) is not None
    raw = msg.raw or {}
    data = raw.get("classification")

    if not data:
        if task_created:
            return MessageClassificationOut(
                status="classified",
                is_task=True,
                task_created=True,
                confidence=1.0,
            )
        return MessageClassificationOut(status="pending", task_created=False)

    if data.get("status") == "processing":
        return MessageClassificationOut(status="processing", task_created=False)

    if data.get("status") == "error":
        return MessageClassificationOut(
            status="error",
            reason=data.get("reason"),
            task_created=task_created,
        )

    if data.get("status") == "prefilter_skip":
        return MessageClassificationOut(
            status="prefilter_skip",
            is_task=False,
            prefilter_reason=data.get("reason"),
            reason=data.get("reason"),
            task_created=task_created,
        )

    if data.get("status") == "no_signals":
        return MessageClassificationOut(
            status="no_signals",
            is_task=False,
            heuristic_score=data.get("heuristic"),
            reason="Нет сигналов для LLM",
            task_created=task_created,
        )

    threshold = data.get("threshold", default_threshold)
    is_task = bool(data.get("is_task", False))
    combined = data.get("confidence")
    ai = data.get("ai_confidence")
    heuristic = data.get("heuristic")

    return MessageClassificationOut(
        status="classified",
        is_task=is_task,
        confidence=combined,
        ai_confidence=ai,
        heuristic_score=heuristic,
        threshold=threshold,
        reason=data.get("reason"),
        task_created=task_created,
        prefilter_reason=None,
        skip_reason=data.get("skip_reason"),
    )
