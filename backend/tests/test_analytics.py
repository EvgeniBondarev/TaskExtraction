"""Аналитика визитов/событий и админ-панель."""

from __future__ import annotations

import os

import pytest

ADMIN_USER = "root"
ADMIN_PASS = "test-admin-secret-xyz"


@pytest.fixture(autouse=True)
def admin_env(monkeypatch):
    monkeypatch.setenv("ADMIN_USERNAME", ADMIN_USER)
    monkeypatch.setenv("ADMIN_PASSWORD", ADMIN_PASS)


@pytest.mark.asyncio
async def test_analytics_visit_and_admin_stats(client):
    r = await client.post(
        "/api/analytics/visit",
        json={
            "visitor_id": "visitor-1",
            "session_id": "session-1",
            "utm_source": "youtube",
            "utm_medium": "video",
            "utm_campaign": "launch",
            "landing_path": "/",
        },
    )
    assert r.status_code == 200

    r = await client.post(
        "/api/analytics/event",
        json={
            "event_type": "registration",
            "visitor_id": "visitor-1",
            "utm_source": "youtube",
            "tenant_api_id": "12345",
        },
    )
    assert r.status_code == 200

    r = await client.post(
        "/api/admin/login",
        json={"username": ADMIN_USER, "password": ADMIN_PASS},
    )
    assert r.status_code == 200

    r = await client.get("/api/admin/stats?days=30")
    assert r.status_code == 200
    data = r.json()
    assert data["totals"]["visits"] >= 1
    assert data["totals"]["registrations"] >= 1
    sources = {row["utm_source"] for row in data["by_source"]}
    assert "youtube" in sources


@pytest.mark.asyncio
async def test_analytics_deduplicates_visits_by_browser_session(client):
    payload = {"visitor_id": "visitor-unique", "session_id": "session-unique"}
    first = await client.post("/api/analytics/visit", json=payload)
    second = await client.post("/api/analytics/visit", json=payload)

    assert first.json()["recorded"] is True
    assert second.json()["recorded"] is False


@pytest.mark.asyncio
async def test_analytics_registration_is_bound_to_server_session_and_is_idempotent(client):
    from sqlalchemy import select

    from app.analytics.db import get_analytics_session_factory
    from app.analytics.models import AnalyticsEvent

    tenant = "7654321"
    saved = await client.post(
        "/api/telegram/credentials",
        json={"api_id": int(tenant), "api_hash": "a" * 32},
    )
    assert saved.status_code == 200

    # A browser must not be able to attribute an event to another workspace.
    for _ in range(2):
        response = await client.post(
            "/api/analytics/event",
            json={
                "event_type": "registration",
                "visitor_id": "visitor-registration-unique",
                "tenant_api_id": "forged-workspace",
            },
        )
        assert response.status_code == 200
        if _ == 0:
            assert response.json()["recorded"] is True
        else:
            assert response.json()["recorded"] is False

    factory = get_analytics_session_factory()
    async with factory() as session:
        event = await session.scalar(
            select(AnalyticsEvent).where(AnalyticsEvent.visitor_id == "visitor-registration-unique")
        )
    assert event is not None
    assert event.tenant_api_id == tenant


@pytest.mark.asyncio
async def test_admin_login_rejects_bad_password(client):
    r = await client.post(
        "/api/admin/login",
        json={"username": ADMIN_USER, "password": "wrong"},
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_admin_stats_requires_auth(client):
    r = await client.get("/api/admin/stats?days=7")
    assert r.status_code == 401
