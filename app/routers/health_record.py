from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.health_record import HealthRecord
from app.schemas.health_record import HealthRecordCreate, HealthRecordResponse

router = APIRouter(prefix="/health-records", tags=["Health Records"])


@router.post("/", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_health_record(
    record_in: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Buat catatan riwayat kesehatan baru untuk pasien yang login."""
    new_record = HealthRecord(
        user_id=current_user.id,
        blood_pressure=record_in.blood_pressure,
        heart_rate=record_in.heart_rate,
        weight=record_in.weight,
        height=record_in.height,
        notes=record_in.notes,
    )
    if record_in.date:
        new_record.date = record_in.date

    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    return new_record


@router.get("/", response_model=List[HealthRecordResponse])
async def get_health_records(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ambil semua riwayat kesehatan untuk pasien yang login."""
    result = await db.execute(
        select(HealthRecord)
        .where(HealthRecord.user_id == current_user.id)
        .order_by(HealthRecord.date.desc())
        .offset(skip)
        .limit(limit)
    )
    records = result.scalars().all()
    return records


@router.get("/{record_id}", response_model=HealthRecordResponse)
async def get_health_record(
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Ambil detail satu catatan kesehatan berdasarkan ID."""
    result = await db.execute(
        select(HealthRecord)
        .where(HealthRecord.id == record_id)
        .where(HealthRecord.user_id == current_user.id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Riwayat kesehatan tidak ditemukan")
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_health_record(
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Hapus satu catatan kesehatan."""
    result = await db.execute(
        select(HealthRecord)
        .where(HealthRecord.id == record_id)
        .where(HealthRecord.user_id == current_user.id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Riwayat kesehatan tidak ditemukan")

    await db.delete(record)
    await db.commit()
    return None
