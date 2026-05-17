import logging

from fastapi import APIRouter, HTTPException, Request

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
)
from app.services import telegram_auth
from app.tenancy import ensure_tenant, set_current_tenant, set_session_tenant
from app.tenancy.context import reset_current_tenant
from app.utils.crypto import encryption_configured

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/telegram", tags=["telegram"])


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
async def qr_start():
    try:
        result = await telegram_auth.start_qr_login()
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("qr_start failed")
        raise HTTPException(500, "Не удалось начать вход по QR") from e
    return QrStartOut(**result)


@router.get("/auth/qr/status/{login_id}", response_model=QrStatusOut)
async def qr_status(login_id: str):
    result = await telegram_auth.get_qr_login_status(login_id)
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


@router.post("/auth/phone/verify", response_model=PhoneVerifyOut)
async def phone_verify(body: PhoneVerifyIn):
    try:
        result = await telegram_auth.verify_phone_code(
            body.login_id, body.code, body.password
        )
    except ValueError as e:
        raise _encryption_http_error(e) from e
    except Exception as e:
        logger.exception("phone_verify failed")
        raise HTTPException(500, "Ошибка проверки кода") from e
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
