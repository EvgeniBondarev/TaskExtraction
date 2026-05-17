from uuid import UUID

from fastapi import APIRouter, Body, HTTPException

from app.schemas.jira import (
    JiraCredentialsIn,
    JiraIssueTypeOut,
    JiraProjectOut,
    JiraSettingsIn,
    JiraStatusOut,
    JiraTestIn,
    JiraTestOut,
)
from app.services import jira_settings
from app.services.jira_client import JiraClient, JiraCredentials

router = APIRouter(prefix="/integrations/jira", tags=["integrations-jira"])


def _status_out(dto) -> JiraStatusOut:
    return JiraStatusOut(
        base_url=dto.base_url,
        email=dto.email,
        has_token=dto.has_token,
        token_masked=dto.token_masked,
        project_key=dto.project_key,
        project_name=dto.project_name,
        issue_type_id=dto.issue_type_id,
        issue_type_name=dto.issue_type_name,
        enabled=dto.enabled,
        auto_push=dto.auto_push,
        include_media=dto.include_media,
        include_message_links=dto.include_message_links,
        is_configured=dto.is_configured,
    )


def _client_from_test(body: JiraTestIn) -> JiraClient:
    base = body.base_url
    email = body.email
    token = body.api_token
    if not base or not email or not token:
        raise HTTPException(400, "Укажите URL, email и API token")
    return JiraClient(JiraCredentials(base_url=base, email=email, api_token=token))


async def _client_from_saved() -> JiraClient:
    creds = await jira_settings.get_jira_credentials()
    if not creds:
        raise HTTPException(400, "Сначала сохраните настройки Jira")
    base, email, token = creds
    return JiraClient(JiraCredentials(base_url=base, email=email, api_token=token))


async def _resolve_client(body: JiraCredentialsIn | None) -> JiraClient:
    if body and body.api_token and body.base_url and body.email:
        return JiraClient(
            JiraCredentials(
                base_url=body.base_url,
                email=body.email,
                api_token=body.api_token,
            )
        )
    return await _client_from_saved()


@router.get("/status", response_model=JiraStatusOut)
async def jira_status():
    return _status_out(await jira_settings.get_jira_status())


@router.put("/settings", response_model=JiraStatusOut)
async def update_jira_settings(body: JiraSettingsIn):
    try:
        dto = await jira_settings.save_jira_settings(
            base_url=body.base_url,
            email=body.email,
            api_token=body.api_token,
            clear_token=body.clear_token,
            project_key=body.project_key,
            project_name=body.project_name,
            issue_type_id=body.issue_type_id,
            issue_type_name=body.issue_type_name,
            enabled=body.enabled,
            auto_push=body.auto_push,
            include_media=body.include_media,
            include_message_links=body.include_message_links,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        if "ENCRYPTION_KEY" in str(e):
            raise HTTPException(500, "ENCRYPTION_KEY не задан") from e
        raise HTTPException(500, "Не удалось сохранить настройки Jira") from e
    return _status_out(dto)


@router.post("/test", response_model=JiraTestOut)
async def test_jira(body: JiraTestIn):
    try:
        if body.api_token and body.base_url and body.email:
            client = _client_from_test(body)
        else:
            client = await _client_from_saved()
        me = await client.test_connection()
        name = me.get("displayName") or me.get("emailAddress")
        return JiraTestOut(
            success=True,
            message="Подключение к Jira успешно",
            account_name=name,
        )
    except HTTPException:
        raise
    except ValueError as e:
        return JiraTestOut(success=False, message=str(e))
    except Exception as e:
        return JiraTestOut(success=False, message=f"Ошибка: {e}")


@router.post("/projects", response_model=list[JiraProjectOut])
async def list_projects(body: JiraCredentialsIn | None = Body(None)):
    try:
        client = await _resolve_client(body)
        projects = await client.list_projects()
        return [
            JiraProjectOut(
                id=p.id,
                key=p.key,
                name=p.name,
                project_type_key=p.project_type_key,
            )
            for p in projects
        ]
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


@router.post("/projects/{project_key}/issuetypes", response_model=list[JiraIssueTypeOut])
async def list_issue_types(project_key: str, body: JiraCredentialsIn | None = Body(None)):
    try:
        client = await _resolve_client(body)
        types = await client.list_issue_types(project_key)
        return [
            JiraIssueTypeOut(
                id=t.id,
                name=t.name,
                description=t.description,
                subtask=t.subtask,
            )
            for t in types
            if not t.subtask
        ]
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
