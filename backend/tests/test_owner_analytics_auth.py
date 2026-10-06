import pytest
from fastapi import HTTPException
from starlette.requests import Request


def _request_with_email(email: str | None) -> Request:
    request = Request({"type": "http", "headers": []})
    request.scope["session"] = {"google_profile": {"email": email}} if email else {}
    return request


def test_owner_analytics_allows_only_configured_google_email(monkeypatch):
    from app.api.owner_analytics import require_analytics_owner
    from app.config import get_settings

    monkeypatch.setenv("ANALYTICS_OWNER_EMAIL", "bondareff7@gmail.com")
    get_settings.cache_clear()
    try:
        assert require_analytics_owner(_request_with_email("Bondareff7@gmail.com")) == "bondareff7@gmail.com"
        with pytest.raises(HTTPException, match="restricted"):
            require_analytics_owner(_request_with_email("someone@example.com"))
        with pytest.raises(HTTPException, match="restricted"):
            require_analytics_owner(_request_with_email(None))
    finally:
        get_settings.cache_clear()
