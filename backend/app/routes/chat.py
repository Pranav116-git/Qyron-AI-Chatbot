from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Conversation, Message
from app.schemas import ChatRequest, ChatResponse
from app.services.openrouter import get_ai_response
from app.services.usage import check_rate_limit, check_daily_limit, log_usage
from app.auth import get_current_user
from app.config import OPENROUTER_MODEL

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _generate_title(first_message: str) -> str:
    cleaned = first_message.replace("\n", " ").strip()
    cleaned = " ".join(cleaned.split())
    if len(cleaned) <= 40:
        return cleaned
    return cleaned[:40].rstrip() + "..."


@router.post("/api/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        check_rate_limit(user.id)
    except Exception as e:
        if str(e) == "rate_limit_minute":
            raise HTTPException(
                status_code=429,
                detail="You're sending messages too quickly. Please wait a moment."
            )
        raise

    try:
        await check_daily_limit(user.id, db)
    except Exception as e:
        if str(e) == "rate_limit_daily":
            raise HTTPException(
                status_code=429,
                detail="You've reached your daily message limit. Please try again tomorrow."
            )
        raise

    conversation = None
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == user.id,
            )
        )
        conversation = result.scalar_one_or_none()

    if not conversation:
        first_user_msg = next(
            (m.content for m in request.messages if m.role == "user"),
            "New Conversation"
        )
        title = _generate_title(first_user_msg)
        now = datetime.now(timezone.utc)
        conversation = Conversation(
            user_id=user.id,
            title=title,
            created_at=now,
            updated_at=now,
        )
        db.add(conversation)
        await db.flush()

    for msg in request.messages:
        message = Message(
            conversation_id=conversation.id,
            role=msg.role,
            content=msg.content,
            created_at=datetime.now(timezone.utc),
        )
        db.add(message)

    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()

    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        response = await get_ai_response(messages)

        await log_usage(user.id, OPENROUTER_MODEL, db)

        ai_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=response,
            created_at=datetime.now(timezone.utc),
        )
        db.add(ai_message)
        conversation.updated_at = datetime.now(timezone.utc)
        await db.commit()

        return ChatResponse(response=response, conversation_id=conversation.id)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"OpenRouter error: {e}")
        raise HTTPException(
            status_code=502,
            detail="Qyron couldn't generate a response right now. Please try again."
        )
