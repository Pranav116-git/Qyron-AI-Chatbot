from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.schemas import RegisterRequest, LoginRequest, GoogleLoginRequest, AuthResponse, UserResponse
from app.services.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)
from app.config import GOOGLE_CLIENT_ID

router = APIRouter()


@router.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    email = request.email.strip().lower()
    username = request.username.strip()

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    existing = await db.execute(select(User).where(User.username == username))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )

    user = User(
        email=email,
        username=username,
        hashed_password=hash_password(request.password),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, username=user.username, auth_provider=user.auth_provider),
    )


@router.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    email = request.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled.",
        )

    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, username=user.username, auth_provider=user.auth_provider),
    )


@router.post("/api/auth/google", response_model=AuthResponse)
async def google_login(request: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    if not GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication is not configured.",
        )

    try:
        id_info = google_id_token.verify_oauth2_token(
            request.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authentication token.",
        )

    google_user_id = id_info.get("sub")
    email = id_info.get("email", "").strip().lower()
    name = id_info.get("name", "")

    if not google_user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not verify Google identity.",
        )

    result = await db.execute(select(User).where(User.google_id == google_user_id))
    user = result.scalar_one_or_none()

    if not user:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            user.google_id = google_user_id
            user.auth_provider = "google"
            if not user.hashed_password:
                user.hashed_password = None
        else:
            username = email.split("@")[0]
            base_username = username
            counter = 1
            while True:
                existing = await db.execute(select(User).where(User.username == username))
                if not existing.scalar_one_or_none():
                    break
                username = f"{base_username}{counter}"
                counter += 1

            user = User(
                email=email,
                username=username,
                google_id=google_user_id,
                auth_provider="google",
                hashed_password=None,
            )
            db.add(user)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, username=user.username, auth_provider=user.auth_provider),
    )


@router.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        auth_provider=current_user.auth_provider,
    )
