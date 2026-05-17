from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy import select

from app.tenancy.registry import tenant_session
from app.models.entities import GitHubConfig
from app.utils.crypto import decrypt_str, encrypt_str

CONFIG_ID = 1


@dataclass
class GitHubConfigDTO:
    owner: str | None
    repo: str | None
    has_token: bool
    token_masked: str | None
    default_labels: list[str]
    enabled: bool
    auto_push: bool
    include_media: bool
    include_message_links: bool
    use_type_labels: bool
    is_configured: bool
    repo_url: str | None


async def _get_row() -> GitHubConfig | None:
    async with tenant_session() as session:
        result = await session.execute(select(GitHubConfig).where(GitHubConfig.id == CONFIG_ID))
        return result.scalar_one_or_none()


async def _ensure_row(session) -> GitHubConfig:
    result = await session.execute(select(GitHubConfig).where(GitHubConfig.id == CONFIG_ID))
    row = result.scalar_one_or_none()
    if not row:
        row = GitHubConfig(id=CONFIG_ID)
        session.add(row)
        await session.flush()
    return row


def _repo_url(owner: str | None, repo: str | None) -> str | None:
    if owner and repo:
        return f"https://github.com/{owner}/{repo}"
    return None


def row_to_dto(row: GitHubConfig | None) -> GitHubConfigDTO:
    if not row:
        return GitHubConfigDTO(
            owner=None,
            repo=None,
            has_token=False,
            token_masked=None,
            default_labels=[],
            enabled=False,
            auto_push=False,
            include_media=True,
            include_message_links=True,
            use_type_labels=True,
            is_configured=False,
            repo_url=None,
        )
    has_token = bool(row.token_encrypted)
    labels = list(row.default_labels or [])
    configured = bool(row.owner and row.repo and has_token)
    return GitHubConfigDTO(
        owner=row.owner,
        repo=row.repo,
        has_token=has_token,
        token_masked="••••••••" if has_token else None,
        default_labels=labels,
        enabled=row.enabled,
        auto_push=row.auto_push,
        include_media=row.include_media,
        include_message_links=row.include_message_links,
        use_type_labels=row.use_type_labels,
        is_configured=configured,
        repo_url=_repo_url(row.owner, row.repo),
    )


async def get_github_status() -> GitHubConfigDTO:
    return row_to_dto(await _get_row())


async def get_github_credentials() -> tuple[str, str, str] | None:
    row = await _get_row()
    if not row or not row.owner or not row.repo or not row.token_encrypted:
        return None
    try:
        token = decrypt_str(row.token_encrypted)
    except ValueError:
        return None
    return row.owner, row.repo, token


async def get_github_config_row() -> GitHubConfig | None:
    return await _get_row()


async def save_github_settings(
    *,
    owner: str | None = None,
    repo: str | None = None,
    token: str | None = None,
    clear_token: bool = False,
    default_labels: list[str] | None = None,
    enabled: bool | None = None,
    auto_push: bool | None = None,
    include_media: bool | None = None,
    include_message_links: bool | None = None,
    use_type_labels: bool | None = None,
) -> GitHubConfigDTO:
    async with tenant_session() as session:
        row = await _ensure_row(session)
        if owner is not None:
            row.owner = owner.strip() if owner else None
        if repo is not None:
            row.repo = repo.strip() if repo else None
        if token:
            row.token_encrypted = encrypt_str(token.strip())
        elif clear_token:
            row.token_encrypted = None
        if default_labels is not None:
            row.default_labels = [l.strip() for l in default_labels if l and l.strip()]
        if enabled is not None:
            row.enabled = enabled
        if auto_push is not None:
            row.auto_push = auto_push
        if include_media is not None:
            row.include_media = include_media
        if include_message_links is not None:
            row.include_message_links = include_message_links
        if use_type_labels is not None:
            row.use_type_labels = use_type_labels
        await session.commit()
        await session.refresh(row)
        return row_to_dto(row)
