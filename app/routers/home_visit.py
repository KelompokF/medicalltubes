from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.home_visit import HomeVisit, HomeVisitRequest, HomeVisitStatus
from app.schemas.home_visit import (
    HomeVisitCreate,
    HomeVisitResponse,
    HomeVisitTrackingResponse,
    HomeVisitRequestCreate,
    HomeVisitRequestResponse,
)

router = APIRouter(prefix="/home-visits", tags=["Home Visits"])


# ========================
# CREATE REQUEST (PUNYA KAMU)
# ========================
@router.post("/request", response_model=HomeVisitRequestResponse)
async def create_home_visit_request(
    payload: HomeVisitRequestCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = current_user.id if current_user else None

    new_request = HomeVisitRequest(
        user_id=user_id,
        doctor_id=payload.doctor_id,
        patient_name=payload.patient_name,
        address=payload.address,
        phone_number=payload.phone_number,
        complaint=payload.complaint,
        preferred_date=payload.preferred_date,
        preferred_time=payload.preferred_time,
    )

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    return new_request


# ========================
# CREATE BOOKING (FITUR BARU)
# ========================
@router.post("/", response_model=HomeVisitResponse)
async def create_home_visit(
    data: HomeVisitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    visit = HomeVisit(
        patient_id=current_user.id,
        doctor_id=data.doctor_id,
        doctor_name=data.doctor_name,
        specialization=data.specialization,
        date=data.date,
        time=data.time,
        address=data.address,
        notes=data.notes,
        status=HomeVisitStatus.pending,
    )

    db.add(visit)
    await db.commit()
    await db.refresh(visit)
    return visit


# ========================
# GET LIST
# ========================
@router.get("/", response_model=List[HomeVisitResponse])
async def get_home_visits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HomeVisit)
        .where(HomeVisit.patient_id == current_user.id)
        .order_by(HomeVisit.created_at.desc())
    )
    return result.scalars().all()


# ========================
# TRACKING
# ========================
@router.get("/{visit_id}/track", response_model=HomeVisitTrackingResponse)
async def track_home_visit(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(HomeVisit).where(
            HomeVisit.id == visit_id,
            HomeVisit.patient_id == current_user.id,
        )
    )
    visit = result.scalar_one_or_none()

    if not visit:
        raise HTTPException(status_code=404, detail="Not found")

    status_order = ["pending", "confirmed", "on_the_way", "arrived", "completed"]
    current_idx = status_order.index(visit.status.value)

    steps = []
    for i, s in enumerate(status_order):
        steps.append({
            "key": s,
            "status": "done" if i < current_idx else "current" if i == current_idx else "upcoming"
        })

    return {
        "id": visit.id,
        "doctor_name": visit.doctor_name,
        "specialization": visit.specialization,
        "date": visit.date,
        "time": visit.time,
        "address": visit.address,
        "notes": visit.notes,
        "status": visit.status.value,
        "steps": steps,
    }