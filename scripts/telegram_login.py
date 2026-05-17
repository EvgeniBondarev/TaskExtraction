#!/usr/bin/env python3
"""One-time Telegram authorization. Saves session to TELEGRAM_SESSION_PATH."""

import asyncio
import os
import sys

# Allow running from repo root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from telethon import TelegramClient

from app.config import get_settings


async def main():
    settings = get_settings()
    if not settings.telegram_api_id or not settings.telegram_api_hash:
        print("Set TELEGRAM_API_ID and TELEGRAM_API_HASH in .env")
        sys.exit(1)

    session_path = settings.telegram_session_path
    os.makedirs(os.path.dirname(session_path) or ".", exist_ok=True)

    client = TelegramClient(session_path, settings.telegram_api_id, settings.telegram_api_hash)
    await client.connect()

    if not await client.is_user_authorized():
        qr = await client.qr_login()
        print("Отсканируйте QR в Telegram → Настройки → Устройства → Подключить:")
        print(qr.url)
        await qr.wait(300)
        print("Авторизация успешна.")

    me = await client.get_me()
    print(f"Logged in as: {me.username or me.id}")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
