"""Build Atlassian Document Format for Jira issue descriptions."""

from __future__ import annotations


def _text(text: str, *, bold: bool = False, link: str | None = None) -> dict:
    node: dict = {"type": "text", "text": text}
    marks = []
    if bold:
        marks.append({"type": "strong"})
    if link:
        marks.append({"type": "link", "attrs": {"href": link}})
    if marks:
        node["marks"] = marks
    return node


def _paragraph(*parts: dict | None) -> dict:
    content = [p for p in parts if p]
    if not content:
        content = [_text(" ")]
    return {"type": "paragraph", "content": content}


def _heading(text: str, level: int = 3) -> dict:
    return {
        "type": "heading",
        "attrs": {"level": level},
        "content": [_text(text, bold=True)],
    }


def _bullet_list(items: list[str]) -> dict:
    return {
        "type": "bulletList",
        "content": [
            {
                "type": "listItem",
                "content": [_paragraph(_text(item))],
            }
            for item in items
        ],
    }


def build_description_adf(
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
) -> dict:
    """Compose rich Jira description from task context."""
    blocks: list[dict] = []

    if description and description.strip():
        blocks.append(_heading("Описание"))
        for line in description.strip().split("\n"):
            blocks.append(_paragraph(_text(line) if line.strip() else _text(" ")))

    meta_items = [
        f"Тип: {task_type}",
        f"Приоритет: {priority}",
    ]
    if confidence is not None:
        meta_items.append(f"Уверенность AI: {int(confidence * 100)}%")
    blocks.append(_heading("Метаданные"))
    blocks.append(_bullet_list(meta_items))

    source_lines: list[str] = []
    if sender_name:
        source_lines.append(f"Отправитель: {sender_name}")
    if chat_title:
        source_lines.append(f"Чат: {chat_title}")
    if message_text and message_text.strip():
        preview = message_text.strip()
        if len(preview) > 500:
            preview = preview[:497] + "…"
        source_lines.append(f"Сообщение: {preview}")
    if source_lines:
        blocks.append(_heading("Источник (Telegram)"))
        blocks.append(_bullet_list(source_lines))
        if telegram_link:
            blocks.append(
                _paragraph(
                    _text("Открыть в Telegram: ", bold=True),
                    _text(telegram_link, link=telegram_link),
                )
            )

    if attachment_lines:
        blocks.append(_heading("Вложения"))
        blocks.append(_bullet_list(attachment_lines))

    if public_attachment_urls:
        blocks.append(_heading("Ссылки на файлы"))
        for label, url in public_attachment_urls:
            blocks.append(_paragraph(_text(f"{label}: ", bold=True), _text(url, link=url)))

    if not blocks:
        blocks.append(_paragraph(_text("Создано из TaskExtraction")))

    return {"type": "doc", "version": 1, "content": blocks}
