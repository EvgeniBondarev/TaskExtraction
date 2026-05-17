"""GitHub REST API client for Issues."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

API_VERSION = "2022-11-28"
BASE_URL = "https://api.github.com"


@dataclass
class GitHubCredentials:
    owner: str
    repo: str
    token: str


@dataclass
class GitHubLabel:
    name: str
    color: str | None = None
    description: str | None = None


class GitHubClient:
    def __init__(self, creds: GitHubCredentials):
        if not creds.owner or not creds.repo or not creds.token:
            raise ValueError("Укажите owner, repo и token GitHub")
        self.creds = creds

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.creds.token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": API_VERSION,
        }

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> Any:
        url = f"{BASE_URL}{path}"
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.request(
                method, url, headers=self._headers(), json=json, params=params
            )
            if resp.status_code >= 400:
                detail = resp.text[:500]
                try:
                    data = resp.json()
                    if isinstance(data, dict):
                        detail = data.get("message", detail)
                except Exception:
                    pass
                raise ValueError(f"GitHub API {resp.status_code}: {detail}")
            if resp.status_code == 204 or not resp.content:
                return None
            return resp.json()

    async def test_connection(self) -> dict:
        return await self._request("GET", "/user")

    async def list_labels(self) -> list[GitHubLabel]:
        data = await self._request(
            "GET",
            f"/repos/{self.creds.owner}/{self.creds.repo}/labels",
            params={"per_page": 100},
        )
        labels: list[GitHubLabel] = []
        for item in data if isinstance(data, list) else []:
            labels.append(
                GitHubLabel(
                    name=item.get("name", ""),
                    color=item.get("color"),
                    description=item.get("description"),
                )
            )
        return labels

    async def create_issue(
        self,
        *,
        title: str,
        body: str,
        labels: list[str] | None = None,
    ) -> dict:
        payload: dict[str, Any] = {
            "title": title[:256],
            "body": body[:65536],
        }
        if labels:
            payload["labels"] = labels[:10]
        return await self._request(
            "POST",
            f"/repos/{self.creds.owner}/{self.creds.repo}/issues",
            json=payload,
        )

    async def add_comment(self, issue_number: int, body: str) -> dict:
        return await self._request(
            "POST",
            f"/repos/{self.creds.owner}/{self.creds.repo}/issues/{issue_number}/comments",
            json={"body": body[:65536]},
        )
