import hmac
import logging

from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse

from app.schemas.telegram import (
    PhoneSendIn,
    PhoneSendOut,
    PhoneVerifyIn,
    PhoneVerifyOut,
    QrStartOut,
    QrStatusOut,
    TelegramCredentialsIn,
    TelegramCredentialsOut,
    TelegramStatusOut,
    TelegramNotificationPreferencesIn,
)
from app.services import chat_sync, telegram_auth
from app.services.telegram_bot import cache_group_avatar, message_from_update, pairing_payload, send_message, tenant_from_pairing_payload
from app.services.source_registry import (
    list_sources,
    set_source,
    set_status_notifications_enabled,
    source_for,
    status_notifications_enabled,
    tenant_for_source,
)
from app.config import get_settings
from app.telegram.ingest import handle_new_message
from app.services.hosted_telegram import is_hosted_mode
from app.telegram.listener import wake_ingest
from app.tenancy import ensure_tenant, set_session_tenant
from app.tenancy.context import reset_current_tenant, set_current_tenant
from app.utils.crypto import encryption_configured

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["telegram"])


@router.get("/sources")
async def telegram_sources():
    """Public setup data; credentials intentionally stay server-side."""
    settings = get_settings()
    username = settings.telegram_bot_username.lstrip("@")
    return {
        "bot_configured": bool(settings.telegram_bot_token),
        "bot_username": username or None,
        "bot_add_url": f"https://t.me/{username}?startgroup=true" if username else None,
        "webhook_path": "/api/telegram/webhook",
        "modes": ["bot_groups", "telegram_business"],
    }


@router.get("/connect-links")
async def telegram_connect_links(request: Request):
    """Workspace-specific deep links. Their signed payload prevents chat hijacking."""
    from app.tenancy import require_session_tenant

    tenant = require_session_tenant(request)
    settings = get_settings()
    username = settings.telegram_bot_username.lstrip("@")
    if not username:
        raise HTTPException(503, "TELEGRAM_BOT_USERNAME is not configured")
    return {
        "group": f"https://t.me/{username}?startgroup={pairing_payload(tenant, 'group')}",
        "business": f"https://t.me/{username}?start={pairing_payload(tenant, 'business')}",
    }


@router.get("/preferences")
async def telegram_preferences(request: Request):
    from app.tenancy import require_session_tenant

    tenant = require_session_tenant(request)
    return {"status_notifications_enabled": status_notifications_enabled(tenant)}


@router.put("/preferences")
async def update_telegram_preferences(payload: TelegramNotificationPreferencesIn, request: Request):
    from app.tenancy import require_session_tenant

    tenant = require_session_tenant(request)
    enabled = set_status_notifications_enabled(tenant, payload.status_notifications_enabled)
    return {"status_notifications_enabled": enabled}


@router.get("/connections")
async def telegram_connections(request: Request):
    from app.tenancy import require_session_tenant

    tenant = require_session_tenant(request)
    groups = list_sources(tenant, "group")
    for group in groups:
        if group.get("avatar_path"):
            continue
        try:
            chat_id = int(str(group["source_id"]).removeprefix("chat:"))
        except ValueError:
            continue
        avatar_path = await cache_group_avatar(chat_id)
        if avatar_path:
            set_source("group", group["source_id"], tenant, avatar_path=avatar_path)
            group["avatar_path"] = avatar_path
    return {
        "groups": [
            {"source_id": group["source_id"], "title": group["title"], "has_avatar": bool(group.get("avatar_path"))}
            for group in groups
        ]
    }


@router.get("/connections/group-avatar")
async def telegram_group_avatar(source_id: str, request: Request):
    from app.tenancy import require_session_tenant

    tenant = require_session_tenant(request)
    group = source_for(tenant, "group", source_id)
    path = Path(group["avatar_path"]) if group and group.get("avatar_path") else None
    if path is None or not path.is_file():
        raise HTTPException(404, "Аватар группы пока недоступен")
    return FileResponse(path, media_type="image/jpeg", filename="telegram-group.jpg")


