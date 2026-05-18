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
