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

    class Config:
        from_attributes = True

class LocationSharingUpdate(BaseModel):
    enabled: bool

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class LocationSettingUpdate(BaseModel):
    is_location_enabled: bool

    class Config:
        orm_mode = True

class DeleteAccountResponse(BaseModel):
    message: str