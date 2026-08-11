from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=50000)


class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., min_length=1, max_length=200)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    archived_at: Optional[str] = None


class ConversationDetailResponse(BaseModel):
    id: str
    title: str
    messages: List[MessageResponse]
    created_at: str
    updated_at: str
    archived_at: Optional[str] = None


class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
