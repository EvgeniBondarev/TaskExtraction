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
    FloodWaitError,
    PhoneCodeExpiredError,
    PhoneCodeInvalidError,
    PhoneNumberBannedError,
    PhoneNumberFloodError,
    PhoneNumberInvalidError,
    SendCodeUnavailableError,
    SessionPasswordNeededError,
)
from telethon.sessions import StringSession
from telethon.tl.types import User

from app.services.hosted_telegram import (
    credentials_configured,
    ensure_hosted_credentials_for_tenant,
    is_hosted_mode,
    resolve_app_credentials,
    shared_credentials,
)
from app.tenancy.context import (
    get_current_tenant,
    require_current_tenant,
    reset_current_tenant,
    set_current_tenant,
)
from app.tenancy.registry import ensure_tenant, tenant_session
from app.models.entities import TelegramConfig
from app.utils.crypto import decrypt_str, encrypt_str

logger = logging.getLogger(__name__)

CONFIG_ID = 1
MY_TELEGRAM_APPS_URL = "https://my.telegram.org/apps"
QR_LIFETIME_SEC = 25

_pending_qr: dict[str, dict[str, Any]] = {}
_pending_phone: dict[str, dict[str, Any]] = {}
_clients: dict[str, TelegramClient] = {}
_completed_logins: dict[str, dict[str, Any]] = {}


def _tenant_key() -> str:
    return require_current_tenant()


def _auth_scope() -> str:
    return get_current_tenant() or "hosted"


def _qr_key(login_id: str) -> str:
    return f"{_auth_scope()}:{login_id}"


def _phone_key(login_id: str) -> str:
    return f"{_auth_scope()}:{login_id}"


def pop_completed_login(login_id: str) -> dict[str, Any] | None:
    return _completed_logins.pop(login_id, None)


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
    phone = phone.strip()
    for ch in (" ", "-", "(", ")", "\u00a0"):
        phone = phone.replace(ch, "")
    digits = re.sub(r"\D", "", phone.lstrip("+"))
    if not digits:
        return ""
    # Локальный российский формат 8XXXXXXXXXX
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    return "+" + digits[:15]


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
    async with tenant_session() as session:
        result = await session.execute(
            select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
        )
        return result.scalar_one_or_none()


async def get_credentials() -> TelegramCredentials | None:
    row = await get_config_row() if get_current_tenant() else None
    creds = resolve_app_credentials(row)
    if not creds:
        return None
    return TelegramCredentials(api_id=creds.api_id, api_hash=creds.api_hash)


async def save_credentials(
    api_id: int,
    api_hash: str,
    monitor_chat_id: Optional[int] = None,
    app_title: Optional[str] = None,
    app_short_name: Optional[str] = None,
) -> None:
    _drop_client()
    await _cancel_all_pending()

    app_meta = {
        "api_id": api_id,
        "source": MY_TELEGRAM_APPS_URL,
        "saved_at": datetime.now(timezone.utc).isoformat(),
    }
    if app_title:
        app_meta["app_title"] = app_title
    if app_short_name:
        app_meta["app_short_name"] = app_short_name

    async with tenant_session() as session:
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


async def save_session_from_client(client: TelegramClient) -> int:
    from app.telegram.listener import on_telegram_client_reset, wake_ingest

    _drop_client()
    on_telegram_client_reset()
    me = await client.get_me()
    if not isinstance(me, User):
        raise ValueError("Could not load Telegram user profile")
    session_string = client.session.save()

    tenant_key = str(me.id)
    ensure_tenant(tenant_key)
    await ensure_hosted_credentials_for_tenant(tenant_key)

    token = set_current_tenant(tenant_key)
    try:
        async with tenant_session(tenant_key) as session:
            result = await session.execute(
                select(TelegramConfig).where(TelegramConfig.id == CONFIG_ID)
            )
            row = result.scalar_one_or_none()
            if not row:
                row = TelegramConfig(id=CONFIG_ID)
                session.add(row)
            if not credentials_configured(row):
                raise ValueError("Telegram API credentials not configured")
            _persist_user_session(row, session_string, me)
            await session.commit()
    finally:
        reset_current_tenant(token)

    wake_ingest()
    return me.id


async def _disconnect_auth_client(client: TelegramClient | None) -> None:
    if not client:
        return
    try:
        await client.disconnect()
    except Exception:
        pass


async def _cancel_all_pending() -> None:
    prefix = f"{_auth_scope()}:"
    disconnects: list[Any] = []
    for key in list(_pending_qr.keys()):
        if key.startswith(prefix):
            login_id = key.split(":", 1)[-1]
            entry = _pending_qr.pop(key, None)
            if not entry:
                continue
            task = entry.get("task")
            if task and not task.done():
                task.cancel()
            disconnects.append(_disconnect_auth_client(entry.get("client")))
    for key in list(_pending_phone.keys()):
        if key.startswith(prefix):
            login_id = key.split(":", 1)[-1]
            entry = _pending_phone.pop(key, None)
            if not entry:
                continue
            disconnects.append(_disconnect_auth_client(entry.get("client")))
    if disconnects:
        await asyncio.gather(*disconnects, return_exceptions=True)


