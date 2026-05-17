from fastapi import APIRouter, HTTPException

from app.extraction.prompts import (
    DEFAULT_CLASSIFIER_SYSTEM,
    DEFAULT_EXTRACTOR_SYSTEM,
    DEFAULT_EXTRACTOR_USER_TEMPLATE,
)
from app.schemas.llm import (
    LlmSettingsIn,
    LlmStatusOut,
    LlmTestIn,
    LlmTestOut,
    PromptSettingsIn,
    PromptSettingsOut,
)
from app.services import llm_settings
from app.services import prompt_settings

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/status", response_model=LlmStatusOut)
async def llm_status():
    s = await llm_settings.get_llm_status()
    return LlmStatusOut(
        provider=s.provider,
        base_url=s.base_url,
        default_model=s.default_model,
        active_model=s.active_model,
        key_source=s.key_source,
        has_user_key=s.has_user_key,
        user_key_masked=s.user_key_masked,
        user_model=s.user_model,
        can_edit_model=s.can_edit_model,
        is_configured=s.is_configured,
    )


@router.put("/settings", response_model=LlmStatusOut)
async def update_llm_settings(body: LlmSettingsIn):
    try:
        s = await llm_settings.save_user_llm_settings(
            api_key=body.api_key,
            model=body.model,
            clear_user_key=body.clear_user_key,
        )
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    except Exception as e:
        if "ENCRYPTION_KEY" in str(e):
            raise HTTPException(
                500,
                "ENCRYPTION_KEY не задан — нужен для сохранения вашего ключа в БД",
            ) from e
        raise HTTPException(500, "Не удалось сохранить настройки LLM") from e

    return LlmStatusOut(
        provider=s.provider,
        base_url=s.base_url,
        default_model=s.default_model,
        active_model=s.active_model,
        key_source=s.key_source,
        has_user_key=s.has_user_key,
        user_key_masked=s.user_key_masked,
        user_model=s.user_model,
        can_edit_model=s.can_edit_model,
        is_configured=s.is_configured,
    )


@router.get("/prompts", response_model=PromptSettingsOut)
async def get_prompts():
    cfg = await prompt_settings.get_prompt_config()
    using_defaults = (
        cfg.classifier_system == DEFAULT_CLASSIFIER_SYSTEM
        and cfg.extractor_system == DEFAULT_EXTRACTOR_SYSTEM
        and cfg.extractor_user_template == DEFAULT_EXTRACTOR_USER_TEMPLATE
    )
    return PromptSettingsOut(
        classifier_system=cfg.classifier_system,
        extractor_system=cfg.extractor_system,
        extractor_user_template=cfg.extractor_user_template,
        confidence_threshold=cfg.confidence_threshold,
        review_threshold=cfg.review_threshold,
        using_defaults=using_defaults,
    )


@router.put("/prompts", response_model=PromptSettingsOut)
async def update_prompts(body: PromptSettingsIn):
    cfg = await prompt_settings.save_prompt_config(
        classifier_system=body.classifier_system,
        extractor_system=body.extractor_system,
        extractor_user_template=body.extractor_user_template,
        confidence_threshold=body.confidence_threshold,
        review_threshold=body.review_threshold,
    )
    return PromptSettingsOut(
        classifier_system=cfg.classifier_system,
        extractor_system=cfg.extractor_system,
        extractor_user_template=cfg.extractor_user_template,
        confidence_threshold=cfg.confidence_threshold,
        review_threshold=cfg.review_threshold,
        using_defaults=False,
    )


@router.post("/prompts/reset", response_model=PromptSettingsOut)
async def reset_prompts():
    cfg = await prompt_settings.save_prompt_config(
        classifier_system=DEFAULT_CLASSIFIER_SYSTEM,
        extractor_system=DEFAULT_EXTRACTOR_SYSTEM,
        extractor_user_template=DEFAULT_EXTRACTOR_USER_TEMPLATE,
        confidence_threshold=0.75,
        review_threshold=0.5,
    )
    return PromptSettingsOut(
        classifier_system=cfg.classifier_system,
        extractor_system=cfg.extractor_system,
        extractor_user_template=cfg.extractor_user_template,
        confidence_threshold=cfg.confidence_threshold,
        review_threshold=cfg.review_threshold,
        using_defaults=True,
    )


@router.post("/test", response_model=LlmTestOut)
async def test_llm(body: LlmTestIn | None = None):
    body = body or LlmTestIn()
    result = await llm_settings.test_llm_connection(api_key=body.api_key, model=body.model)
    return LlmTestOut(
        success=result.success,
        message=result.message,
        model=result.model,
        key_source=result.key_source,
        latency_ms=result.latency_ms,
        reply_preview=result.reply_preview,
    )
