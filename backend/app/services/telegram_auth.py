import asyncio
import json
import logging
import re
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import select
from telethon import TelegramClient
from telethon.errors import (
    AuthTokenExpiredError,
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    SessionPasswordNeededError,
)
from telethon.sessions import StringSession
from telethon.tl.types import User

from app.database import async_session_factory
from app.models.entities import TelegramConfig
from app.utils.crypto import decrypt_str, encrypt_str

logger = logging.getLogger(__name__)

CONFIG_ID = 1
MY_TELEGRAM_APPS_URL = "https://my.telegram.org/apps"
QR_LIFETIME_SEC = 25

_pending_qr: dict[str, dict[str, Any]] = {}
_pending_phone: dict[str, dict[str, Any]] = {}
_client: TelegramClient | None = None


@dataclass
class TelegramCredentials:
    api_id: int
    api_hash: str


@dataclass
class TelegramStatus:
    has_credentials: bool
    is_authorized: bool
    setup_complete: bool
    setup_step: str
    api_id: Optional[int]
    username: Optional[str]
    user_id: Optional[int]
    first_name: Optional[str]
    last_name: Optional[str]
    monitor_chat_id: Optional[int]
    app_title: Optional[str]
    qr_pending: bool
    phone_pending: bool


def _normalize_phone(phone: str) -> str:
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone and not phone.startswith("+"):
        phone = "+" + phone
    return phone


def _user_to_dict(me: User) -> dict:
    return {
        "id": me.id,
        "username": me.username,
        "first_name": me.first_name,
        "last_name": me.last_name,
        "phone": me.phone,
        "premium": getattr(me, "premium", False),
        "verified": getattr(me, "verified", False),
        "bot": me.bot,
        "lang_code": getattr(me, "lang_code", None),
    }


async def get_config_row() -> TelegramConfig | None:
    async with async_session_factory() as session:
        result = await session.execute(
            select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
        )
        return result.scalar_one_or_none()


async def get_credentials() -> TelegramCredentials | None:
    row = await get_config_row()
    if not row or not row.api_id_encrypted or not row.api_hash_encrypted:
        return None
    return TelegramCredentials(
        api_id=int(decrypt_str(row.api_id_encrypted)),
        api_hash=decrypt_str(row.api_hash_encrypted),
    )


