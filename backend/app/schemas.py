from pydantic import BaseModel, Field, EmailStr
from typing import List, Literal, Optional


class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=255)
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    email: str
    username: str


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
