def build_telegram_message_link(telegram_chat_id: int, telegram_message_id: int) -> str:
    """Build t.me/c/ link for supergroup/channel messages."""
    # Supergroup ids: -100xxxxxxxxxx -> strip -100 prefix
    chat_part = str(telegram_chat_id)
    if chat_part.startswith("-100"):
        chat_part = chat_part[4:]
    elif chat_part.startswith("-"):
        chat_part = chat_part[1:]
    return f"https://t.me/c/{chat_part}/{telegram_message_id}"
