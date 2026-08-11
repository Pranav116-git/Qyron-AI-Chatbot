from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, SavedPrompt
from app.schemas import SavedPromptResponse, SavePromptRequest, RenamePromptRequest
from app.auth import get_current_user

router = APIRouter()


@router.get("/api/saved-prompts", response_model=list[SavedPromptResponse])
async def list_saved_prompts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedPrompt).where(
            SavedPrompt.user_id == user.id,
        ).order_by(SavedPrompt.created_at.desc())
    )
    prompts = result.scalars().all()

    return [
        SavedPromptResponse(
            id=p.id,
            title=p.title,
            content=p.content,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
        )
        for p in prompts
    ]


@router.post("/api/saved-prompts", response_model=SavedPromptResponse)
async def create_saved_prompt(
    request: SavePromptRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    prompt = SavedPrompt(
        user_id=user.id,
        title=request.title.strip(),
        content=request.content.strip(),
        created_at=now,
        updated_at=now,
    )
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)

    return SavedPromptResponse(
        id=prompt.id,
        title=prompt.title,
        content=prompt.content,
        created_at=prompt.created_at.isoformat(),
        updated_at=prompt.updated_at.isoformat(),
    )


@router.put("/api/saved-prompts/{prompt_id}", response_model=SavedPromptResponse)
async def update_saved_prompt(
    prompt_id: str,
    request: RenamePromptRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedPrompt).where(
            SavedPrompt.id == prompt_id,
            SavedPrompt.user_id == user.id,
        )
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Saved prompt not found.")

    prompt.title = request.title.strip()
    prompt.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(prompt)

    return SavedPromptResponse(
        id=prompt.id,
        title=prompt.title,
        content=prompt.content,
        created_at=prompt.created_at.isoformat(),
        updated_at=prompt.updated_at.isoformat(),
    )


@router.delete("/api/saved-prompts/{prompt_id}")
async def delete_saved_prompt(
    prompt_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SavedPrompt).where(
            SavedPrompt.id == prompt_id,
            SavedPrompt.user_id == user.id,
        )
    )
    prompt = result.scalar_one_or_none()

    if not prompt:
        raise HTTPException(status_code=404, detail="Saved prompt not found.")

    await db.delete(prompt)
    await db.commit()

    return {"message": "Saved prompt deleted."}
