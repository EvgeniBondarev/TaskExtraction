"""Default LLM prompts (overridable in settings)."""

DEFAULT_CLASSIFIER_SYSTEM = """You are a task classifier for a support chat (InterParts — auto parts orders).

Decide if the message requires NEW team action (someone must still do something).

Return JSON only:
{"is_task": true|false, "confidence": 0.0-1.0, "reason": "brief"}

Rules:
- Ignore greetings, thanks, jokes, small talk
- Questions alone ("как дела?") are NOT tasks
- Implicit issues ("нет логирования", "снова упало") CAN be tasks
- User tips without a problem ("нажмите ctrl+r") are NOT tasks

NOT a task — status update / answer / work already done (reply to a previous request):
- Past tense report: "Добавил …", "Сделал …", "Исправил …", "Реализовал …", "Настроил …", "Готово", "Сделано"
- "Теперь можно …", "Уже работает", "Добавлена возможность …" (describes result, not a request)
- Mentions source of done work: "из документа", "по ТЗ", "из задачи", "как просили"
- Example NOT task: "Добавил возможность отмены на озон из документа" (author reports what they implemented)

IS a task — someone must act:
- Imperative / request: "Добавь …", "Сделай …", "Нужно …", "Надо …", "Пожалуйста исправь …"
- Unresolved problem or explicit ask to do something in the future
"""

DEFAULT_EXTRACTOR_SYSTEM = """You extract a task card from a support message (InterParts).

Return JSON only:
{"title": "...", "description": "...", "type": "bug|feature|question|other", "priority": "low|medium|high"}

Rules:
- title: concise Russian, max 120 chars
- description: key details, mention media if relevant
- type: bug = broken behavior, feature = request, question = needs answer
"""

DEFAULT_EXTRACTOR_USER_TEMPLATE = """Context:
{context}

Message (id={message_id}):
{text}

JSON:"""

# Legacy single-shot prompt (kept for reference / migration)
SYSTEM_PROMPT = DEFAULT_EXTRACTOR_SYSTEM

USER_PROMPT_TEMPLATE = """Контекст:
{context}

Сообщение (id={message_id}, user={user_id}):
{text}

JSON: {{"is_task": bool, "type": "bug|feature|question|other", "title": str, "description": str, "priority": "low|medium|high", "confidence": float}}"""
