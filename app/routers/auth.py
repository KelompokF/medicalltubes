from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID as PyUUID

from app.database import get_db
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token, LocationSettingUpdate, DeleteAccountResponse
from app.schemas.location import LocationSettingResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Daftarkan user baru."""
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password)
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user

@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login dan dapatkan JWT access token."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning(f"LOGIN DEBUG: No user found for email={data.email}")
        raise HTTPException(status_code=401, detail="Email atau password salah")
        
    logger.warning(f"LOGIN DEBUG: User found: email={user.email}, role={user.role}, hash_prefix={user.hashed_password[:20] if user.hashed_password else 'NONE'}")
    
    if not verify_password(data.password, user.hashed_password):
        logger.warning(f"LOGIN DEBUG: Password verification FAILED for email={data.email}")
        raise HTTPException(status_code=401, detail="Wrong Password or Email")
        
    if getattr(user, 'is_deleted', False):
        raise HTTPException(status_code=403, detail="Akun telah dihapus")

    token = create_access_token({"sub": str(user.id), "role": getattr(user, 'role', 'patient')})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Dapatkan informasi user yang sedang login."""
    return current_user

@router.put("/location-setting", response_model=LocationSettingResponse)
async def update_location_setting(
    payload: LocationSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.location_sharing_enabled = payload.is_location_enabled

    await db.commit()
    await db.refresh(current_user)
    
    # Map back to expected response structure
    return {"is_location_enabled": current_user.location_sharing_enabled}

@router.get("/location-setting", response_model=LocationSettingResponse)
async def get_location_setting(
    current_user: User = Depends(get_current_user)
):
    return {"is_location_enabled": current_user.location_sharing_enabled}

@router.delete("/delete-account", response_model=DeleteAccountResponse)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Perform hard delete
    await db.delete(current_user)
    await db.commit()

    return {"message": "Akun berhasil dihapus total"}

from pydantic import BaseModel
from app.dependencies import get_current_user

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/change-password")
async def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    db.add(current_user)
    await db.commit()
    return {"detail": "Password updated successfully"}
