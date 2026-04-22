from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID
from app.dependencies import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.emergency import Emergency
from app.schemas.emergency import EmergencyCreate, EmergencyResponse, EmergencyStatusUpdate

router = APIRouter(prefix="/emergencies", tags=["Emergencies"])

@router.post("/", response_model=EmergencyResponse, status_code=status.HTTP_201_CREATED)
async def request_emergency(
    emergency_in: EmergencyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Request emergency assistance with automatic location.
    """
    new_emergency = Emergency(
        user_id=current_user.id,
        latitude=emergency_in.latitude,
        longitude=emergency_in.longitude,
        type=emergency_in.type,
    )
    db.add(new_emergency)
    await db.commit()
    await db.refresh(new_emergency)
    return new_emergency

@router.get("/", response_model=List[EmergencyResponse])
async def get_emergencies(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get user's emergency requests.
    """
    result = await db.execute(
        select(Emergency).where(Emergency.user_id == current_user.id).offset(skip).limit(limit)
    )
    emergencies = result.scalars().all()
    return emergencies

@router.get("/{emergency_id}", response_model=EmergencyResponse)
async def get_emergency(
    emergency_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get specific emergency request.
    """
    result = await db.execute(select(Emergency).where(Emergency.id == emergency_id))
    emergency = result.scalar_one_or_none()
    if not emergency or emergency.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    return emergency

@router.patch("/{emergency_id}/status", response_model=EmergencyResponse)
async def update_emergency_status(
    emergency_id: UUID,
    status_update: EmergencyStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update emergency status (for ambulance/admin).
    """
    result = await db.execute(select(Emergency).where(Emergency.id == emergency_id))
    emergency = result.scalar_one_or_none()
    if not emergency:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    emergency.status = status_update.status
    await db.commit()
    await db.refresh(emergency)
    return emergency
