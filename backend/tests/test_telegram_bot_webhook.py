from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_group_update_is_forwarded_to_bot_ingest(client, monkeypatch):
    from app.api import telegram
    from app.config import get_settings
    from app.services.telegram_bot import pairing_payload

    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "test-token")
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "webhook-secret")
    get_settings.cache_clear()
    received = []

    async def fake_ingest(message):
        received.append(message)

    async def fake_send(*_args, **_kwargs):
        return {"message_id": 1}

    async def fake_avatar(*_args, **_kwargs):
        return "/tmp/group.jpg"

    monkeypatch.setattr(telegram, "handle_new_message", fake_ingest)
    monkeypatch.setattr(telegram, "send_message", fake_send)
    monkeypatch.setattr(telegram, "cache_group_avatar", fake_avatar)
    pairing = await client.post(
        "/api/telegram/webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-secret"},
        json={
            "update_id": 1,
            "message": {
                "message_id": 7,
                "date": 1_700_000_000,
                "text": f"/start {pairing_payload('123456789012345', 'group')}",
                "chat": {"id": -100123, "type": "supergroup", "title": "Рабочая"},
                "from": {"id": 42, "first_name": "Иван"},
            },
        },
    )
    assert pairing.status_code == 200
    from sqlalchemy import select

    from app.models.entities import Chat
    from app.tenancy.registry import tenant_session

    async with tenant_session("123456789012345") as session:
        chat = (
            await session.execute(select(Chat).where(Chat.telegram_chat_id == -100123))
        ).scalar_one()
        assert chat.title == "Рабочая"
        assert chat.is_monitored is True
        assert chat.photo_path == "/tmp/group.jpg"
    response = await client.post(
        "/api/telegram/webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-secret"},
        json={
            "update_id": 2,
            "message": {
                "message_id": 8, "date": 1_700_000_000, "text": "Проверь отчёт",
                "chat": {"id": -100123, "type": "supergroup", "title": "Рабочая"},
                "from": {"id": 42, "first_name": "Иван"},
            },
        },
    )
    assert len(received) == 1
    assert received[0].chat_id == -100123
    assert received[0].raw["source"] == "telegram_bot"
    removed = await client.post(
        "/api/telegram/webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-secret"},
        json={
            "update_id": 3,
            "my_chat_member": {
                "chat": {"id": -100123, "type": "supergroup", "title": "Рабочая"},
                "new_chat_member": {"status": "left", "user": {"id": 999}},
            },
        },
    )
    assert removed.status_code == 200
    assert removed.json()["removed"] is True
    from app.services.source_registry import tenant_for_source

    assert tenant_for_source("chat:-100123") is None
    async with tenant_session("123456789012345") as session:
        chat = (
            await session.execute(select(Chat).where(Chat.telegram_chat_id == -100123))
        ).scalar_one()
        assert chat.is_monitored is False


@pytest.mark.asyncio
async def test_business_update_is_forwarded_only_with_valid_secret(client, monkeypatch):
    from app.api import telegram
    from app.config import get_settings
    from app.services.telegram_bot import pairing_payload

    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "test-token")
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "webhook-secret")
    get_settings.cache_clear()
    response = await client.post("/api/telegram/webhook", json={})
    assert response.status_code == 403

    received = []

    async def fake_ingest(message):
        received.append(message)

    async def fake_send(*_args, **_kwargs):
        return {"message_id": 1}

    monkeypatch.setattr(telegram, "handle_new_message", fake_ingest)
    monkeypatch.setattr(telegram, "send_message", fake_send)
    paired = await client.post(
        "/api/telegram/webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-secret"},
        json={
            "message": {
                "message_id": 1, "date": 1_700_000_000,
                "text": f"/start {pairing_payload('123456789012345', 'business')}",
                "chat": {"id": 777, "type": "private", "first_name": "Owner"},
                "from": {"id": 777, "first_name": "Owner"},
            }
        },
    )
    assert paired.status_code == 200
    connected = await client.post(
        "/api/telegram/webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-secret"},
        json={"business_connection": {"id": "business-1", "user": {"id": 777}}},
    )
    assert connected.status_code == 200
    response = await client.post(
        "/api/telegram/webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-secret"},
        json={
            "business_message": {
                "message_id": 8,
                "date": 1_700_000_000,
                "text": "Нужна помощь",
                "business_connection_id": "business-1",
                "chat": {"id": 123, "type": "private", "first_name": "Клиент"},
                "from": {"id": 123, "first_name": "Клиент"},
            }
        },
    )
    assert response.status_code == 200
    assert received[0].raw["source"] == "telegram_business"
    assert received[0].raw["business_connection_id"] == "business-1"
    disconnected = await client.post(
        "/api/telegram/webhook",
        headers={"X-Telegram-Bot-Api-Secret-Token": "webhook-secret"},
        json={"business_connection": {"id": "business-1", "user": {"id": 777}, "is_enabled": False}},
    )
    assert disconnected.status_code == 200
    from app.services.source_registry import tenant_for_source

    assert tenant_for_source("business:business-1") is None
