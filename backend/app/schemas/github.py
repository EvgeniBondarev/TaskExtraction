from pydantic import BaseModel, Field


class GitHubStatusOut(BaseModel):
    owner: str | None = None
    repo: str | None = None
    has_token: bool = False
    token_masked: str | None = None
    default_labels: list[str] = Field(default_factory=list)
    enabled: bool = False
    auto_push: bool = False
    include_media: bool = True
    include_message_links: bool = True
    use_type_labels: bool = True
    is_configured: bool = False
    repo_url: str | None = None


class GitHubSettingsIn(BaseModel):
    owner: str | None = None
    repo: str | None = None
    token: str | None = None
    clear_token: bool = False
    default_labels: list[str] | None = None
    enabled: bool | None = None
    auto_push: bool | None = None
    include_media: bool | None = None
    include_message_links: bool | None = None
    use_type_labels: bool | None = None


class GitHubCredentialsIn(BaseModel):
    owner: str | None = None
    repo: str | None = None
    token: str | None = None


class GitHubTestIn(GitHubCredentialsIn):
    pass


class GitHubTestOut(BaseModel):
    success: bool
    message: str
    account_name: str | None = None


class GitHubLabelOut(BaseModel):
    name: str
    color: str | None = None
    description: str | None = None
