"""Markdown body for GitHub Issues."""

from __future__ import annotations


def build_issue_body(
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
    image_urls: list[tuple[str, str]],
) -> str:
    parts: list[str] = []

    if description and description.strip():
        parts.append(description.strip())
        parts.append("")

    parts.append("### Метаданные")
    parts.append(f"- **Тип:** `{task_type}`")
    parts.append(f"- **Приоритет:** `{priority}`")
    if confidence is not None:
        parts.append(f"- **Уверенность AI:** {int(confidence * 100)}%")
    parts.append("")

    source: list[str] = []
    if sender_name:
        source.append(f"- **Отправитель:** {sender_name}")
    if chat_title:
        source.append(f"- **Чат:** {chat_title}")
    if message_text and message_text.strip():
        preview = message_text.strip()
        if len(preview) > 800:
            preview = preview[:797] + "…"
        parts.append("### Исходное сообщение (Telegram)")
        parts.append(f"> {preview.replace(chr(10), chr(10) + '> ')}")
        parts.append("")
    if source:
        parts.append("### Контекст")
        parts.extend(source)
        parts.append("")
    if telegram_link:
        parts.append(f"- [Открыть в Telegram]({telegram_link})")
        parts.append("")

    if image_urls:
        parts.append("### Изображения")
        for label, url in image_urls:
            parts.append(f"![{label}]({url})")
        parts.append("")

    if attachment_lines or public_attachment_urls:
        parts.append("### Вложения")
        for line in attachment_lines:
            parts.append(f"- {line}")
        for label, url in public_attachment_urls:
            parts.append(f"- [{label}]({url})")
        parts.append("")

    parts.append("---")
    parts.append("*Создано автоматически из TaskExtraction*")

    text = "\n".join(parts).strip()
    return text or "Создано из TaskExtraction"
