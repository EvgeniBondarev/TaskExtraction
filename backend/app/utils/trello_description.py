"""Plain-text / Markdown description for Trello cards."""

from __future__ import annotations


def build_card_description(
    *,
    description: str | None,
    task_type: str,
    priority: str,
    confidence: float | None,
    telegram_link: str | None,
    sender_name: str | None,
    chat_title: str | None,
    message_text: str | None,
    attachment_lines: list[str],
    public_attachment_urls: list[tuple[str, str]],
) -> str:
    parts: list[str] = []

    if description and description.strip():
        parts.append(description.strip())
        parts.append("")

    meta = [f"- **Тип:** {task_type}", f"- **Приоритет:** {priority}"]
    if confidence is not None:
        meta.append(f"- **Уверенность AI:** {int(confidence * 100)}%")
    parts.append("### Метаданные")
    parts.extend(meta)
    parts.append("")

    source: list[str] = []
    if sender_name:
        source.append(f"- **Отправитель:** {sender_name}")
    if chat_title:
        source.append(f"- **Чат:** {chat_title}")
    if message_text and message_text.strip():
        preview = message_text.strip()
        if len(preview) > 500:
            preview = preview[:497] + "…"
        source.append(f"- **Сообщение:** {preview}")
    if source:
        parts.append("### Источник (Telegram)")
        parts.extend(source)
        if telegram_link:
            parts.append(f"- [Открыть в Telegram]({telegram_link})")
        parts.append("")

    if attachment_lines:
        parts.append("### Вложения")
        for line in attachment_lines:
            parts.append(f"- {line}")
        parts.append("")

    if public_attachment_urls:
        parts.append("### Ссылки на файлы")
        for label, url in public_attachment_urls:
            parts.append(f"- [{label}]({url})")
        parts.append("")

    text = "\n".join(parts).strip()
    return text or "Создано из TaskExtraction"
