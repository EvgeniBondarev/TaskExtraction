from app.models.entities import Task, TelegramProfile
from app.schemas.tasks import ExternalLinkOut, TaskOut
from app.utils.message_media import chat_avatar_url, sender_avatar_url
from app.utils.task_attachments import collect_task_attachments
from app.utils.telegram_link import build_telegram_message_link


def _is_group_chat(telegram_chat_id: int | None, chat_type: str | None) -> bool:
    if chat_type in ("group", "supergroup", "channel"):
        return True
    if telegram_chat_id is not None and telegram_chat_id < 0:
        return True
    return False


def enrich_task_out(task: Task, profile: TelegramProfile | None = None) -> TaskOut:
    out = TaskOut.model_validate(task)
    msg = task.source_message
    if msg and msg.chat:
        chat = msg.chat
        out.telegram_link = build_telegram_message_link(
            chat.telegram_chat_id,
            msg.telegram_message_id,
        )
        out.source_chat_title = chat.title
        out.source_chat_avatar_url = chat_avatar_url(chat)
        out.source_chat_type = chat.chat_type
        out.source_is_group = _is_group_chat(chat.telegram_chat_id, chat.chat_type)
        out.source_created_at = msg.created_at
    if msg:
        out.source_user_display_name = msg.user_display_name
        out.source_sender_avatar_url = sender_avatar_url(msg.user_id, profile)
        if profile and profile.display_name and not out.source_user_display_name:
            out.source_user_display_name = profile.display_name
    out.external_links = [ExternalLinkOut.model_validate(l) for l in task.external_links]
    out.attachments = collect_task_attachments(task)
    return out
