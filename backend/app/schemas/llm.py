from pydantic import BaseModel, Field


class LlmStatusOut(BaseModel):
    provider: str
    base_url: str
    default_model: str
    active_model: str
    key_source: str
    has_user_key: bool
    user_key_masked: str | None
    user_model: str | None
    can_edit_model: bool
    is_configured: bool


class LlmSettingsIn(BaseModel):
    api_key: str | None = Field(None, description="Ваш OpenRouter API key (опционально)")
    model: str | None = Field(None, description="Модель — только при своём ключе")
    clear_user_key: bool = False


class LlmTestIn(BaseModel):
    api_key: str | None = Field(None, description="Черновик ключа из формы (не сохраняется)")
    model: str | None = Field(None, description="Черновик модели для теста")


class LlmTestOut(BaseModel):
    success: bool
    message: str
    model: str
    key_source: str
    latency_ms: int | None = None
    reply_preview: str | None = None


class PromptSettingsOut(BaseModel):
    classifier_system: str
    extractor_system: str
    extractor_user_template: str
    confidence_threshold: float
    review_threshold: float
    using_defaults: bool


class PromptSettingsIn(BaseModel):
    classifier_system: str | None = None
    extractor_system: str | None = None
    extractor_user_template: str | None = None
    confidence_threshold: float | None = Field(None, ge=0.0, le=1.0)
    review_threshold: float | None = Field(None, ge=0.0, le=1.0)
