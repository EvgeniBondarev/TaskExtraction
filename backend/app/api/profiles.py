import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.models.entities import TelegramProfile

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/{user_id}/avatar")
async def profile_avatar(user_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(TelegramProfile).where(TelegramProfile.telegram_user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile or not profile.photo_path or not os.path.isfile(profile.photo_path):
        raise HTTPException(404, "Avatar not found")
    return FileResponse(profile.photo_path, media_type="image/jpeg")
