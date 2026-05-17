from fastapi import APIRouter, Body, HTTPException

from app.schemas.slack import (
    SlackChannelOut,
    SlackCredentialsIn,
    SlackSettingsIn,
    SlackStatusOut,
    SlackTestIn,
    SlackTestOut,
)
from app.services import slack_settings
from app.services.slack_client import SlackClient

router = APIRouter(prefix="/integrations/slack", tags=["integrations-slack"])


def _status_out(dto) -> SlackStatusOut:
    return SlackStatusOut(
        has_token=dto.has_token,
        token_masked=dto.token_masked,
        channel_id=dto.channel_id,
        channel_name=dto.channel_name,
        workspace_name=dto.workspace_name,
        workspace_url=dto.workspace_url,
        enabled=dto.enabled,
        auto_push=dto.auto_push,
        include_media=dto.include_media,
        include_message_links=dto.include_message_links,
        mention_channel=dto.mention_channel,
        is_configured=dto.is_configured,
    )


async def _resolve_token(body: SlackCredentialsIn | None) -> str:
    if body and body.bot_token:
        return body.bot_token.strip()
    token = await slack_settings.get_slack_token()
    if not token:
        raise HTTPException(400, "Сначала сохраните Bot Token Slack")
    return token


@router.get("/status", response_model=SlackStatusOut)
async def slack_status():
    return _status_out(await slack_settings.get_slack_status())


@router.put("/settings", response_model=SlackStatusOut)
async def update_slack_settings(body: SlackSettingsIn):
    try:
        dto = await slack_settings.save_slack_settings(
            bot_token=body.bot_token,
            clear_token=body.clear_token,
            channel_id=body.channel_id,
            channel_name=body.channel_name,
            workspace_name=body.workspace_name,
            workspace_url=body.workspace_url,
            enabled=body.enabled,
            auto_push=body.auto_push,
            include_media=body.include_media,
            include_message_links=body.include_message_links,
            mention_channel=body.mention_channel,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        if "ENCRYPTION_KEY" in str(e):
            raise HTTPException(500, "ENCRYPTION_KEY не задан") from e
        raise HTTPException(500, "Не удалось сохранить настройки Slack") from e
    return _status_out(dto)


@router.post("/test", response_model=SlackTestOut)
async def test_slack(body: SlackTestIn):
    try:
        token = await _resolve_token(body)
        client = SlackClient(token)
        auth = await client.auth_test()
        workspace = auth.get("team")
        bot = auth.get("user")
        team_url = auth.get("url")
        return SlackTestOut(
            success=True,
            message="Подключение к Slack успешно",
            workspace_name=workspace,
            workspace_url=team_url.rstrip("/") if team_url else None,
            bot_name=bot,
        )
    except HTTPException:
        raise
    except ValueError as e:
        return SlackTestOut(success=False, message=str(e))
    except Exception as e:
        return SlackTestOut(success=False, message=f"Ошибка: {e}")


@router.post("/channels", response_model=list[SlackChannelOut])
async def list_channels(body: SlackCredentialsIn | None = Body(None)):
    try:
        token = await _resolve_token(body)
        client = SlackClient(token)
        channels = await client.list_channels()
        return [
            SlackChannelOut(
                id=ch.id,
                name=ch.name,
                is_private=ch.is_private,
                num_members=ch.num_members,
            )
            for ch in channels
        ]
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
