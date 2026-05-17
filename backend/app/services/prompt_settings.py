from dataclasses import dataclass

from sqlalchemy import select

from app.tenancy.registry import tenant_session
from app.extraction.prompts import (
    DEFAULT_CLASSIFIER_SYSTEM,
    DEFAULT_EXTRACTOR_SYSTEM,
    DEFAULT_EXTRACTOR_USER_TEMPLATE,
)
from app.models.entities import LlmConfig

CONFIG_ID = 1


@dataclass
class PromptConfig:
    classifier_system: str
    extractor_system: str
    extractor_user_template: str
    confidence_threshold: float
    review_threshold: float


async def get_prompt_config() -> PromptConfig:
    async with tenant_session() as session:
        result = await session.execute(select(LlmConfig).where(LlmConfig.id == CONFIG_ID))
        row = result.scalar_one_or_none()

    if not row:
        return PromptConfig(
            classifier_system=DEFAULT_CLASSIFIER_SYSTEM,
            extractor_system=DEFAULT_EXTRACTOR_SYSTEM,
            extractor_user_template=DEFAULT_EXTRACTOR_USER_TEMPLATE,
            confidence_threshold=0.75,
            review_threshold=0.5,
        )

    return PromptConfig(
        classifier_system=row.classifier_system_prompt or DEFAULT_CLASSIFIER_SYSTEM,
        extractor_system=row.extractor_system_prompt or DEFAULT_EXTRACTOR_SYSTEM,
        extractor_user_template=row.extractor_user_template or DEFAULT_EXTRACTOR_USER_TEMPLATE,
        confidence_threshold=row.confidence_threshold if row.confidence_threshold is not None else 0.75,
        review_threshold=row.review_threshold if row.review_threshold is not None else 0.5,
    )


async def save_prompt_config(
    *,
    classifier_system: str | None = None,
    extractor_system: str | None = None,
    extractor_user_template: str | None = None,
    confidence_threshold: float | None = None,
    review_threshold: float | None = None,
) -> PromptConfig:
    async with tenant_session() as session:
        result = await session.execute(select(LlmConfig).where(LlmConfig.id == CONFIG_ID))
        row = result.scalar_one_or_none()
        if not row:
            row = LlmConfig(id=CONFIG_ID)
            session.add(row)

        if classifier_system is not None:
            row.classifier_system_prompt = classifier_system.strip() or None
        if extractor_system is not None:
            row.extractor_system_prompt = extractor_system.strip() or None
        if extractor_user_template is not None:
            row.extractor_user_template = extractor_user_template.strip() or None
        if confidence_threshold is not None:
            row.confidence_threshold = confidence_threshold
        if review_threshold is not None:
            row.review_threshold = review_threshold

        await session.commit()

    return await get_prompt_config()
