"""Google OAuth login; Google identity is separate from Telegram sources."""

from __future__ import annotations

import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.config import get_settings
from app.tenancy import ensure_tenant, set_session_tenant
from app.tenancy.paths import tenant_key_from_google_subject

router = APIRouter(prefix="/auth/google", tags=["auth"])

_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_TOKEN_URL = "https://oauth2.googleapis.com/token"
_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"


def _redirect_uri() -> str:
    settings = get_settings()
    return settings.google_redirect_uri or f"{settings.public_api_url.rstrip('/')}/api/auth/google/callback"


def _configured() -> bool:
    settings = get_settings()
    return bool(settings.google_client_id and settings.google_client_secret)


@router.get("/status")
async def google_auth_status(request: Request):
    profile = request.session.get("google_profile") or {}
    return {
        "configured": _configured(),
        "authenticated": bool(request.session.get("tenant_api_id")),
        "user": {
            "email": profile.get("email") or request.session.get("google_email"),
            "name": profile.get("name"),
            "picture": profile.get("picture"),
        } if request.session.get("tenant_api_id") else None,
    }


@router.get("/start")
async def google_auth_start(request: Request):
    if not _configured():
        raise HTTPException(503, "Google OAuth is not configured")
    state = secrets.token_urlsafe(32)
    request.session["google_oauth_state"] = state
    settings = get_settings()
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": _redirect_uri(),
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "prompt": "select_account",
        }
    )
    return RedirectResponse(f"{_AUTH_URL}?{query}")


@router.get("/callback")
async def google_auth_callback(request: Request, code: str | None = None, state: str | None = None):
    expected = request.session.pop("google_oauth_state", None)
    if not code or not state or not expected or not secrets.compare_digest(state, expected):
        raise HTTPException(400, "Google OAuth state is invalid or expired")
    settings = get_settings()
    async with httpx.AsyncClient(timeout=15) as client:
        token_response = await client.post(
            _TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": _redirect_uri(),
                "grant_type": "authorization_code",
            },
        )
        if not token_response.is_success:
            raise HTTPException(401, "Google OAuth token exchange failed")
        access_token = token_response.json().get("access_token")
        profile_response = await client.get(_USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if not profile_response.is_success:
        raise HTTPException(401, "Google profile verification failed")
    profile = profile_response.json()
    subject = profile.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(401, "Google profile has no subject")
    tenant = tenant_key_from_google_subject(subject)
    ensure_tenant(tenant)
    set_session_tenant(request, tenant)
    request.session["google_email"] = profile.get("email")
    request.session["google_profile"] = {
        "email": profile.get("email"),
        "name": profile.get("name"),
        "picture": profile.get("picture"),
    }
    return RedirectResponse(settings.public_web_url.rstrip("/") + "/")


@router.post("/logout")
async def google_auth_logout(request: Request):
    request.session.pop("tenant_api_id", None)
    request.session.pop("google_email", None)
    request.session.pop("google_profile", None)
    return {"ok": True}
