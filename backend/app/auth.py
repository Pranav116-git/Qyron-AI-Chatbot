import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Response, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.database import get_db
from app.config import SESSION_SECRET, ENVIRONMENT
from app.models import User, UserSession

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

SESSION_COOKIE_NAME = "qyron_session"
SESSION_DURATION_HOURS = 72


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_session_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_password_reset_token() -> str:
    return secrets.token_urlsafe(32)


def generate_email_verification_token() -> str:
    return secrets.token_urlsafe(32)


def get_cookie_domain() -> Optional[str]:
    if ENVIRONMENT == "production":
        return None
    return None


async def create_session(db: AsyncSession, user: User, response: Response) -> UserSession:
    token = generate_session_token()
    token_hashed = hash_token(token)
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=SESSION_DURATION_HOURS)

    session = UserSession(
        user_id=user.id,
        token_hash=token_hashed,
        created_at=now,
        expires_at=expires_at,
        last_used_at=now,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    is_secure = ENVIRONMENT == "production"
    samesite_setting = "none" if is_secure else "lax"
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=is_secure,
        samesite=samesite_setting,
        max_age=SESSION_DURATION_HOURS * 3600,
        path="/",
    )

    return session


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token_hashed = hash_token(token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(UserSession).where(
            UserSession.token_hash == token_hashed,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > now,
        )
    )
    session = result.scalar_one_or_none()

    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    session.last_used_at = now
    await db.commit()

    result = await db.execute(select(User).where(User.id == session.user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Account not found or inactive")

    return user


async def logout_session(db: AsyncSession, token: str) -> bool:
    token_hashed = hash_token(token)
    result = await db.execute(
        select(UserSession).where(UserSession.token_hash == token_hashed)
    )
    session = result.scalar_one_or_none()
    if session:
        session.revoked_at = datetime.now(timezone.utc)
        await db.commit()
        return True
    return False


async def logout_all_sessions(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
        )
    )
    sessions = result.scalars().all()
    now = datetime.now(timezone.utc)
    count = 0
    for session in sessions:
        session.revoked_at = now
        count += 1
    await db.commit()
    return count
