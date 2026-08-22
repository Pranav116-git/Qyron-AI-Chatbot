from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Conversation, Message, User
from app.schemas import ChatRequest, ChatResponse
from app.services.openrouter import get_ai_response
from app.services.auth import get_current_user

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
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = None
    if request.conversation_id:
        result = await db.execute(
            select(Conversation).where(
                and_(
                    Conversation.id == request.conversation_id,
                    Conversation.user_id == current_user.id,
                )
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
            user_id=current_user.id,
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
