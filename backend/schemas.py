from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    pass

class ChatMessage(MessageBase):
    id: int
    role: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatRoomBase(BaseModel):
    title: str

class ChatRoomCreate(ChatRoomBase):
    pass

class ChatRoom(ChatRoomBase):
    id: int
    user_id: int
    created_at: datetime
    messages: List[ChatMessage] = []

    class Config:
        from_attributes = True

class ImageMetadata(BaseModel):
    id: int
    prompt: str
    url: str
    created_at: datetime

    class Config:
        from_attributes = True
