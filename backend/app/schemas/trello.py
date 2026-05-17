from pydantic import BaseModel, Field


class TrelloStatusOut(BaseModel):
    api_key: str | None = None
    has_token: bool = False
    token_masked: str | None = None
    board_id: str | None = None
    board_name: str | None = None
    list_id: str | None = None
    list_name: str | None = None
    enabled: bool = False
    auto_push: bool = False
    include_media: bool = True
    include_message_links: bool = True
    is_configured: bool = False
    authorize_url: str | None = None


class TrelloSettingsIn(BaseModel):
    api_key: str | None = None
    token: str | None = None
    clear_token: bool = False
    board_id: str | None = None
    board_name: str | None = None
    list_id: str | None = None
    list_name: str | None = None
    enabled: bool | None = None
    auto_push: bool | None = None
    include_media: bool | None = None
    include_message_links: bool | None = None


class TrelloCredentialsIn(BaseModel):
    api_key: str | None = None
    token: str | None = None


class TrelloTestIn(TrelloCredentialsIn):
    pass


class TrelloTestOut(BaseModel):
    success: bool
    message: str
    account_name: str | None = None


class TrelloBoardOut(BaseModel):
    id: str
    name: str
    url: str | None = None
    closed: bool = False


class TrelloListOut(BaseModel):
    id: str
    name: str
    closed: bool = False
