"""Trello REST API client (key + token auth)."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

logger = logging.getLogger(__name__)

BASE_URL = "https://api.trello.com/1"


@dataclass
class TrelloCredentials:
    api_key: str
    token: str


@dataclass
class TrelloBoard:
    id: str
    name: str
    url: str | None = None
    closed: bool = False


@dataclass
class TrelloList:
    id: str
    name: str
    closed: bool = False


class TrelloClient:
    def __init__(self, creds: TrelloCredentials):
        if not creds.api_key or not creds.token:
            raise ValueError("Укажите API Key и Token Trello")
        self.creds = creds

    def _auth_params(self) -> dict[str, str]:
        return {"key": self.creds.api_key, "token": self.creds.token}

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict | None = None,
        data: dict | None = None,
        files: dict | None = None,
    ) -> Any:
        url = f"{BASE_URL}{path}"
        qp = {**self._auth_params(), **(params or {})}
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.request(method, url, params=qp, data=data, files=files)
            if resp.status_code >= 400:
                detail = resp.text[:500]
                try:
                    payload = resp.json()
                    if isinstance(payload, dict) and payload.get("message"):
                        detail = payload["message"]
                except Exception:
                    pass
                raise ValueError(f"Trello API {resp.status_code}: {detail}")
            if resp.status_code == 204 or not resp.content:
                return None
            return resp.json()

    async def test_connection(self) -> dict:
        return await self._request(
            "GET",
            "/members/me",
            params={"fields": "fullName,username,url"},
        )

    async def list_boards(self) -> list[TrelloBoard]:
        data = await self._request(
            "GET",
            "/members/me/boards",
            params={"fields": "id,name,url,closed", "filter": "open"},
        )
        boards: list[TrelloBoard] = []
        for b in data if isinstance(data, list) else []:
            if b.get("closed"):
                continue
            boards.append(
                TrelloBoard(
                    id=b.get("id", ""),
                    name=b.get("name", ""),
                    url=b.get("url"),
                    closed=bool(b.get("closed", False)),
                )
            )
        return boards

    async def list_lists(self, board_id: str) -> list[TrelloList]:
        data = await self._request(
            "GET",
            f"/boards/{board_id}/lists",
            params={"fields": "id,name,closed", "filter": "open"},
        )
        lists: list[TrelloList] = []
        for item in data if isinstance(data, list) else []:
            if item.get("closed"):
                continue
            lists.append(
                TrelloList(
                    id=item.get("id", ""),
                    name=item.get("name", ""),
                    closed=bool(item.get("closed", False)),
                )
            )
        return lists

    async def create_card(
        self,
        *,
        list_id: str,
        name: str,
        desc: str | None = None,
    ) -> dict:
        payload: dict[str, str] = {
            "idList": list_id,
            "name": name[:16384],
        }
        if desc:
            payload["desc"] = desc[:16384]
        return await self._request("POST", "/cards", data=payload)

    async def add_attachment_url(self, card_id: str, url: str, name: str | None = None) -> None:
        data: dict[str, str] = {"url": url}
        if name:
            data["name"] = name[:256]
        await self._request("POST", f"/cards/{card_id}/attachments", data=data)

    async def add_attachment_file(self, card_id: str, file_path: str, filename: str) -> None:
        async with httpx.AsyncClient(timeout=120.0) as client:
            with open(file_path, "rb") as f:
                resp = await client.post(
                    f"{BASE_URL}/cards/{card_id}/attachments",
                    params=self._auth_params(),
                    files={"file": (filename, f)},
                )
            if resp.status_code >= 400:
                raise ValueError(f"Trello attachment failed {resp.status_code}: {resp.text[:300]}")
