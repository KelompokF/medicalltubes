# app/routers/home_visit.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime

from app.database import get_db
from app.dependencies import get_current_user
from app.models.home_visit import HomeVisit, HomeVisitStatus
from app.models.user import User
from app.schemas.home_visit import HomeVisitCreate, HomeVisitResponse, HomeVisitTrackingResponse

router = APIRouter(prefix="/home-visits", tags=["Home Visits"])


@router.post("/", response_model=HomeVisitResponse, status_code=status.HTTP_201_CREATED)
async def create_home_visit(
    data: HomeVisitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Buat booking home visit baru."""
    visit = HomeVisit(
        patient_id=current_user.id,
        doctor_id=data.doctor_id if data.doctor_id else None,
        doctor_name=data.doctor_name,
        specialization=data.specialization,
        date=data.date,
        time=data.time,
        address=data.address,
        notes=data.notes,
        status=HomeVisitStatus.pending.value,
    )
    db.add(visit)
    await db.commit()
    await db.refresh(visit)
    return visit


@router.get("/", response_model=List[HomeVisitResponse])
async def get_my_home_visits(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ambil semua home visit milik user yang login."""
    result = await db.execute(
        select(HomeVisit)
        .where(HomeVisit.patient_id == current_user.id)
        .order_by(HomeVisit.created_at.desc())
    )
    visits = result.scalars().all()
    return visits


@router.get("/{visit_id}", response_model=HomeVisitResponse)
async def get_home_visit(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ambil detail satu home visit."""
    result = await db.execute(
        select(HomeVisit).where(
            HomeVisit.id == visit_id,
            HomeVisit.patient_id == current_user.id,
        )
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Home visit tidak ditemukan")
    return visit


@router.get("/{visit_id}/track", response_model=HomeVisitTrackingResponse)
async def track_home_visit(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ambil tracking status home visit."""
    result = await db.execute(
        select(HomeVisit).where(
            HomeVisit.id == visit_id,
            HomeVisit.patient_id == current_user.id,
        )
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Home visit tidak ditemukan")

    # Build timeline steps based on current status
    status_order = ["pending", "confirmed", "on_the_way", "arrived", "completed"]
    current_idx = status_order.index(visit.status) if visit.status in status_order else 0

    steps = []
    labels = {
        "pending": "Pending",
        "confirmed": "Confirmed",
        "on_the_way": "On The Way",
        "arrived": "Arrived",
        "completed": "Completed",
    }
    for i, s in enumerate(status_order):
        if i < current_idx:
            step_status = "done"
        elif i == current_idx:
            step_status = "current"
        else:
            step_status = "upcoming"
        steps.append({"key": s, "label": labels[s], "status": step_status})

    return HomeVisitTrackingResponse(
        id=visit.id,
        doctor_name=visit.doctor_name,
        specialization=visit.specialization,
        date=visit.date,
        time=visit.time,
        address=visit.address,
        notes=visit.notes,
        status=visit.status,
        steps=steps,
    )


@router.post("/{visit_id}/cancel", response_model=HomeVisitResponse)
async def cancel_home_visit(
    visit_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Batalkan home visit."""
    result = await db.execute(
        select(HomeVisit).where(
            HomeVisit.id == visit_id,
            HomeVisit.patient_id == current_user.id,
        )
    )
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Home visit tidak ditemukan")
    if visit.status in (HomeVisitStatus.completed.value, HomeVisitStatus.cancelled.value):
        raise HTTPException(status_code=400, detail="Home visit tidak bisa dibatalkan")

    visit.status = HomeVisitStatus.cancelled.value
    visit.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(visit)
    return visit
