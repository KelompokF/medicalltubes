from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime, date
from typing import Optional

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
    # Profile fields (optional)
    place_of_birth: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    # Accessibility
    high_contrast_enabled: bool = False
    contrast_mode: str = "normal"
    large_text_enabled: bool = False
    color_blind_enabled: bool = False

    class Config:
        from_attributes = True

class AccessibilityUpdate(BaseModel):
    high_contrast_enabled: Optional[bool] = None
    contrast_mode: Optional[str] = None
    large_text_enabled: Optional[bool] = None
    color_blind_enabled: Optional[bool] = None

class LocationSharingUpdate(BaseModel):
    enabled: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"