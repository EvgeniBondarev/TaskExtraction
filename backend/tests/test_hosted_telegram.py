"""Hosted-режим: общие TELEGRAM_API_ID/HASH из env."""

from __future__ import annotations

import pytest

from app.services.hosted_telegram import is_hosted_mode, shared_credentials


@pytest.fixture
def hosted_env(monkeypatch):
    monkeypatch.setenv("TELEGRAM_API_ID", "11080576")
    monkeypatch.setenv("TELEGRAM_API_HASH", "14079e73df3157b7d96ac12cf28d1d9c")
    from app.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_is_hosted_mode(hosted_env):
    assert is_hosted_mode() is True
    creds = shared_credentials()
    assert creds is not None
    assert creds.api_id == 11080576


@pytest.mark.asyncio
async def test_telegram_status_hosted_without_session(client, hosted_env):
    r = await client.get("/api/telegram/status")
    assert r.status_code == 200
    data = r.json()
    assert data["hosted_app"] is True
    assert data["has_credentials"] is True
    assert data["setup_step"] == "auth"
    assert data["is_authorized"] is False
