"""Slack Web API client."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

BASE_URL = "https://slack.com/api"

# Scopes used by TaskExtraction (shown in settings UI).
RECOMMENDED_BOT_SCOPES = (
    "chat:write",
    "channels:read",
    "channels:history",
    "users:read",
)

SCOPE_HINTS: dict[str, str] = {
    "chat:write": "отправка сообщений в канал",
    "channels:read": "список публичных каналов",
    "channels:history": "чтение истории публичных каналов",
    "groups:read": "список приватных каналов",
    "groups:history": "чтение истории приватных каналов",
    "users:read": "информация о пользователях",
    "im:read": "личные сообщения (DM)",
    "im:history": "история личных сообщений",
    "mpim:read": "групповые личные сообщения",
    "mpim:history": "история групповых личных сообщений",
    "chat:write.public": "публикация в публичные каналы без приглашения бота",
}


def _split_scopes(value: str | None) -> list[str]:
    if not value:
        return []
    return [s.strip() for s in value.replace(",", " ").split() if s.strip()]


def format_slack_api_error(data: dict) -> str:
    """Human-readable Slack API error, with scope hints for missing_scope."""
    err = data.get("error") or "unknown_error"
    if err != "missing_scope":
        return f"Slack API: {err}"

    needed = _split_scopes(data.get("needed"))
    provided = _split_scopes(data.get("provided"))

    lines = [
        "Slack API: missing_scope — у токена бота не хватает прав.",
        "Добавьте scopes в приложении: OAuth & Permissions → Bot Token Scopes, "
        "затем переустановите приложение (Install App) и обновите xoxb-токен в настройках.",
    ]
    if needed:
        lines.append("")
        lines.append("Нужно добавить:")
        for scope in needed:
            hint = SCOPE_HINTS.get(scope, "")
            lines.append(f"  • {scope}" + (f" — {hint}" if hint else ""))
    else:
        lines.append("")
        lines.append("Рекомендуемые scopes для TaskExtraction:")
        for scope in RECOMMENDED_BOT_SCOPES:
            hint = SCOPE_HINTS.get(scope, "")
            lines.append(f"  • {scope}" + (f" — {hint}" if hint else ""))

    if provided:
        lines.append("")
        lines.append(f"Сейчас у токена: {', '.join(provided)}")

    return "\n".join(lines)


@dataclass
class SlackChannel:
    id: str
    name: str
    is_private: bool = False
    num_members: int | None = None


class SlackClient:
    def __init__(self, bot_token: str):
        if not bot_token:
            raise ValueError("Укажите Bot User OAuth Token (xoxb-…)")
        self.token = bot_token.strip()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json; charset=utf-8",
        }

    async def _api(self, method: str, *, json: dict | None = None, params: dict | None = None) -> Any:
        url = f"{BASE_URL}/{method}"
        async with httpx.AsyncClient(timeout=60.0) as client:
            if json is not None:
                resp = await client.post(url, headers=self._headers(), json=json)
            else:
                resp = await client.get(url, headers=self._headers(), params=params or {})
            data = resp.json()
            if not data.get("ok"):
                raise ValueError(format_slack_api_error(data))
            return data

    async def auth_test(self) -> dict:
        return await self._api("auth.test")

    async def list_channels(self) -> list[SlackChannel]:
        data = await self._api(
            "conversations.list",
            params={
                "types": "public_channel,private_channel",
                "exclude_archived": "true",
                "limit": "200",
            },
        )
        channels: list[SlackChannel] = []
        for ch in data.get("channels") or []:
            if ch.get("is_archived"):
                continue
            channels.append(
                SlackChannel(
                    id=ch.get("id", ""),
                    name=ch.get("name", ""),
                    is_private=bool(ch.get("is_private", False)),
                    num_members=ch.get("num_members"),
                )
            )
        channels.sort(key=lambda c: c.name.lower())
        return channels

    async def post_message(
        self,
        *,
        channel: str,
        text: str,
        blocks: list[dict] | None = None,
    ) -> dict:
        payload: dict[str, Any] = {
            "channel": channel,
            "text": text[:4000],
            "unfurl_links": True,
            "unfurl_media": True,
        }
        if blocks:
            payload["blocks"] = blocks[:50]
        return await self._api("chat.postMessage", json=payload)

    async def get_permalink(self, channel: str, message_ts: str) -> str | None:
        data = await self._api(
            "chat.getPermalink",
            params={"channel": channel, "message_ts": message_ts},
        )
        return data.get("permalink")