def _drop_client() -> None:
    from app.telegram.listener import on_telegram_client_reset

    tenant = get_current_tenant()
    if tenant and tenant in _clients:
        del _clients[tenant]
    on_telegram_client_reset()


async def clear_session() -> None:
    """Logout from Telegram — keep api_id/api_hash in DB."""
    _drop_client()
    await _cancel_all_pending()

    async with tenant_session() as session:
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
    _drop_client()
    await _cancel_all_pending()

    async with tenant_session() as session:
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
    if not get_current_tenant():
        if is_hosted_mode():
            shared = shared_credentials()
            return TelegramStatus(
                has_credentials=True,
                is_authorized=False,
                setup_complete=False,
                setup_step="auth",
                api_id=shared.api_id if shared else None,
                username=None,
                user_id=None,
                first_name=None,
                last_name=None,
                monitor_chat_id=None,
                app_title=None,
                qr_pending=False,
                phone_pending=False,
            )
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

    has_credentials = credentials_configured(row)
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
        qr_pending=any(k.startswith(f"{_tenant_key()}:") for k in _pending_qr),
        phone_pending=any(k.startswith(f"{_tenant_key()}:") for k in _pending_phone),
    )


async def get_session_string() -> str | None:
    row = await get_config_row()
    if not row or not row.session_encrypted:
        return None
    return decrypt_str(row.session_encrypted)


async def get_client() -> TelegramClient:
    tenant = _tenant_key()
    creds = await get_credentials()
    if not creds:
        raise ValueError("Telegram API credentials not configured")

    session_str = await get_session_string()

    client = _clients.get(tenant)
    if client is None:
        session = StringSession(session_str) if session_str else StringSession()
        client = TelegramClient(session, creds.api_id, creds.api_hash)
        _clients[tenant] = client

    if not client.is_connected():
        await client.connect()

    return client


async def _new_auth_client() -> TelegramClient:
    creds = await get_credentials()
    if not creds:
        shared = shared_credentials()
        if not shared:
            raise ValueError("Telegram API credentials not configured")
        creds = TelegramCredentials(api_id=shared.api_id, api_hash=shared.api_hash)
    client = TelegramClient(StringSession(), creds.api_id, creds.api_hash)
    await client.connect()
    return client


def _cleanup_qr(login_id: str) -> None:
    entry = _pending_qr.pop(_qr_key(login_id), None)
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
    entry = _pending_phone.pop(_phone_key(login_id), None)
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
    await _cancel_all_pending()
    login_id = str(uuid.uuid4())
    client = await _new_auth_client()

    if await client.is_user_authorized():
        me = await client.get_me()
        user_id = await save_session_from_client(client)
        await client.disconnect()
        if isinstance(me, User):
            _completed_logins[login_id] = {
                "user_id": user_id,
                "username": me.username,
                "first_name": me.first_name,
                "last_name": me.last_name,
            }
        return {
            "login_id": login_id,
            "url": None,
            "already_authorized": True,
            "username": me.username if me else None,
            "user_id": user_id,
        }

    qr = await client.qr_login()
    qr_storage_key = _qr_key(login_id)
    _pending_qr[qr_storage_key] = {
        "client": client,
        "qr": qr,
        "config_id": CONFIG_ID,
        "error": None,
    }
    task = asyncio.create_task(_wait_qr_login(login_id))
    _pending_qr[qr_storage_key]["task"] = task

    return {
        "login_id": login_id,
        "url": qr.url,
        "already_authorized": False,
        "expires_in": QR_LIFETIME_SEC,
    }


async def refresh_qr_login(login_id: str) -> dict:
    entry = _pending_qr.get(_qr_key(login_id))
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
    entry = _pending_qr.get(_qr_key(login_id))
    if not entry:
        return
    client: TelegramClient = entry["client"]
    qr = entry["qr"]
    try:
        await qr.wait(timeout=QR_LIFETIME_SEC + 5)
        if _qr_key(login_id) not in _pending_qr:
            return
        user_id = await save_session_from_client(client)
        me = await client.get_me()
        logger.info("Telegram QR login success: %s", me.username if me else user_id)
        if isinstance(me, User):
            _completed_logins[login_id] = {
                "user_id": user_id,
                "username": me.username,
                "first_name": me.first_name,
                "last_name": me.last_name,
            }
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
        elif _qr_key(login_id) in _pending_qr:
            pass


async def get_qr_login_status(login_id: str) -> dict:
    completed = pop_completed_login(login_id)
    if completed:
        return {"status": "authorized", "login_id": login_id, **completed}

    entry = _pending_qr.get(_qr_key(login_id))
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


