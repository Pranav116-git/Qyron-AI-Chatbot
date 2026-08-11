import re
import time
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Response, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, UserSettings, PasswordReset
from app.schemas import (
    RegisterRequest, LoginRequest, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, UpdateProfileRequest,
)
from app.auth import (
    hash_password, verify_password, create_session,
    get_current_user, logout_session, logout_all_sessions,
    generate_password_reset_token, hash_token, SESSION_COOKIE_NAME,
)
from app.config import SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD, EMAIL_FROM, AUTH_RATE_LIMIT, AUTH_RATE_WINDOW, ENVIRONMENT
from app.middleware.security import CSRF_COOKIE_NAME, generate_csrf_token, hash_csrf_token

import logging

logger = logging.getLogger(__name__)

router = APIRouter()

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

_auth_rate_limits: dict[str, list[float]] = {}


def _check_auth_rate_limit(ip: str, action: str) -> None:
    key = f"{ip}:{action}"
    now = time.time()
    if key not in _auth_rate_limits:
        _auth_rate_limits[key] = []

    _auth_rate_limits[key] = [
        t for t in _auth_rate_limits[key] if now - t < AUTH_RATE_WINDOW
    ]

    if len(_auth_rate_limits[key]) >= AUTH_RATE_LIMIT:
        logger.warning(f"Auth rate limit exceeded: {action} from {ip}")
        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Please try again in a few minutes."
        )

    _auth_rate_limits[key].append(now)


def _get_client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.get("/api/auth/csrf")
async def get_csrf(response: Response, request: Request):
    token_hash = request.cookies.get(CSRF_COOKIE_NAME)
    if not token_hash:
        raw_token = generate_csrf_token()
        token_hash = hash_csrf_token(raw_token)

    samesite_setting = "none" if ENVIRONMENT == "production" else "lax"
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=token_hash,
        httponly=False,
        secure=ENVIRONMENT == "production",
        samesite=samesite_setting,
        max_age=3600,
        path="/",
    )
    return {"csrf_token": token_hash}


@router.post("/api/auth/register", response_model=UserResponse)
async def register(
    request: RegisterRequest,
    req: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    ip = _get_client_ip(req)
    _check_auth_rate_limit(ip, "register")

    email = request.email.strip().lower()
    name = request.name.strip()

    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    result = await db.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user = User(
        email=email,
        password_hash=hash_password(request.password),
        name=name,
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    await db.flush()

    settings = UserSettings(user_id=user.id, theme="light")
    db.add(settings)
    await db.commit()
    await db.refresh(user)

    await create_session(db, user, response)

    logger.info(f"REGISTER user_id={user.id} email={email} ip={ip}")

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at.isoformat(),
        email_verified=user.email_verified,
    )


@router.post("/api/auth/login", response_model=UserResponse)
async def login(
    request: LoginRequest,
    req: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    ip = _get_client_ip(req)
    _check_auth_rate_limit(ip, "login")

    email = request.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        logger.warning(f"LOGIN_FAILED email={email} ip={ip}")
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user.is_active:
        logger.warning(f"LOGIN_INACTIVE email={email} ip={ip}")
        raise HTTPException(status_code=403, detail="This account has been deactivated.")

    await create_session(db, user, response)

    user.last_login_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(f"LOGIN user_id={user.id} email={email} ip={ip}")

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at.isoformat(),
        email_verified=user.email_verified,
    )


@router.post("/api/auth/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        await logout_session(db, token)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    logger.info(f"LOGOUT ip={_get_client_ip(request)}")
    return {"message": "Logged out"}


@router.post("/api/auth/logout-all")
async def logout_all(
    user: User = Depends(get_current_user),
    response: Response = Response(),
    db: AsyncSession = Depends(get_db),
):
    count = await logout_all_sessions(db, user.id)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    logger.info(f"LOGOUT_ALL user_id={user.id} sessions_revoked={count}")
    return {"message": "Logged out of all sessions"}


@router.get("/api/auth/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at.isoformat(),
        email_verified=user.email_verified,
    )


@router.post("/api/auth/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    req: Request,
    db: AsyncSession = Depends(get_db),
):
    ip = _get_client_ip(req)
    _check_auth_rate_limit(ip, "forgot-password")

    email = request.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        token = generate_password_reset_token()
        token_hashed = hash_token(token)
        now = datetime.now(timezone.utc)

        reset = PasswordReset(
            user_id=user.id,
            token_hash=token_hashed,
            expires_at=now + timedelta(hours=1),
            created_at=now,
        )
        db.add(reset)
        await db.commit()

        logger.info(f"FORGOT_PASSWORD user_id={user.id} ip={ip}")

        if SMTP_HOST and SMTP_USERNAME:
            try:
                import smtplib
                from email.mime.text import MIMEText

                msg = MIMEText(
                    f"Hello,\n\nYou requested a password reset for your Qyron account.\n\n"
                    f"Use this token to reset your password:\n\n{token}\n\n"
                    f"This token expires in 1 hour.\n\nIf you did not request this, "
                    f"you can safely ignore this email.\n\n- Qyron Team"
                )
                msg["Subject"] = "Qyron Password Reset"
                msg["From"] = EMAIL_FROM
                msg["To"] = email

                with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                    server.starttls()
                    server.login(SMTP_USERNAME, SMTP_PASSWORD)
                    server.send_message(msg)
            except Exception as e:
                logger.error(f"Failed to send password reset email: {e}")

    return {"message": "If an account exists for that email, a password reset link has been sent."}


@router.post("/api/auth/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    token_hashed = hash_token(request.token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(PasswordReset).where(
            PasswordReset.token_hash == token_hashed,
            PasswordReset.expires_at > now,
            PasswordReset.used_at.is_(None),
        )
    )
    reset = result.scalar_one_or_none()

    if not reset:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    if request.password != request.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    result = await db.execute(select(User).where(User.id == reset.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    user.password_hash = hash_password(request.password)
    reset.used_at = now

    await logout_all_sessions(db, user.id)
    await db.commit()

    logger.info(f"RESET_PASSWORD user_id={user.id}")

    return {"message": "Password has been reset successfully."}


@router.put("/api/auth/profile", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if request.name is not None:
        user.name = request.name.strip()
    await db.commit()
    await db.refresh(user)

    logger.info(f"PROFILE_UPDATE user_id={user.id}")

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at.isoformat(),
        email_verified=user.email_verified,
    )


@router.post("/api/auth/change-password")
async def change_password(
    request: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(request.current_password, user.password_hash):
        logger.warning(f"CHANGE_PASSWORD_FAILED user_id={user.id}")
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    if request.current_password == request.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password.")

    user.password_hash = hash_password(request.new_password)
    await db.commit()

    logger.info(f"CHANGE_PASSWORD user_id={user.id}")

    return {"message": "Password changed successfully."}


@router.delete("/api/auth/account")
async def delete_account(
    user: User = Depends(get_current_user),
    response: Response = Response(),
    db: AsyncSession = Depends(get_db),
):
    user_email = user.email
    user_id = user.id

    await logout_all_sessions(db, user.id)
    await db.delete(user)
    await db.commit()

    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")

    logger.info(f"ACCOUNT_DELETED user_id={user_id} email={user_email}")

    return {"message": "Account deleted successfully."}
