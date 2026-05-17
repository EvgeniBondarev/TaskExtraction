from pydantic import BaseModel


class SlackStatusOut(BaseModel):
    has_token: bool = False
    token_masked: str | None = None
    channel_id: str | None = None
    channel_name: str | None = None
    workspace_name: str | None = None
    workspace_url: str | None = None
    enabled: bool = False
    auto_push: bool = False
    include_media: bool = True
    include_message_links: bool = True
    mention_channel: bool = False
    is_configured: bool = False


class SlackSettingsIn(BaseModel):
    bot_token: str | None = None
    clear_token: bool = False
    channel_id: str | None = None
    channel_name: str | None = None
    workspace_name: str | None = None
    workspace_url: str | None = None
    enabled: bool | None = None
    auto_push: bool | None = None
    include_media: bool | None = None
    include_message_links: bool | None = None
    mention_channel: bool | None = None


class SlackCredentialsIn(BaseModel):
    bot_token: str | None = None


class SlackTestIn(SlackCredentialsIn):
    pass


class SlackTestOut(BaseModel):
    success: bool
    message: str
    workspace_name: str | None = None
    workspace_url: str | None = None
    bot_name: str | None = None


class SlackChannelOut(BaseModel):
    id: str
    name: str
    is_private: bool = False
    num_members: int | None = None