async def save_credentials(
    api_id: int,
    api_hash: str,
    monitor_chat_id: Optional[int] = None,
    app_title: Optional[str] = None,
    app_short_name: Optional[str] = None,
) -> None:
    global _client
    _client = None
    _cancel_all_pending()

    app_meta = {
        "api_id": api_id,
        "source": MY_TELEGRAM_APPS_URL,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    if app_title:
        app_meta["app_title"] = app_title
    if app_short_name:
        app_meta["app_short_name"] = app_short_name

    async with async_session_factory() as session:
        result = await session.execute(
            select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
        )
        row = result.scalar_one_or_none()
        if not row:
            row = TelegramConfig(id=CONFIG_ID)
            session.add(row)

        row.api_id_encrypted = encrypt_str(str(api_id))
        row.api_hash_encrypted = encrypt_str(api_hash)
        row.app_metadata_encrypted = encrypt_str(json.dumps(app_meta, ensure_ascii=False))
        if app_title:
            row.app_title_encrypted = encrypt_str(app_title)
        if app_short_name:
            row.app_short_name_encrypted = encrypt_str(app_short_name)
        if monitor_chat_id is not None:
            row.monitor_chat_id = monitor_chat_id
        row.is_authorized = False
        row.session_encrypted = None
        row.user_profile_encrypted = None
        row.updated_at = datetime.now(timezone.utc)
        await session.commit()


def _persist_user_session(row: TelegramConfig, session_string: str, me: User) -> None:
    profile = _user_to_dict(me)
    row.session_encrypted = encrypt_str(session_string)
    row.user_profile_encrypted = encrypt_str(json.dumps(profile, ensure_ascii=False))
    row.is_authorized = True
    row.telegram_user_id = me.id
    row.telegram_username = me.username
    row.telegram_first_name = me.first_name
    row.telegram_last_name = me.last_name
    row.telegram_phone = me.phone
    row.updated_at = datetime.now(timezone.utc)


async def save_session_from_client(client: TelegramClient) -> None:
    global _client
    _client = None
    me = await client.get_me()
    if not isinstance(me, User):
        raise ValueError("Could not load Telegram user profile")
    session_string = client.session.save()

    async with async_session_factory() as session:
        result = await session.execute(
            select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
        )
        row = result.scalar_one_or_none()
        if not row:
            raise ValueError("Save API credentials first")
        _persist_user_session(row, session_string, me)
        await session.commit()


def _cancel_all_pending() -> None:
    for login_id in list(_pending_qr.keys()):
        _cleanup_qr(login_id)
    for login_id in list(_pending_phone.keys()):
        _cleanup_phone(login_id)


async def clear_session() -> None:
    """Logout from Telegram — keep api_id/api_hash in DB."""
    global _client
    _client = None
    _cancel_all_pending()

    async with async_session_factory() as session:
        result = await session.execute(
            select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
        )
        row = result.scalar_one_or_none()
        if row:
            row.session_encrypted = None
            row.user_profile_encrypted = None
            row.is_authorized = False
            row.telegram_user_id = None
            row.telegram_username = None
            row.telegram_first_name = None
            row.telegram_last_name = None
            row.telegram_phone = None
            row.updated_at = datetime.now(timezone.utc)
            await session.commit()


async def clear_all() -> None:
    """Remove credentials, session, and app metadata."""
    global _client
    _client = None
    _cancel_all_pending()

    async with async_session_factory() as session:
        result = await session.execute(
            select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
        )
        row = result.scalar_one_or_none()
        if row:
            row.api_id_encrypted = None
            row.api_hash_encrypted = None
            row.app_title_encrypted = None
            row.app_short_name_encrypted = None
            row.app_metadata_encrypted = None
            row.session_encrypted = None
            row.user_profile_encrypted = None
            row.is_authorized = False
            row.telegram_user_id = None
            row.telegram_username = None
            row.telegram_first_name = None
            row.telegram_last_name = None
            row.telegram_phone = None
            row.monitor_chat_id = None
            row.updated_at = datetime.now(timezone.utc)
            await session.commit()


def _setup_step(has_credentials: bool, is_authorized: bool) -> str:
    if not has_credentials:
        return "credentials"
    if not is_authorized:
        return "auth"
    return "complete"


async def get_status() -> TelegramStatus:
    row = await get_config_row()
    if not row:
        return TelegramStatus(
            has_credentials=False,
            is_authorized=False,
            setup_complete=False,
            setup_step="credentials",
            api_id=None,
            username=None,
            user_id=None,
            first_name=None,
            last_name=None,
            monitor_chat_id=None,
            app_title=None,
            qr_pending=False,
            phone_pending=False,
        )

    api_id = None
    app_title = None
    if row.api_id_encrypted:
        try:
            api_id = int(decrypt_str(row.api_id_encrypted))
        except ValueError:
            pass
    if row.app_title_encrypted:
        try:
            app_title = decrypt_str(row.app_title_encrypted)
        except ValueError:
            pass

    has_credentials = bool(row.api_id_encrypted and row.api_hash_encrypted)
    is_authorized = bool(row.is_authorized and row.session_encrypted)

    return TelegramStatus(
        has_credentials=has_credentials,
        is_authorized=is_authorized,
        setup_complete=has_credentials and is_authorized,
        setup_step=_setup_step(has_credentials, is_authorized),
        api_id=api_id,
        username=row.telegram_username,
        user_id=row.telegram_user_id,
        first_name=row.telegram_first_name,
        last_name=row.telegram_last_name,
        monitor_chat_id=row.monitor_chat_id,
        app_title=app_title,
        qr_pending=bool(_pending_qr),
        phone_pending=bool(_pending_phone),
    )


async def get_session_string() -> str | None:
    row = await get_config_row()
    if not row or not row.session_encrypted:
        return None
    return decrypt_str(row.session_encrypted)


async def get_client() -> TelegramClient:
    global _client
    creds = await get_credentials()
    if not creds:
        raise ValueError("Telegram API credentials not configured")

    session_str = await get_session_string()

    if _client is None:
        session = StringSession(session_str) if session_str else StringSession()
        _client = TelegramClient(session, creds.api_id, creds.api_hash)

    if not _client.is_connected():
        await _client.connect()

    return _client


async def _new_auth_client() -> TelegramClient:
    creds = await get_credentials()
    if not creds:
        raise ValueError("Save API credentials first")
    client = TelegramClient(StringSession(), creds.api_id, creds.api_hash)
    await client.connect()
    return client


def _cleanup_qr(login_id: str) -> None:
    entry = _pending_qr.pop(login_id, None)
    if not entry:
        return
    task = entry.get("task")
    if task and not task.done():
        task.cancel()
    client = entry.get("client")
    if client:

        async def _disconnect():
            try:
                await client.disconnect()
            except Exception:
                pass

        asyncio.create_task(_disconnect())


def _cleanup_phone(login_id: str) -> None:
    entry = _pending_phone.pop(login_id, None)
    if not entry:
        return
    client = entry.get("client")
    if client:

        async def _disconnect():
            try:
                await client.disconnect()
            except Exception:
                pass

        asyncio.create_task(_disconnect())


# --- QR login ---


async def start_qr_login() -> dict:
    _cancel_all_pending()
    login_id = str(uuid.uuid4())
    client = await _new_auth_client()

    if await client.is_user_authorized():
        me = await client.get_me()
        await save_session_from_client(client)
        await client.disconnect()
        return {
            "login_id": login_id,
            "url": None,
            "already_authorized": True,
            "username": me.username if me else None,
        }

    qr = await client.qr_login()
    _pending_qr[login_id] = {
        "client": client,
        "qr": qr,
        "config_id": CONFIG_ID,
        "error": None,
    }
    task = asyncio.create_task(_wait_qr_login(login_id))
    _pending_qr[login_id]["task"] = task

    return {
        "login_id": login_id,
        "url": qr.url,
        "already_authorized": False,
        "expires_in": QR_LIFETIME_SEC,
    }


async def refresh_qr_login(login_id: str) -> dict:
    entry = _pending_qr.get(login_id)
    if entry and entry.get("client"):
        try:
            qr = entry["qr"]
            new_qr = await qr.recreate()
            entry["qr"] = new_qr
            entry["error"] = None
            if entry.get("task") and entry["task"].done():
                entry["task"] = asyncio.create_task(_wait_qr_login(login_id))
            return {
                "login_id": login_id,
                "url": new_qr.url,
                "refreshed": True,
                "expires_in": QR_LIFETIME_SEC,
            }
        except (AuthTokenExpiredError, Exception) as e:
            logger.warning("QR recreate failed: %s", e)
            _cleanup_qr(login_id)

    return await start_qr_login()


async def _wait_qr_login(login_id: str) -> None:
    entry = _pending_qr.get(login_id)
    if not entry:
        return
    client: TelegramClient = entry["client"]
    qr = entry["qr"]
    try:
        await qr.wait(timeout=QR_LIFETIME_SEC + 5)
        if login_id not in _pending_qr:
            return
        await save_session_from_client(client)
        me = await client.get_me()
        logger.info("Telegram QR login success: %s", me.username)
        entry["error"] = None
    except AuthTokenExpiredError:
        logger.info("QR token expired for %s", login_id)
        entry["error"] = "token_expired"
    except asyncio.TimeoutError:
        logger.info("QR wait timeout for %s", login_id)
        entry["error"] = "token_expired"
    except asyncio.CancelledError:
        raise
    except Exception:
        logger.exception("QR login failed for %s", login_id)
        entry["error"] = "failed"
    finally:
        if entry.get("error") != "token_expired":
            _cleanup_qr(login_id)
        elif login_id in _pending_qr:
            pass


async def get_qr_login_status(login_id: str) -> dict:
    entry = _pending_qr.get(login_id)
    if entry:
        if entry.get("error") == "token_expired":
            return {
                "status": "token_expired",
                "login_id": login_id,
                "message": "QR-код истёк. Нажмите «Обновить QR» или войдите по телефону.",
            }
        return {"status": "pending", "login_id": login_id}

    status = await get_status()
    if status.is_authorized:
        return {
            "status": "authorized",
            "username": status.username,
            "user_id": status.user_id,
            "first_name": status.first_name,
            "last_name": status.last_name,
        }
    return {"status": "expired", "login_id": login_id}


# --- Phone login (как client.start() в Telethon) ---


async def send_phone_code(phone: str) -> dict:
    _cancel_all_pending()
    phone = _normalize_phone(phone)
    if not re.match(r"^\+\d{10,15}$", phone):
        raise ValueError("Номер в формате +79991234567")

    login_id = str(uuid.uuid4())
    client = await _new_auth_client()

    if await client.is_user_authorized():
        await save_session_from_client(client)
        await client.disconnect()
        st = await get_status()
        return {
            "login_id": login_id,
            "code_sent": False,
            "already_authorized": True,
            "username": st.username,
        }

    sent = await client.send_code_request(phone)
    _pending_phone[login_id] = {
        "client": client,
        "phone": phone,
        "phone_code_hash": sent.phone_code_hash,
    }

    return {
        "login_id": login_id,
        "code_sent": True,
        "phone_masked": phone[:4] + "***" + phone[-2:],
        "message": "Код отправлен в Telegram (чат «Telegram» или SMS)",
    }


async def verify_phone_code(
    login_id: str,
    code: str,
    password: Optional[str] = None,
) -> dict:
    entry = _pending_phone.get(login_id)
    if not entry:
        raise ValueError("Сессия входа истекла. Запросите код снова.")

    client: TelegramClient = entry["client"]
    phone = entry["phone"]
    phone_code_hash = entry["phone_code_hash"]
    code = code.strip().replace(" ", "")

    try:
        await client.sign_in(phone, code, phone_code_hash=phone_code_hash)
    except SessionPasswordNeededError:
        if not password:
            return {
                "status": "password_required",
                "login_id": login_id,
                "message": "Включена двухфакторная защита — введите пароль облачного пароля Telegram",
            }
        await client.sign_in(password=password)
    except PhoneCodeInvalidError:
        raise ValueError("Неверный код. Проверьте и введите снова.")
    except PhoneCodeExpiredError:
        _cleanup_phone(login_id)
        raise ValueError("Код истёк. Запросите новый код.")

    await save_session_from_client(client)
    _cleanup_phone(login_id)
    st = await get_status()
    return {
        "status": "authorized",
        "username": st.username,
        "user_id": st.user_id,
        "first_name": st.first_name,
        "last_name": st.last_name,
    }
