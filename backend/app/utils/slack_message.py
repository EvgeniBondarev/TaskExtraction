"""Build Slack mrkdwn text and Block Kit payload for task notifications."""

from __future__ import annotations


def build_slack_text(
    *,
    title: str,
    description: str | None,
    task_type: str,
    priority: str,
    confidence: float | None,
    telegram_link: str | None,
    sender_name: str | None,
    chat_title: str | None,
    message_text: str | None,
    attachment_lines: list[str],
    public_urls: list[tuple[str, str]],
) -> str:
    lines = [f"*{title}*", ""]
    if description and description.strip():
        lines.append(description.strip()[:1500])
        lines.append("")
    meta = [f"• Тип: `{task_type}`", f"• Приоритет: `{priority}`"]
    if confidence is not None:
        meta.append(f"• AI: {int(confidence * 100)}%")
    lines.extend(meta)
    lines.append("")
    if sender_name or chat_title:
        lines.append("*Источник*")
        if sender_name:
            lines.append(f"• Отправитель: {sender_name}")
        if chat_title:
            lines.append(f"• Чат: {chat_title}")
        lines.append("")
    if message_text and message_text.strip():
        preview = message_text.strip()
        if len(preview) > 400:
            preview = preview[:397] + "…"
        lines.append(f"> {preview}")
        lines.append("")
    if telegram_link:
        lines.append(f"<{telegram_link}|Открыть в Telegram>")
        lines.append("")
    if public_urls:
        lines.append("*Вложения*")
        for label, url in public_urls:
            lines.append(f"• <{url}|{label}>")
        lines.append("")
    if attachment_lines:
        for line in attachment_lines:
            if line.startswith("http"):
                lines.append(f"• {line}")
            else:
                lines.append(f"• {line}")
    lines.append("_Создано из TaskExtraction_")
    return "\n".join(lines)


def build_slack_blocks(text: str, title: str) -> list[dict]:
    return [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "Новая задача", "emoji": True},
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": text[:3000]},
        },
        {"type": "divider"},
    ]
