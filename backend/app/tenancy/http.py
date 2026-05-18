"""HTTP-сессия панели: привязка браузера к tenant (Telegram api_id)."""

from __future__ import annotations

import hashlib
import os

from fastapi import HTTPException, Request

SESSION_TENANT_KEY = "tenant_api_id"

_PUBLIC_PREFIXES = (
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
)

_PUBLIC_EXACT = (
    "/api/telegram/status",
    "/api/telegram/setup-required",
)

_PUBLIC_PREFIXES_EXTRA = (
    "/api/analytics/",
    "/api/admin/",
)


def session_secret() -> str:
    raw = os.environ.get("SESSION_SECRET") or os.environ.get("ENCRYPTION_KEY") or ""
    if raw:
        return hashlib.sha256(raw.encode()).hexdigest()
    return "taskextraction-dev-session-change-me"


def is_public_path(path: str, method: str = "GET") -> bool:
    if path in _PUBLIC_EXACT:
        return True
    if path == "/api/telegram/credentials" and method.upper() == "POST":
        return True
    if path == "/api/session/logout" and method.upper() == "POST":
        return True
    if any(path == p.rstrip("/") or path.startswith(p) for p in _PUBLIC_PREFIXES_EXTRA):
        return True
    return any(path == p or path.startswith(p + "/") for p in _PUBLIC_PREFIXES)


def get_session_tenant(request: Request) -> str | None:
    raw = request.session.get(SESSION_TENANT_KEY)
    if raw is None:
        return None
    return str(raw)


def set_session_tenant(request: Request, tenant_key: str) -> None:
    from app.tenancy.paths import normalize_tenant_key

    request.session[SESSION_TENANT_KEY] = normalize_tenant_key(tenant_key)


def clear_session_tenant(request: Request) -> None:
    request.session.pop(SESSION_TENANT_KEY, None)


def resolve_request_tenant(request: Request) -> str | None:
    """Cookie-сессия или единственный tenant на инстансе (типичный VPS)."""
    tenant = get_session_tenant(request)
    if tenant:
        return tenant
    from app.tenancy.registry import list_tenant_keys

    keys = list_tenant_keys()
    if len(keys) == 1:
        return keys[0]
    return None


def bind_request_tenant(request: Request) -> str | None:
    """Установить tenant в контекст и cookie (если один tenant и сессии ещё нет)."""
    tenant = resolve_request_tenant(request)
    if tenant and not get_session_tenant(request):
        set_session_tenant(request, tenant)
    return tenant


def require_session_tenant(request: Request) -> str:
    tenant = resolve_request_tenant(request)
    if not tenant:
        raise HTTPException(
            status_code=401,
            detail="Сессия не найдена. Укажите свои ключи Telegram API (my.telegram.org).",
        )
    if not get_session_tenant(request):
        set_session_tenant(request, tenant)
    return tenant


def tenant_from_session_cookie(cookie_value: str | None) -> str | None:
    if not cookie_value:
        return None
    try:
        import itsdangerous

        signer = itsdangerous.URLSafeTimedSerializer(session_secret(), salt="starlette.sessions")
        data = signer.loads(cookie_value, max_age=60 * 60 * 24 * 30)
        if isinstance(data, dict):
            raw = data.get(SESSION_TENANT_KEY)
            if raw is not None:
                from app.tenancy.paths import normalize_tenant_key

                return normalize_tenant_key(str(raw))
    except Exception:
        return None
    return None
