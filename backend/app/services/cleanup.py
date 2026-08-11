from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session
from app.models import UserSession, PasswordReset, EmailVerification
import logging

logger = logging.getLogger(__name__)


async def cleanup_expired_sessions():
    async with async_session() as db:
        try:
            now = datetime.now(timezone.utc)
            result = await db.execute(
                delete(UserSession).where(
                    UserSession.expires_at < now
                )
            )
            expired_count = result.rowcount

            result = await db.execute(
                delete(PasswordReset).where(
                    PasswordReset.expires_at < now
                )
            )
            expired_resets = result.rowcount

            result = await db.execute(
                delete(EmailVerification).where(
                    EmailVerification.expires_at < now
                )
            )
            expired_verifications = result.rowcount

            await db.commit()

            total = expired_count + expired_resets + expired_verifications
            if total > 0:
                logger.info(
                    f"Cleaned up {expired_count} expired sessions, "
                    f"{expired_resets} expired password resets, "
                    f"{expired_verifications} expired email verifications"
                )
        except Exception as e:
            logger.error(f"Session cleanup error: {e}")
