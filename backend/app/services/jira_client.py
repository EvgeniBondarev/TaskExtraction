"""Jira Cloud REST API v3 client."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import httpx

logger = logging.getLogger(__name__)

PRIORITY_MAP = {
    "high": "High",
    "medium": "Medium",
    "low": "Low",
}


@dataclass
class JiraCredentials:
    base_url: str
    email: str
    api_token: str


@dataclass
class JiraProject:
    id: str
    key: str
    name: str
    project_type_key: str | None = None


@dataclass
class JiraIssueType:
    id: str
    name: str
    description: str | None = None
    subtask: bool = False


def normalize_base_url(url: str) -> str:
    u = (url or "").strip().rstrip("/")
    if not u:
        raise ValueError("Jira URL не задан")
    if not u.startswith("http"):
        u = f"https://{u}"
    return u


class JiraClient:
    def __init__(self, creds: JiraCredentials):
        self.creds = creds
        self.base_url = normalize_base_url(creds.base_url)
        self._auth = (creds.email, creds.api_token)

    def _headers(self) -> dict[str, str]:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.request(
                method,
                url,
                auth=self._auth,
                headers=self._headers(),
                json=json,
                params=params,
            )
            if resp.status_code >= 400:
                detail = resp.text[:500]
                try:
                    data = resp.json()
                    if isinstance(data, dict):
                        errs = data.get("errorMessages") or data.get("errors")
                        if errs:
                            detail = str(errs)
                except Exception:
                    pass
                raise ValueError(f"Jira API {resp.status_code}: {detail}")
            if resp.status_code == 204:
                return None
            return resp.json()

    async def test_connection(self) -> dict:
        return await self._request("GET", "/rest/api/3/myself")

    async def list_projects(self) -> list[JiraProject]:
        try:
            data = await self._request(
                "GET",
                "/rest/api/3/project/search",
                params={"maxResults": 50, "orderBy": "name"},
            )
            items = data.get("values", []) if isinstance(data, dict) else []
        except ValueError:
            data = await self._request("GET", "/rest/api/3/project")
            items = data if isinstance(data, list) else []
        projects: list[JiraProject] = []
        for p in items:
            projects.append(
                JiraProject(
                    id=str(p.get("id", "")),
                    key=p.get("key", ""),
                    name=p.get("name", ""),
                    project_type_key=p.get("projectTypeKey"),
                )
            )
        return projects

    async def list_issue_types(self, project_key: str) -> list[JiraIssueType]:
        data = await self._request(
            "GET",
            f"/rest/api/3/issue/createmeta/{project_key}/issuetypes",
        )
        types: list[JiraIssueType] = []
        for it in data.get("issueTypes") or []:
            types.append(
                JiraIssueType(
                    id=str(it.get("id", "")),
                    name=it.get("name", ""),
                    description=it.get("description"),
                    subtask=bool(it.get("subtask", False)),
                )
            )
        return types

    async def create_issue(
        self,
        *,
        project_key: str,
        issue_type_id: str,
        summary: str,
        description_adf: dict,
        priority: str | None = None,
    ) -> dict:
        fields: dict[str, Any] = {
            "project": {"key": project_key},
            "issuetype": {"id": issue_type_id},
            "summary": summary[:255],
            "description": description_adf,
        }
        if priority:
            pname = PRIORITY_MAP.get(priority, priority)
            fields["priority"] = {"name": pname}

        return await self._request(
            "POST",
            "/rest/api/3/issue",
            json={"fields": fields},
        )

    async def add_attachment(
        self,
        issue_key: str,
        file_path: str,
        filename: str,
    ) -> None:
        url = f"{self.base_url}/rest/api/3/issue/{issue_key}/attachments"
        async with httpx.AsyncClient(timeout=120.0) as client:
            with open(file_path, "rb") as f:
                resp = await client.post(
                    url,
                    auth=self._auth,
                    headers={"Accept": "application/json", "X-Atlassian-Token": "no-check"},
                    files={"file": (filename, f)},
                )
            if resp.status_code >= 400:
                raise ValueError(f"Jira attachment failed {resp.status_code}: {resp.text[:300]}")
