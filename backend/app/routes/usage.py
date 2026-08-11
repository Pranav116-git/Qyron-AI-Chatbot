from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.services.usage import get_usage_stats

router = APIRouter()


@router.get("/api/usage/stats")
async def usage_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stats = await get_usage_stats(user.id, db)
    return stats
