from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, LocationSharingUpdate, AccessibilityUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.patch("/me/location-sharing", response_model=UserResponse)
async def toggle_location_sharing(
    update_data: LocationSharingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mengaktifkan atau menonaktifkan fitur pengiriman lokasi otomatis."""
    current_user.location_sharing_enabled = update_data.enabled

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return current_user

@router.patch("/me/accessibility", response_model=UserResponse)
async def update_accessibility(
    update_data: AccessibilityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Memperbarui pengaturan aksesibilitas pasien."""
    if update_data.high_contrast_enabled is not None:
        current_user.high_contrast_enabled = update_data.high_contrast_enabled
    if update_data.contrast_mode is not None:
        current_user.contrast_mode = update_data.contrast_mode
    if update_data.large_text_enabled is not None:
        current_user.large_text_enabled = update_data.large_text_enabled
    if update_data.color_blind_enabled is not None:
        current_user.color_blind_enabled = update_data.color_blind_enabled

    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)

    return current_user