def _sent_code_delivery(sent: Any) -> tuple[str, str]:
    """Куда Telegram реально отправил код (SMS почти не используется с 2023+)."""
    type_name = type(sent.type).__name__
    if "Sms" in type_name:
        return (
            "sms",
            "Код придёт в SMS на этот номер. Если не пришёл — подождите минуту и нажмите «Отправить снова».",
        )
    if "Call" in type_name or "Flash" in type_name:
        return (
            "call",
            "Сейчас поступит звонок — введите последние цифры номера звонящего.",
        )
    if "Email" in type_name:
        return (
            "email",
            "Код отправлен на привязанную почту Telegram.",
        )
    return (
        "app",
        "Код приходит только в приложение Telegram (не SMS). "
        "На телефоне с этим номером откройте Telegram → чат «Telegram» вверху списка. "
        "Если чата нет — обновите Telegram и войдите в аккаунт с этим номером.",
    )


async def _request_phone_code(client: TelegramClient, phone: str) -> Any:
    try:
        return await client.send_code_request(phone)
    except PhoneNumberInvalidError as e:
        raise ValueError("Неверный номер телефона. Проверьте код страны и количество цифр.") from e
    except PhoneNumberBannedError as e:
        raise ValueError("Этот номер заблокирован в Telegram.") from e
    except PhoneNumberFloodError as e:
        raise ValueError("Слишком много запросов для этого номера. Подождите несколько часов.") from e
    except FloodWaitError as e:
        raise ValueError(f"Слишком много попыток. Подождите {e.seconds} сек.") from e
    except SendCodeUnavailableError as e:
        raise ValueError(
            "Telegram сейчас не может отправить код на этот номер. "
            "Попробуйте вход по QR-коду или позже."
        ) from e


async def send_phone_code(phone: str) -> dict:
    await _cancel_all_pending()
    phone = _normalize_phone(phone)
    if not re.match(r"^\+\d{10,15}$", phone):
        raise ValueError("Номер в формате +79991234567")

    login_id = str(uuid.uuid4())
    client = await _new_auth_client()

    if await client.is_user_authorized():
        user_id = await save_session_from_client(client)
        await client.disconnect()
        st = await get_status()
        _completed_logins[login_id] = {
            "user_id": user_id,
            "username": st.username,
            "first_name": st.first_name,
            "last_name": st.last_name,
        }
        return {
            "login_id": login_id,
            "code_sent": False,
            "already_authorized": True,
            "username": st.username,
            "user_id": user_id,
        }

    try:
        sent = await _request_phone_code(client, phone)
    except ValueError:
        await _disconnect_auth_client(client)
        raise

    delivery, delivery_hint = _sent_code_delivery(sent)
    logger.info("Telegram login code for %s → delivery=%s", phone[:4] + "***", delivery)

    _pending_phone[_phone_key(login_id)] = {
        "client": client,
        "phone": phone,
        "phone_code_hash": sent.phone_code_hash,
    }

    return {
        "login_id": login_id,
        "code_sent": True,
        "phone_masked": phone[:4] + "***" + phone[-2:],
        "code_delivery": delivery,
        "delivery_hint": delivery_hint,
        "message": delivery_hint,
    }


async def resend_phone_code(login_id: str) -> dict:
    entry = _pending_phone.get(_phone_key(login_id))
    if not entry or not entry.get("client"):
        raise ValueError("Сессия входа истекла. Запросите код снова с начала.")

    client: TelegramClient = entry["client"]
    phone = entry["phone"]
    if not client.is_connected():
        await client.connect()

    try:
        sent = await _request_phone_code(client, phone)
    except ValueError:
        raise

    entry["phone_code_hash"] = sent.phone_code_hash
    delivery, delivery_hint = _sent_code_delivery(sent)
    logger.info("Telegram login code resent for %s → delivery=%s", phone[:4] + "***", delivery)

    return {
        "login_id": login_id,
        "code_sent": True,
        "phone_masked": phone[:4] + "***" + phone[-2:],
        "code_delivery": delivery,
        "delivery_hint": delivery_hint,
        "message": delivery_hint,
    }


async def verify_phone_code(
    login_id: str,
    code: str,
    password: Optional[str] = None,
) -> dict:
    entry = _pending_phone.get(_phone_key(login_id))
    if not entry:
        raise ValueError("Сессия входа истекла. Запросите код снова.")

    client: TelegramClient = entry["client"]
    phone = entry["phone"]
    phone_code_hash = entry["phone_code_hash"]
    code = code.strip().replace(" ", "")

    if not client.is_connected():
        await client.connect()

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

    user_id = await save_session_from_client(client)
    _cleanup_phone(login_id)
    me = await client.get_me()
    _completed_logins[login_id] = {
        "user_id": user_id,
        "username": me.username if isinstance(me, User) else None,
        "first_name": me.first_name if isinstance(me, User) else None,
        "last_name": me.last_name if isinstance(me, User) else None,
    }
    return {
        "status": "authorized",
        "username": _completed_logins[login_id].get("username"),
        "user_id": user_id,
        "first_name": _completed_logins[login_id].get("first_name"),
        "last_name": _completed_logins[login_id].get("last_name"),
    }
