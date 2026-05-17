from fastapi import APIRouter, Body, HTTPException

from app.schemas.github import (
    GitHubCredentialsIn,
    GitHubLabelOut,
    GitHubSettingsIn,
    GitHubStatusOut,
    GitHubTestIn,
    GitHubTestOut,
)
from app.services import github_settings
from app.services.github_client import GitHubClient, GitHubCredentials

router = APIRouter(prefix="/integrations/github", tags=["integrations-github"])


def _status_out(dto) -> GitHubStatusOut:
    return GitHubStatusOut(
        owner=dto.owner,
        repo=dto.repo,
        has_token=dto.has_token,
        token_masked=dto.token_masked,
        default_labels=dto.default_labels,
        enabled=dto.enabled,
        auto_push=dto.auto_push,
        include_media=dto.include_media,
        include_message_links=dto.include_message_links,
        use_type_labels=dto.use_type_labels,
        is_configured=dto.is_configured,
        repo_url=dto.repo_url,
    )


def _client_from_test(body: GitHubTestIn) -> GitHubClient:
    if not body.owner or not body.repo or not body.token:
        raise HTTPException(400, "Укажите owner, repo и token")
    return GitHubClient(
        GitHubCredentials(owner=body.owner.strip(), repo=body.repo.strip(), token=body.token.strip())
    )


async def _client_from_saved() -> GitHubClient:
    creds = await github_settings.get_github_credentials()
    if not creds:
        raise HTTPException(400, "Сначала сохраните настройки GitHub")
    owner, repo, token = creds
    return GitHubClient(GitHubCredentials(owner=owner, repo=repo, token=token))


async def _resolve_client(body: GitHubCredentialsIn | None) -> GitHubClient:
    if body and body.owner and body.repo and body.token:
        return GitHubClient(
            GitHubCredentials(
                owner=body.owner.strip(),
                repo=body.repo.strip(),
                token=body.token.strip(),
            )
        )
    return await _client_from_saved()


@router.get("/status", response_model=GitHubStatusOut)
async def github_status():
    return _status_out(await github_settings.get_github_status())


@router.put("/settings", response_model=GitHubStatusOut)
async def update_github_settings(body: GitHubSettingsIn):
    try:
        dto = await github_settings.save_github_settings(
            owner=body.owner,
            repo=body.repo,
            token=body.token,
            clear_token=body.clear_token,
            default_labels=body.default_labels,
            enabled=body.enabled,
            auto_push=body.auto_push,
            include_media=body.include_media,
            include_message_links=body.include_message_links,
            use_type_labels=body.use_type_labels,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        if "ENCRYPTION_KEY" in str(e):
            raise HTTPException(500, "ENCRYPTION_KEY не задан") from e
        raise HTTPException(500, "Не удалось сохранить настройки GitHub") from e
    return _status_out(dto)


@router.post("/test", response_model=GitHubTestOut)
async def test_github(body: GitHubTestIn):
    try:
        if body.owner and body.repo and body.token:
            client = _client_from_test(body)
        else:
            client = await _client_from_saved()
        me = await client.test_connection()
        login = me.get("login") or me.get("name")
        return GitHubTestOut(
            success=True,
            message="Подключение к GitHub успешно",
            account_name=login,
        )
    except HTTPException:
        raise
    except ValueError as e:
        return GitHubTestOut(success=False, message=str(e))
    except Exception as e:
        return GitHubTestOut(success=False, message=f"Ошибка: {e}")


@router.post("/labels", response_model=list[GitHubLabelOut])
async def list_labels(body: GitHubCredentialsIn | None = Body(None)):
    try:
        client = await _resolve_client(body)
        labels = await client.list_labels()
        return [
            GitHubLabelOut(name=lb.name, color=lb.color, description=lb.description)
            for lb in labels
        ]
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
