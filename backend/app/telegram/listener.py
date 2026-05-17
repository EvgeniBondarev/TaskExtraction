"""Фоновый listener Telegram: состояние и пробуждение цикла ingest."""

import asyncio
import logging

from telethon import events

from app.services import telegram_auth
from app.telegram.ingest import get_monitored_chat_ids, handle_new_message
from app.utils.telegram_ids import chat_id_matches, normalize_telegram_chat_id

logger = logging.getLogger(__name__)

_wakeup = asyncio.Event()
_handler_registered = False
_registered_client = None
_monitored_ids: set[int] = set()
_running = False
_last_error: str | None = None


def wake_ingest() -> None:
    """Пробудить цикл ingest (после сохранения ключей / чатов)."""
    _wakeup.set()


def on_telegram_client_reset() -> None:
    """Сбросить handler при пересоздании Telethon-клиента."""
    global _handler_registered, _registered_client
    _handler_registered = False
    _registered_client = None
    wake_ingest()


def get_ingest_status() -> dict:
    return {
        "running": _running,
        "handler_registered": _handler_registered,
        "monitored_chat_ids": sorted(_monitored_ids),
        "last_error": _last_error,
    }


async def _refresh_monitored() -> set[int]:
    global _monitored_ids
    ids = await get_monitored_chat_ids()
    _monitored_ids = {normalize_telegram_chat_id(i) for i in ids}
    return _monitored_ids


async def run_ingest_loop() -> None:
    """Слушает новые сообщения; перезапускается при настройке Telegram."""
    global _handler_registered, _registered_client, _running, _last_error

    while True:
        try:
            status = await telegram_auth.get_status()
            if not status.has_credentials:
                _running = False
                _last_error = "telegram_credentials_missing"
                logger.warning("Ingest waiting: Telegram API keys not configured")
                await _wait_wakeup(15)
                continue

            if not status.is_authorized:
                _running = False
                _last_error = "telegram_not_authorized"
                logger.warning("Ingest waiting: Telegram login required")
                await _wait_wakeup(15)
                continue

            client = await telegram_auth.get_client()
            if not await client.is_user_authorized():
                _running = False
                _last_error = "telegram_session_invalid"
                logger.error("Ingest waiting: invalid Telegram session — re-login")
                await _wait_wakeup(15)
                continue

            monitored = await _refresh_monitored()
            if not monitored:
                _running = False
                _last_error = "no_monitored_chats"
                logger.warning("Ingest waiting: no monitored chats selected")
                await _wait_wakeup(15)
                continue

            if _handler_registered and _registered_client is not client:
                _handler_registered = False

            if not _handler_registered:

                @client.on(events.NewMessage())
                async def _on_message(event):
                    chat_id = normalize_telegram_chat_id(event.chat_id)
                    if _monitored_ids and not chat_id_matches(chat_id, _monitored_ids):
                        logger.debug("Skip message from unmonitored chat %s", chat_id)
                        return
                    try:
                        await handle_new_message(event.message)
                    except Exception:
                        logger.exception("Failed to ingest message from chat %s", chat_id)

                _handler_registered = True
                _registered_client = client
                logger.info(
                    "Telegram ingest active — monitoring %s chat(s): %s",
                    len(monitored),
                    list(monitored),
                )

            _running = True
            _last_error = None

            if not client.is_connected():
                await client.connect()

            await _wait_wakeup(30)
            await _refresh_monitored()

        except asyncio.CancelledError:
            _running = False
            logger.info("Telegram ingest loop stopped")
            raise
        except Exception as exc:
            _running = False
            _last_error = str(exc)[:200]
            logger.exception("Ingest loop error, retry in 15s")
            await _wait_wakeup(15)


async def _wait_wakeup(timeout: float) -> None:
    try:
        await asyncio.wait_for(_wakeup.wait(), timeout=timeout)
    except asyncio.TimeoutError:
        pass
    _wakeup.clear()
