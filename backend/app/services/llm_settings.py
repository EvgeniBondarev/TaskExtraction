import logging
from dataclasses import dataclass
from typing import Literal

import httpx
from sqlalchemy import select

from app.database import async_session_factory
from app.models.entities import LlmConfig
from app.secrets.builtin_openrouter import (
    DEFAULT_MODEL,
    OPENROUTER_BASE_URL,
    PROVIDER_NAME,
    get_builtin_openrouter_api_key,
)
from app.utils.crypto import decrypt_str, encrypt_str

logger = logging.getLogger(__name__)

CONFIG_ID = 1


@dataclass
class EffectiveLlmConfig:
    api_key: str
    model: str
    base_url: str
    source: Literal["builtin", "user"]


@dataclass
class LlmStatus:
    provider: str
    base_url: str
    default_model: str
    active_model: str
    key_source: Literal["builtin", "user"]
    has_user_key: bool
    user_key_masked: str | None
    user_model: str | None
    can_edit_model: bool
    is_configured: bool


def mask_api_key(api_key: str) -> str:
    if len(api_key) <= 12:
        return "****"
    return api_key[:8] + "****" + api_key[-4:]


async def _get_row() -> LlmConfig | None:
    async with async_session_factory() as session:
        result = await session.execute(select(LlmConfig).where(LlmConfig.id == CONFIG_ID))
        return result.scalar_one_or_none()


async def get_effective_llm_config() -> EffectiveLlmConfig:
    row = await _get_row()
    if row and row.user_api_key_encrypted:
        try:
            api_key = decrypt_str(row.user_api_key_encrypted)
        except ValueError:
            logger.warning("User LLM key decrypt failed; falling back to built-in OpenRouter key")
            api_key = get_builtin_openrouter_api_key()
            return EffectiveLlmConfig(
                api_key=api_key,
                model=DEFAULT_MODEL,
                base_url=OPENROUTER_BASE_URL,
                source="builtin",
            )
        model = (row.user_model or "").strip() or DEFAULT_MODEL
        return EffectiveLlmConfig(
            api_key=api_key,
            model=model,
            base_url=OPENROUTER_BASE_URL,
            source="user",
        )

    return EffectiveLlmConfig(
        api_key=get_builtin_openrouter_api_key(),
        model=DEFAULT_MODEL,
        base_url=OPENROUTER_BASE_URL,
        source="builtin",
    )


async def get_llm_status() -> LlmStatus:
    effective = await get_effective_llm_config()
    row = await _get_row()
    has_user_key = bool(row and row.user_api_key_encrypted)
    user_key_masked = None
    if has_user_key and row:
        try:
            user_key_masked = mask_api_key(decrypt_str(row.user_api_key_encrypted))
        except ValueError:
            has_user_key = False

    return LlmStatus(
        provider=PROVIDER_NAME,
        base_url=OPENROUTER_BASE_URL,
        default_model=DEFAULT_MODEL,
        active_model=effective.model,
        key_source=effective.source,
        has_user_key=has_user_key,
        user_key_masked=user_key_masked,
        user_model=row.user_model if row and has_user_key else None,
        can_edit_model=has_user_key,
        is_configured=True,
    )


async def save_user_llm_settings(
    api_key: str | None = None,
    model: str | None = None,
    clear_user_key: bool = False,
) -> LlmStatus:
    model = (model or "").strip() or None

    if model and not api_key and not clear_user_key:
        row = await _get_row()
        if not (row and row.user_api_key_encrypted):
            raise ValueError("Свою модель можно указать только вместе с вашим API-ключом")

    async with async_session_factory() as session:
        result = await session.execute(select(LlmConfig).where(LlmConfig.id == CONFIG_ID))
        row = result.scalar_one_or_none()
        if not row:
            row = LlmConfig(id=CONFIG_ID)
            session.add(row)

        if clear_user_key:
            row.user_api_key_encrypted = None
            row.user_model = None
        else:
            if api_key is not None and api_key.strip():
                row.user_api_key_encrypted = encrypt_str(api_key.strip())
            if row.user_api_key_encrypted:
                if model is not None:
                    row.user_model = model
            elif model:
                raise ValueError("Свою модель можно указать только вместе с вашим API-ключом")

        await session.commit()

    return await get_llm_status()


@dataclass
class LlmTestResult:
    success: bool
    message: str
    model: str
    key_source: Literal["builtin", "user"]
    latency_ms: int | None
    reply_preview: str | None


async def resolve_test_config(
    api_key: str | None = None,
    model: str | None = None,
) -> EffectiveLlmConfig:
    """Config for test: optional unsaved draft key/model from the settings form."""
    api_key = (api_key or "").strip() or None
    model = (model or "").strip() or None

    if api_key:
        return EffectiveLlmConfig(
            api_key=api_key,
            model=model or DEFAULT_MODEL,
            base_url=OPENROUTER_BASE_URL,
            source="user",
        )

    effective = await get_effective_llm_config()
    if model:
        if effective.source != "user":
            raise ValueError("Свою модель можно указать только вместе с вашим API-ключом")
        return EffectiveLlmConfig(
            api_key=effective.api_key,
            model=model,
            base_url=effective.base_url,
            source="user",
        )
    return effective


async def test_llm_connection(
    api_key: str | None = None,
    model: str | None = None,
) -> LlmTestResult:
    from app.services.openrouter import chat_completion

    try:
        config = await resolve_test_config(api_key, model)
    except ValueError as e:
        return LlmTestResult(
            success=False,
            message=str(e),
            model=model or DEFAULT_MODEL,
            key_source="builtin",
            latency_ms=None,
            reply_preview=None,
        )

    test_messages = [
        {
            "role": "user",
            "content": (
                'Ответь одним коротким JSON без markdown: {"status":"ok","message":"pong"}'
            ),
        }
    ]

    try:
        result = await chat_completion(config, test_messages, max_tokens=64, json_mode=True)
        preview = (result.content or "").strip()[:200]
        return LlmTestResult(
            success=True,
            message="Подключение к OpenRouter успешно",
            model=config.model,
            key_source=config.source,
            latency_ms=result.latency_ms,
            reply_preview=preview or None,
        )
    except httpx.HTTPStatusError as e:
        detail = str(e.args[0]) if e.args else "Ошибка OpenRouter"
        return LlmTestResult(
            success=False,
            message=detail,
            model=config.model,
            key_source=config.source,
            latency_ms=None,
            reply_preview=None,
        )
    except Exception:
        logger.exception("LLM test failed model=%s key_source=%s", config.model, config.source)
        return LlmTestResult(
            success=False,
            message="Не удалось связаться с OpenRouter",
            model=config.model,
            key_source=config.source,
            latency_ms=None,
            reply_preview=None,
        )
