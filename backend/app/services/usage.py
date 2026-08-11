from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import UsageLog
from app.config import CHAT_RATE_LIMIT_PER_MINUTE, CHAT_DAILY_LIMIT

import time

_user_request_times: dict[str, list[float]] = {}


def check_rate_limit(user_id: str) -> None:
    now = time.time()
    if user_id not in _user_request_times:
        _user_request_times[user_id] = []

    _user_request_times[user_id] = [
        t for t in _user_request_times[user_id] if now - t < 60
    ]

    if len(_user_request_times[user_id]) >= CHAT_RATE_LIMIT_PER_MINUTE:
        raise Exception("rate_limit_minute")

    _user_request_times[user_id].append(now)


async def check_daily_limit(user_id: str, db: AsyncSession) -> None:
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    result = await db.execute(
        select(func.count(UsageLog.id)).where(
            UsageLog.user_id == user_id,
            UsageLog.timestamp >= today_start,
        )
    )
    daily_count = result.scalar() or 0
    if daily_count >= CHAT_DAILY_LIMIT:
        raise Exception("rate_limit_daily")


async def log_usage(user_id: str, model_used: str, db: AsyncSession, tokens_used: int = 0) -> None:
    log = UsageLog(
        user_id=user_id,
        model_used=model_used,
        tokens_used=tokens_used,
    )
    db.add(log)
    await db.flush()


async def get_usage_stats(user_id: str, db: AsyncSession) -> dict:
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=now.weekday())
    month_start = today_start.replace(day=1)

    today_result = await db.execute(
        select(func.count(UsageLog.id)).where(
            UsageLog.user_id == user_id,
            UsageLog.timestamp >= today_start,
        )
    )
    today_count = today_result.scalar() or 0

    week_result = await db.execute(
        select(func.count(UsageLog.id)).where(
            UsageLog.user_id == user_id,
            UsageLog.timestamp >= week_start,
        )
    )
    week_count = week_result.scalar() or 0

    month_result = await db.execute(
        select(func.count(UsageLog.id)).where(
            UsageLog.user_id == user_id,
            UsageLog.timestamp >= month_start,
        )
    )
    month_count = month_result.scalar() or 0

    total_result = await db.execute(
        select(func.count(UsageLog.id)).where(
            UsageLog.user_id == user_id,
        )
    )
    total_count = total_result.scalar() or 0

    tokens_result = await db.execute(
        select(func.coalesce(func.sum(UsageLog.tokens_used), 0)).where(
            UsageLog.user_id == user_id,
        )
    )
    total_tokens = tokens_result.scalar() or 0

    return {
        "today": {"count": today_count, "limit": CHAT_DAILY_LIMIT},
        "this_week": week_count,
        "this_month": month_count,
        "all_time": total_count,
        "total_tokens": total_tokens,
        "per_minute_limit": CHAT_RATE_LIMIT_PER_MINUTE,
    }
