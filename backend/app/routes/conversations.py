from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Conversation, Message, User
from app.schemas import (
    ConversationResponse, ConversationDetailResponse,
    RenameConversationRequest,
)
from app.services.auth import get_current_user

router = APIRouter()


@router.get("/api/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.user_id == current_user.id,
                Conversation.archived_at.is_(None),
            )
        ).order_by(Conversation.updated_at.desc())
    )
    conversations = result.scalars().all()

    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
            archived_at=c.archived_at.isoformat() if c.archived_at else None,
        )
        for c in conversations
    ]


@router.get("/api/conversations/archived", response_model=list[ConversationResponse])
async def list_archived_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.user_id == current_user.id,
                Conversation.archived_at.isnot(None),
            )
        ).order_by(Conversation.archived_at.desc())
    )
    conversations = result.scalars().all()

    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
            archived_at=c.archived_at.isoformat() if c.archived_at else None,
        )
        for c in conversations
    ]


@router.get("/api/conversations/search", response_model=list[ConversationResponse])
async def search_conversations(
    q: str = Query(..., min_length=1, max_length=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    search_term = f"%{q}%"
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.user_id == current_user.id,
                Conversation.archived_at.is_(None),
                Conversation.title.ilike(search_term),
            )
        ).order_by(Conversation.updated_at.desc()).limit(20)
    )
    conversations = result.scalars().all()

    return [
        ConversationResponse(
            id=c.id,
            title=c.title,
            created_at=c.created_at.isoformat(),
            updated_at=c.updated_at.isoformat(),
            archived_at=c.archived_at.isoformat() if c.archived_at else None,
        )
        for c in conversations
    ]


@router.post("/api/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation(
    title: str = "New Conversation",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    conversation = Conversation(
        user_id=current_user.id,
        title=title,
        created_at=now,
        updated_at=now,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        archived_at=None,
    )


@router.get("/api/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    result = await db.execute(
        select(Message).where(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at)
    )
    messages = result.scalars().all()

    return ConversationDetailResponse(
        id=conversation.id,
        title=conversation.title,
        messages=[
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        archived_at=conversation.archived_at.isoformat() if conversation.archived_at else None,
    )


@router.put("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    request: RenameConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    conversation.title = request.title.strip()
    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        archived_at=conversation.archived_at.isoformat() if conversation.archived_at else None,
    )


@router.post("/api/conversations/{conversation_id}/archive", response_model=ConversationResponse)
async def archive_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    conversation.archived_at = datetime.now(timezone.utc)
    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        archived_at=conversation.archived_at.isoformat(),
    )


@router.post("/api/conversations/{conversation_id}/unarchive", response_model=ConversationResponse)
async def unarchive_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    conversation.archived_at = None
    conversation.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conversation)

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        created_at=conversation.created_at.isoformat(),
        updated_at=conversation.updated_at.isoformat(),
        archived_at=None,
    )


@router.delete("/api/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
    )
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    await db.delete(conversation)
    await db.commit()

    return {"message": "Conversation deleted."}
