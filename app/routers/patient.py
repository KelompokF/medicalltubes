from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.patient_profile import PatientProfile
from app.schemas.patient_profile import PatientProfileCreateUpdate, PatientProfileResponse

router = APIRouter(prefix="/patient", tags=["Patient"])


@router.get("/profile", response_model=PatientProfileResponse)
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if profile:
        return profile
    # if no profile yet, return basic info (create a virtual response)
    return PatientProfileResponse(
        id=current_user.id,
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        place_of_birth=None,
        date_of_birth=None,
        blood_type=None,
        allergies=None,
        created_at=current_user.created_at,
    )


@router.put("/profile", response_model=PatientProfileResponse)
async def update_profile(payload: PatientProfileCreateUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PatientProfile).where(PatientProfile.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if not profile:
        profile = PatientProfile(
            user_id=current_user.id,
            full_name=payload.full_name,
            email=payload.email,
            place_of_birth=payload.place_of_birth,
            date_of_birth=payload.date_of_birth,
            blood_type=payload.blood_type,
            allergies=payload.allergies,
        )
        current_user.full_name = payload.full_name
        db.add(profile)
        db.add(current_user)
        await db.commit()
        await db.refresh(profile)
        return profile

    # update existing profile
    profile.full_name = payload.full_name
    profile.email = payload.email
    profile.place_of_birth = payload.place_of_birth
    profile.date_of_birth = payload.date_of_birth
    profile.blood_type = payload.blood_type
    profile.allergies = payload.allergies

    current_user.full_name = payload.full_name

    db.add(profile)
    db.add(current_user)
    await db.commit()
    await db.refresh(profile)
    return profile
