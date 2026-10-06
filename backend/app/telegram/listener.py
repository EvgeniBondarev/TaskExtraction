"""Фоновый listener Telegram: состояние и пробуждение цикла ingest (multi-tenant)."""

import asyncio
import logging

import httpx

from telethon import events

from app.services import telegram_auth
from app.telegram.ingest import get_monitored_chat_ids, handle_new_message
from app.tenancy import list_tenant_keys, reset_current_tenant, set_current_tenant
from app.utils.telegram_ids import chat_id_matches, normalize_telegram_chat_id

logger = logging.getLogger(__name__)

_wakeup = asyncio.Event()
_handler_registered: dict[str, bool] = {}
_registered_clients: dict[str, object] = {}
_monitored_ids: dict[str, set[int]] = {}
_running = False
_last_error: str | None = None


def wake_ingest() -> None:
    """Пробудить цикл ingest (после сохранения ключей / чатов)."""
    _wakeup.set()


def on_telegram_client_reset() -> None:
    """Сбросить handlers при пересоздании Telethon-клиента."""
    global _handler_registered, _registered_clients
    _handler_registered.clear()
    _registered_clients.clear()
    wake_ingest()


def get_ingest_status() -> dict:
    import os

    disabled = os.environ.get("TE_DISABLE_INGEST") == "1"
    return {
        "enabled": not disabled,
        "running": _running and not disabled,
        "tenants": list_tenant_keys(),
        "handler_registered": dict(_handler_registered),
        "monitored_chat_ids": {k: sorted(v) for k, v in _monitored_ids.items()},
        "last_error": _last_error,
        "disabled": disabled,
    }


async def _refresh_monitored(tenant_key: str) -> set[int]:
    ids = await get_monitored_chat_ids()
    normalized = {normalize_telegram_chat_id(i) for i in ids}
    _monitored_ids[tenant_key] = normalized
    return normalized


async def _ingest_tenant_once(tenant_key: str) -> None:
    global _handler_registered, _registered_clients, _running, _last_error

    token = set_current_tenant(tenant_key)
    try:
        status = await telegram_auth.get_status()
        if not status.has_credentials:
            _last_error = f"{tenant_key}:telegram_credentials_missing"
            return

        if not status.is_authorized:
            _last_error = f"{tenant_key}:telegram_not_authorized"
            return

        client = await telegram_auth.get_client()
        if not await client.is_user_authorized():
            _last_error = f"{tenant_key}:telegram_session_invalid"
            return

        monitored = await _refresh_monitored(tenant_key)
        if not monitored:
            _last_error = f"{tenant_key}:no_monitored_chats"
            return

        prev_client = _registered_clients.get(tenant_key)
        if _handler_registered.get(tenant_key) and prev_client is not client:
            _handler_registered[tenant_key] = False
            logger.info("Re-registering Telegram handler for tenant=%s (client changed)", tenant_key)

        if not _handler_registered.get(tenant_key):

            @client.on(events.NewMessage())
            async def _on_message(event, _tenant=tenant_key, _monitored=monitored):
                chat_id = normalize_telegram_chat_id(event.chat_id)
                current = _monitored_ids.get(_tenant, _monitored)
                if current and not chat_id_matches(chat_id, current):
                    return
                t = set_current_tenant(_tenant)
                try:
                    await handle_new_message(event.message)
                except Exception:
                    logger.exception("Failed to ingest message tenant=%s chat=%s", _tenant, chat_id)
                finally:
                    reset_current_tenant(t)

            _handler_registered[tenant_key] = True
            _registered_clients[tenant_key] = client
            logger.info(
                "Telegram ingest active tenant=%s — %s chat(s): %s",
                tenant_key,
                len(monitored),
                list(monitored),
            )

        _running = True
        _last_error = None

        if not client.is_connected():
            await client.connect()

        # Держим соединение и подтягиваем апдейты (иначе NewMessage не приходят)
        try:
            await client.catch_up()
        except Exception:
            pass
    finally:
        reset_current_tenant(token)


async def run_ingest_loop() -> None:
    """Слушает новые сообщения для всех tenant с настроенным Telegram."""
    global _running, _last_error

    while True:
        try:
            tenants = list_tenant_keys()
            if not tenants:
                _running = False
                _last_error = "no_tenants"
                await _wait_wakeup(15)
                continue

            for tenant_key in tenants:
                try:
                    await _ingest_tenant_once(tenant_key)
                except Exception as exc:
                    _last_error = f"{tenant_key}:{exc}"[:200]
                    logger.exception("Ingest error tenant=%s", tenant_key)

            await _wait_wakeup(30)

        except asyncio.CancelledError:
            _running = False
            logger.info("Telegram ingest loop stopped")
            raise
        except Exception as exc:
            _running = False
            _last_error = str(exc)[:200]
            logger.exception("Ingest loop error, retry in 15s")
            await _wait_wakeup(15)


async def run_bot_polling_loop() -> None:
    """Local development fallback when Telegram cannot reach localhost by webhook."""
    from app.config import get_settings

    settings = get_settings()
    token = settings.telegram_bot_token
    if not token:
        return
    offset: int | None = None
    api_url = f"https://api.telegram.org/bot{token}/getUpdates"
    headers = {"X-Telegram-Bot-Api-Secret-Token": settings.telegram_webhook_secret}
    logger.info("Telegram Bot API long polling enabled for local development")
    async with httpx.AsyncClient(timeout=35) as client:
        while True:
            try:
                params: dict = {
                    "timeout": 25,
                    "allowed_updates": ["message", "business_message", "business_connection", "my_chat_member"],
                }
                if offset is not None:
                    params["offset"] = offset
                response = await client.get(api_url, params=params)
                response.raise_for_status()
                for update in response.json().get("result", []):
                    update_id = update.get("update_id")
                    if isinstance(update_id, int):
                        offset = update_id + 1
                    await client.post(
                        "http://127.0.0.1:8000/api/telegram/webhook",
                        json=update,
                        headers=headers,
                    )
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.warning("Telegram Bot polling failed: %s", exc)
                await asyncio.sleep(3)


async def _wait_wakeup(timeout: float) -> None:
    try:
        await asyncio.wait_for(_wakeup.wait(), timeout=timeout)
    except asyncio.TimeoutError:
        pass
    _wakeup.clear()
