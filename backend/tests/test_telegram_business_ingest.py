from datetime import datetime, timezone

import pytest
from sqlalchemy import select

from app.models.entities import Chat, Message, MessageAttachment
from app.services.telegram_bot import BotMessage
from app.services.source_registry import set_source
from app.tenancy import reset_current_tenant, set_current_tenant
from app.tenancy.registry import tenant_session
from app.utils.telegram_attachments import PreparedAttachment


@pytest.mark.asyncio
async def test_business_message_is_not_filtered_by_monitored_group(authed_client, monkeypatch):
    """A Business chat is authorized by Telegram, independently of group monitoring."""
    from app.telegram import ingest

    async def no_task(*_args, **_kwargs):
        return None

    monkeypatch.setattr(ingest, "process_message", no_task)
    tenant = "12345678"
    token = set_current_tenant(tenant)
    try:
        async with tenant_session(tenant) as session:
            session.add(
                Chat(
                    telegram_chat_id=-100123,
                    title="Рабочая группа",
                    chat_type="supergroup",
                    is_monitored=True,
                )
            )
            await session.commit()

        await ingest.handle_new_message(
            BotMessage(
                id=57,
                chat_id=998877,
                text="Нужно подготовить отчёт до пятницы",
                date=datetime.now(timezone.utc),
                sender_id=998877,
                sender_name="Вася",
                chat_title="Вася Си",
                chat_type="private",
                reply_to_id=None,
                raw={
                    "source": "telegram_business",
                    "business_connection_id": "business-test",
                },
            )
        )

        async with tenant_session(tenant) as session:
            message = (
                await session.execute(
                    select(Message).where(Message.telegram_message_id == 57)
                )
            ).scalar_one()
            assert message.text == "Нужно подготовить отчёт до пятницы"
            chat = await session.get(Chat, message.chat_id)
            assert chat and chat.telegram_chat_id == 998877
            assert chat.is_monitored is True
    finally:
        reset_current_tenant(token)


@pytest.mark.asyncio
async def test_business_message_saves_bot_api_profile(authed_client, monkeypatch):
    from app.telegram import ingest

    async def no_task(*_args, **_kwargs):
        return None

    async def fake_avatar(user_id: int):
        assert user_id == 445566
        return "/tmp/business-user.jpg"

    monkeypatch.setattr(ingest, "process_message", no_task)
    monkeypatch.setattr("app.services.telegram_bot.cache_business_user_avatar", fake_avatar)
    tenant = "12345678"
    token = set_current_tenant(tenant)
    try:
        await ingest.handle_new_message(
            BotMessage(
                id=58,
                chat_id=445566,
                text="Добрый день",
                date=datetime.now(timezone.utc),
                sender_id=445566,
                sender_name="Публичное имя",
                chat_title="Публичное имя",
                chat_type="private",
                reply_to_id=None,
                raw={"source": "telegram_business", "business_connection_id": "business-test"},
            )
        )
        from app.models.entities import TelegramProfile

        async with tenant_session(tenant) as session:
            profile = await session.get(TelegramProfile, 445566)
            assert profile and profile.display_name == "Публичное имя"
            assert profile.photo_path == "/tmp/business-user.jpg"
    finally:
        reset_current_tenant(token)


@pytest.mark.asyncio
async def test_bot_api_media_is_persisted_for_the_source_message(authed_client, monkeypatch, test_data_dir):
    from app.telegram import ingest

    async def no_task(*_args, **_kwargs):
        return None

    async def fake_download(payload, media_dir):
        assert payload["document"]["file_id"] == "file-123"
        path = test_data_dir / "media" / "messages" / "998877" / "59" / "brief.pdf"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"pdf")
        return [PreparedAttachment(
            kind="pdf", file_name="brief.pdf", stored_path="messages/998877/59/brief.pdf",
            mime_type="application/pdf", file_size=3,
        )]

    monkeypatch.setattr(ingest, "process_message", no_task)
    monkeypatch.setattr(ingest, "download_bot_api_attachments", fake_download)
    tenant = "12345678"
    token = set_current_tenant(tenant)
    try:
        await ingest.handle_new_message(
            BotMessage(
                id=59, chat_id=998877, text="Документ", date=datetime.now(timezone.utc),
                sender_id=998877, sender_name="Вася", chat_title="Вася Си", chat_type="private",
                reply_to_id=None, raw={"source": "telegram_business"},
                attachment_payload={"message_id": 59, "chat": {"id": 998877}, "document": {"file_id": "file-123"}},
            )
        )
        async with tenant_session(tenant) as session:
            attachment = (await session.execute(select(MessageAttachment))).scalar_one()
            assert attachment.kind == "pdf"
            assert attachment.file_name == "brief.pdf"
    finally:
        reset_current_tenant(token)


@pytest.mark.asyncio
async def test_onboarding_status_reports_group_and_business_connection(authed_client):
    tenant = "12345678"
    set_source("group", "chat:-10042", tenant, title="Команда продукта", avatar_path="/tmp/group.jpg")
    set_source("business_user", "business-user:77", tenant)
    set_source("business_connection", "business:connection-77", tenant, title="Алексей Орлов")

    response = await authed_client.get("/api/telegram/onboarding-status")

    assert response.status_code == 200
    assert response.json() == {
        "groups": [
            {
                "source_id": "chat:-10042",
                "title": "Команда продукта",
                "has_avatar": True,
                "paused": False,
            }
        ],
        "business_paired": True,
        "business_connected": True,
        "business_account": {"title": "Алексей Орлов"},
    }


@pytest.mark.asyncio
async def test_onboarding_refresh_removes_revoked_business_connection(authed_client, monkeypatch):
    from app.api import telegram

    tenant = "12345678"
    set_source("business_connection", "business:connection-77", tenant, title="Алексей Орлов")

    async def disabled(connection_id: str):
        assert connection_id == "connection-77"
        return False

    monkeypatch.setattr(telegram, "business_connection_is_enabled", disabled)
    response = await authed_client.post("/api/telegram/onboarding-status/refresh")

    assert response.status_code == 200
    assert response.json()["business_connected"] is False
    assert response.json()["business_account"] is None


@pytest.mark.asyncio
async def test_onboarding_refresh_removes_group_without_bot(authed_client, monkeypatch):
    from app.api import telegram

    tenant = "12345678"
    set_source("group", "chat:-10042", tenant, title="Команда продукта")

    async def unavailable(chat_id: int):
        assert chat_id == -10042
        return False

    monkeypatch.setattr(telegram, "group_is_available", unavailable)
    response = await authed_client.post("/api/telegram/onboarding-status/refresh")

    assert response.status_code == 200
    assert response.json()["groups"] == []
