from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import SettingsResponse, UpdateSettingsRequest
from app.auth import get_current_user
from app.models import UserSettings
from sqlalchemy import select

router = APIRouter()


@router.get("/api/settings", response_model=SettingsResponse)
async def get_settings(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user.id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = UserSettings(user_id=user.id, theme="light")
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return SettingsResponse(theme=settings.theme)


@router.put("/api/settings", response_model=SettingsResponse)
async def update_settings(
    request: UpdateSettingsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user.id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = UserSettings(user_id=user.id, theme="light")
        db.add(settings)

    if request.theme is not None:
        settings.theme = request.theme

    await db.commit()
    await db.refresh(settings)

    return SettingsResponse(theme=settings.theme)
