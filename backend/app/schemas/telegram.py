from pydantic import BaseModel, Field


class TelegramCredentialsIn(BaseModel):
    api_id: int = Field(..., gt=0, description="App api_id from my.telegram.org/apps")
    api_hash: str = Field(..., min_length=16, description="App api_hash from my.telegram.org/apps")
    monitor_chat_id: int | None = None
    app_title: str | None = Field(None, description="App title from my.telegram.org (optional)")
    app_short_name: str | None = Field(None, description="Short name from my.telegram.org (optional)")


class TelegramCredentialsOut(BaseModel):
    api_id: int
    api_hash_masked: str
    monitor_chat_id: int | None
    app_title: str | None = None


class TelegramStatusOut(BaseModel):
    has_credentials: bool
    is_authorized: bool
    setup_complete: bool
    setup_step: str
    hosted_app: bool = False
    api_id: int | None
    username: str | None
    user_id: int | None
    first_name: str | None = None
    last_name: str | None = None
    monitor_chat_id: int | None
    app_title: str | None = None
    qr_pending: bool
    my_telegram_apps_url: str = "https://my.telegram.org/apps"


class QrStartOut(BaseModel):
    login_id: str
    url: str | None
    already_authorized: bool = False
    username: str | None = None
    expires_in: int | None = None
    refreshed: bool = False


class QrStatusOut(BaseModel):
    status: str
    login_id: str | None = None
    username: str | None = None
    user_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    message: str | None = None


class PhoneSendIn(BaseModel):
    phone: str = Field(..., description="Номер с кодом страны, например +79991234567")


class PhoneSendOut(BaseModel):
    login_id: str
    code_sent: bool
    phone_masked: str | None = None
    message: str | None = None
    code_delivery: str | None = Field(
        None,
        description="app | sms | call | email — куда Telegram отправил код",
    )
    delivery_hint: str | None = None
    already_authorized: bool = False
    username: str | None = None


class PhoneVerifyIn(BaseModel):
    login_id: str
    code: str = Field(..., min_length=4, max_length=10)
    password: str | None = Field(None, description="Облачный пароль 2FA, если включён")


class PhoneVerifyOut(BaseModel):
    status: str
    login_id: str | None = None
    username: str | None = None
    user_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    message: str | None = None
