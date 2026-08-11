from pydantic import BaseModel, Field, EmailStr
from typing import List, Literal, Optional
from datetime import datetime


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=50000)


class ChatRequest(BaseModel):
    messages: List[Message] = Field(..., min_length=1, max_length=200)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str] = None


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=1, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(..., min_length=1, max_length=255)


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: str
    email_verified: bool


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


class SavedPromptResponse(BaseModel):
    id: str
    title: str
    content: str
    created_at: str
    updated_at: str


class SettingsResponse(BaseModel):
    theme: str


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class UpdateSettingsRequest(BaseModel):
    theme: Optional[str] = Field(None, pattern="^(light|dark)$")


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=1, max_length=128)


class SavePromptRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1, max_length=10000)


class RenamePromptRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)


class RenameConversationRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
