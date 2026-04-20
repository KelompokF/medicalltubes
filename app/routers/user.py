from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.routers.auth import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, LocationSharingUpdate

router = APIRouter(prefix="/users", tags=["Users"])

@router.patch("/me/location-sharing", response_model=UserResponse)
async def toggle_location_sharing(
    update_data: LocationSharingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mengaktifkan atau menonaktifkan fitur pengiriman lokasi otomatis.
    """
    current_user.location_sharing_enabled = update_data.enabled
    
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user
