"""Аутентификация админ-панели (отдельно от tenant-сессии панели)."""

from __future__ import annotations

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, Request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

ADMIN_SESSION_KEY = "admin_ok"
ADMIN_COOKIE = "te_admin"
ADMIN_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def _admin_secret() -> str:
    raw = os.environ.get("ADMIN_SESSION_SECRET") or os.environ.get("ENCRYPTION_KEY") or ""
    if raw:
        return hashlib.sha256(raw.encode()).hexdigest()
    return "taskextraction-admin-dev-change-me"


def admin_credentials() -> tuple[str, str]:
    user = (os.environ.get("ADMIN_USERNAME") or "root").strip()
    password = os.environ.get("ADMIN_PASSWORD") or ""
    return user, password


def verify_admin_login(username: str, password: str) -> bool:
    expected_user, expected_pass = admin_credentials()
    if not expected_pass:
        return False
    return secrets.compare_digest(username.strip(), expected_user) and secrets.compare_digest(
        password, expected_pass
    )


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(_admin_secret(), salt="te-admin")


def create_admin_token(username: str) -> str:
    return _serializer().dumps({"u": username, "t": datetime.now(timezone.utc).isoformat()})


def validate_admin_token(token: str | None) -> bool:
    if not token:
        return False
    try:
        data = _serializer().loads(token, max_age=ADMIN_MAX_AGE)
        return isinstance(data, dict) and bool(data.get("u"))
    except (BadSignature, SignatureExpired):
        return False


def set_admin_session(request: Request, username: str) -> None:
    request.session[ADMIN_SESSION_KEY] = username


def clear_admin_session(request: Request) -> None:
    request.session.pop(ADMIN_SESSION_KEY, None)


def require_admin(request: Request) -> str:
    user = request.session.get(ADMIN_SESSION_KEY)
    if user:
        return str(user)
    cookie = request.cookies.get(ADMIN_COOKIE)
    if validate_admin_token(cookie):
        return "cookie"
    raise HTTPException(status_code=401, detail="Требуется вход в админ-панель")
