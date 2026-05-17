"""Нормализация ID чатов Telegram (dialog sync vs NewMessage events)."""

from telethon import utils as tg_utils


def normalize_telegram_chat_id(chat_id: int | None) -> int:
    if chat_id is None:
        return 0
    try:
        return int(tg_utils.get_peer_id(chat_id))
    except Exception:
        return int(chat_id)


def chat_id_matches(chat_id: int, monitored: set[int]) -> bool:
    """Совпадение с учётом разных представлений ID (-100… vs channel id)."""
    cid = normalize_telegram_chat_id(chat_id)
    if cid in monitored:
        return True
    # Супергруппа: иногда в БД -100xxx, в event — тот же id после get_peer_id
    if str(cid).startswith("-100"):
        alt = int(str(cid).replace("-100", "-", 1))
        if alt in monitored:
            return True
    for mid in monitored:
        if normalize_telegram_chat_id(mid) == cid:
            return True
    return False