@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Receive updates from TaskExtraction Bot and Connected Business Bot."""
    settings = get_settings()
    if not settings.telegram_bot_token:
        raise HTTPException(503, "TELEGRAM_BOT_TOKEN is not configured")
    secret = settings.telegram_webhook_secret
    received = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if secret and not hmac.compare_digest(received, secret):
        raise HTTPException(403, "Invalid Telegram webhook secret")
    update = await request.json()
    if not isinstance(update, dict):
        raise HTTPException(400, "Invalid Telegram update")
    connection = update.get("business_connection")
    if isinstance(connection, dict):
        owner = (connection.get("user") or {}).get("id")
        connection_id = connection.get("id")
        tenant = tenant_for_source(f"business-user:{owner}") if owner else None
        if tenant and connection_id:
            set_source("business_connection", f"business:{connection_id}", tenant)
        return {"ok": True, "ignored": tenant is None}

    message = message_from_update(update)
    if message is None:
        return {"ok": True, "ignored": True}

    pairing = tenant_from_pairing_payload(message.text)
    if pairing:
        tenant, mode = pairing
        if mode == "group" and message.chat_type in {"group", "supergroup"}:
            avatar_path = await cache_group_avatar(message.chat_id)
            set_source("group", f"chat:{message.chat_id}", tenant, title=message.chat_title, avatar_path=avatar_path)
            await chat_sync.register_bot_group(tenant, message.chat_id, message.chat_title, avatar_path)
            await send_message(message.chat_id, "✅ Группа подключена к TaskExtraction. Новые сообщения будут анализироваться автоматически.")
        elif mode == "business" and message.chat_type == "private" and message.sender_id:
            set_source("business_user", f"business-user:{message.sender_id}", tenant)
            await send_message(message.chat_id, "✅ Telegram Business готов к подключению. Вернитесь в TaskExtraction и настройте Business Connection.")
        return {"ok": True, "paired": True}

    connection_id = message.raw.get("business_connection_id")
    source_key = f"business:{connection_id}" if connection_id else f"chat:{message.chat_id}"
    tenant = tenant_for_source(source_key)
    if not tenant:
        return {"ok": True, "ignored": True}
    if not connection_id:
        avatar_path = await cache_group_avatar(message.chat_id)
        set_source("group", source_key, tenant, title=message.chat_title, avatar_path=avatar_path)
        await chat_sync.register_bot_group(tenant, message.chat_id, message.chat_title, avatar_path)
    ensure_tenant(tenant)
    token = set_current_tenant(tenant)
    try:
        await handle_new_message(message)
    finally:
        reset_current_tenant(token)
    return {"ok": True}


def _bind_tenant_session(request: Request, user_id: int | None) -> None:
    if user_id is None:
        return
    tenant_key = str(user_id)
    ensure_tenant(tenant_key)
    set_session_tenant(request, tenant_key)


def _encryption_http_error(exc: ValueError) -> HTTPException:
    msg = str(exc)
    if "ENCRYPTION_KEY" in msg or "Fernet" in msg or "расшифровать" in msg:
        return HTTPException(
            status_code=503,
            detail=msg,
        )
    return HTTPException(status_code=400, detail=msg)


def _mask_hash(api_hash: str) -> str:
    if len(api_hash) <= 8:
        return "****"
    return api_hash[:4] + "****" + api_hash[-4:]


@router.get("/status", response_model=TelegramStatusOut)
async def telegram_status():
    s = await telegram_auth.get_status()
    return TelegramStatusOut(
        has_credentials=s.has_credentials,
        is_authorized=s.is_authorized,
        setup_complete=s.setup_complete,
        setup_step=s.setup_step,
        hosted_app=is_hosted_mode(),
        api_id=s.api_id,
        username=s.username,
        user_id=s.user_id,
        first_name=s.first_name,
        last_name=s.last_name,
        monitor_chat_id=s.monitor_chat_id,
        app_title=s.app_title,
        qr_pending=s.qr_pending,
    )


@router.get("/setup-required")
async def setup_required():
    s = await telegram_auth.get_status()
    return {
        "required": not s.setup_complete,
        "step": s.setup_step,
        "hosted_app": is_hosted_mode(),
        "my_telegram_apps_url": telegram_auth.MY_TELEGRAM_APPS_URL,
        "encryption_configured": encryption_configured(),
    }


@router.post("/credentials", response_model=TelegramCredentialsOut)
async def save_credentials(body: TelegramCredentialsIn, request: Request):
    tenant_key = str(body.api_id)
    ensure_tenant(tenant_key)
    set_session_tenant(request, tenant_key)
    token = set_current_tenant(tenant_key)
    try:
        await telegram_auth.save_credentials(
            api_id=body.api_id,
            api_hash=body.api_hash.strip(),
            monitor_chat_id=body.monitor_chat_id,
            app_title=body.app_title,
            app_short_name=body.app_short_name,
        )
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("save_credentials failed")
        raise HTTPException(500, "Ошибка сохранения ключей Telegram") from e
    finally:
        if token is not None:
            reset_current_tenant(token)
    return TelegramCredentialsOut(
        api_id=body.api_id,
        api_hash_masked=_mask_hash(body.api_hash),
        monitor_chat_id=body.monitor_chat_id,
        app_title=body.app_title,
    )


@router.get("/credentials", response_model=TelegramCredentialsOut | None)
async def get_credentials_masked():
    creds = await telegram_auth.get_credentials()
    if not creds:
        return None
    row = await telegram_auth.get_config_row()
    app_title = None
    if row and row.app_title_encrypted:
        try:
            from app.utils.crypto import decrypt_str

            app_title = decrypt_str(row.app_title_encrypted)
        except ValueError:
            pass
    return TelegramCredentialsOut(
        api_id=creds.api_id,
        api_hash_masked=_mask_hash(creds.api_hash),
        monitor_chat_id=row.monitor_chat_id if row else None,
        app_title=app_title,
    )


@router.post("/auth/qr/start", response_model=QrStartOut)
async def qr_start(request: Request):
    try:
        result = await telegram_auth.start_qr_login()
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("qr_start failed")
        raise HTTPException(500, "Не удалось начать вход по QR") from e
    _bind_tenant_session(request, result.get("user_id"))
    return QrStartOut(**result)


@router.get("/auth/qr/status/{login_id}", response_model=QrStatusOut)
async def qr_status(login_id: str, request: Request):
    result = await telegram_auth.get_qr_login_status(login_id)
    if result.get("status") == "authorized":
        _bind_tenant_session(request, result.get("user_id"))
        wake_ingest()
    return QrStatusOut(**result)


@router.post("/auth/qr/refresh/{login_id}", response_model=QrStartOut)
async def qr_refresh(login_id: str):
    try:
        result = await telegram_auth.refresh_qr_login(login_id)
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("qr_refresh failed")
        raise HTTPException(500, "Не удалось обновить QR") from e
    return QrStartOut(**result)


@router.post("/auth/phone/send", response_model=PhoneSendOut)
async def phone_send(body: PhoneSendIn):
    try:
        result = await telegram_auth.send_phone_code(body.phone)
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("phone_send failed")
        raise HTTPException(500, "Не удалось отправить код") from e
    return PhoneSendOut(**result)


@router.post("/auth/phone/resend/{login_id}", response_model=PhoneSendOut)
async def phone_resend(login_id: str):
    try:
        result = await telegram_auth.resend_phone_code(login_id)
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("phone_resend failed")
        raise HTTPException(500, "Не удалось отправить код повторно") from e
    return PhoneSendOut(**result)


@router.post("/auth/phone/verify", response_model=PhoneVerifyOut)
async def phone_verify(body: PhoneVerifyIn, request: Request):
    try:
        result = await telegram_auth.verify_phone_code(
            body.login_id, body.code, body.password
        )
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("phone_verify failed")
        raise HTTPException(500, "Ошибка проверки кода") from e
    if result.get("status") == "authorized":
        _bind_tenant_session(request, result.get("user_id"))
        wake_ingest()
    return PhoneVerifyOut(**result)


@router.post("/auth/logout")
async def logout():
    """Logout Telegram account; API keys stay in DB."""
    await telegram_auth.clear_session()
    return {"ok": True, "message": "Сессия Telegram удалена. Ключи приложения сохранены."}


@router.post("/reset")
async def reset_all(request: Request):
    """Delete API keys and session for current tenant."""
    from app.tenancy import clear_session_tenant

    await telegram_auth.clear_all()
    clear_session_tenant(request)
    return {"ok": True, "message": "Все данные Telegram удалены из БД."}
