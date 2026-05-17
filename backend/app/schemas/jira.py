from pydantic import BaseModel, Field


class JiraStatusOut(BaseModel):
    base_url: str | None = None
    email: str | None = None
    has_token: bool = False
    token_masked: str | None = None
    project_key: str | None = None
    project_name: str | None = None
    issue_type_id: str | None = None
    issue_type_name: str | None = None
    enabled: bool = False
    auto_push: bool = False
    include_media: bool = True
    include_message_links: bool = True
    is_configured: bool = False


class JiraSettingsIn(BaseModel):
    base_url: str | None = None
    email: str | None = None
    api_token: str | None = None
    clear_token: bool = False
    project_key: str | None = None
    project_name: str | None = None
    issue_type_id: str | None = None
    issue_type_name: str | None = None
    enabled: bool | None = None
    auto_push: bool | None = None
    include_media: bool | None = None
    include_message_links: bool | None = None


class JiraCredentialsIn(BaseModel):
    base_url: str | None = None
    email: str | None = None
    api_token: str | None = None


class JiraTestIn(JiraCredentialsIn):
    pass


class JiraTestOut(BaseModel):
    success: bool
    message: str
    account_name: str | None = None


class JiraProjectOut(BaseModel):
    id: str
    key: str
    name: str
    project_type_key: str | None = None


class JiraIssueTypeOut(BaseModel):
    id: str
    name: str
    description: str | None = None
    subtask: bool = False
