from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    is_active: bool
    role: str
    location_sharing_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LocationSharingUpdate(BaseModel):
    enabled: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"