# app/routers/doctor_schedule.py
"""
Doctor Schedule Router
----------------------
GET  /doctors/{doctor_id}/schedule  — Public: ambil jadwal dokter (untuk pasien)
GET  /doctor/schedule               — Doctor: jadwal milik sendiri
PUT  /doctor/schedule               — Doctor: simpan/update jadwal sendiri
"""

import uuid
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.doctor_profile import DoctorProfile
from app.models.doctor_schedule import DoctorSchedule, DayOfWeek
from app.schemas.doctor_schedule import (
    DoctorScheduleResponse,
    DaySchedule,
    DoctorScheduleUpdate,
)

router = APIRouter(tags=["Doctor Schedule"])

HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

IND_TO_EN = {
    "Senin": DayOfWeek.monday,
    "Selasa": DayOfWeek.tuesday,
    "Rabu": DayOfWeek.wednesday,
    "Kamis": DayOfWeek.thursday,
    "Jumat": DayOfWeek.friday,
    "Sabtu": DayOfWeek.saturday,
    "Minggu": DayOfWeek.sunday
}
EN_TO_IND = {v.value: k for k, v in IND_TO_EN.items()}


async def _resolve_profile_id(doctor_id_str: str, db: AsyncSession) -> uuid.UUID:
    try:
        doc_uuid = uuid.UUID(doctor_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format doctor ID tidak valid")

    res = await db.execute(
        select(DoctorProfile.id).where(DoctorProfile.id == doc_uuid)
    )
    if res.scalar_one_or_none():
        return doc_uuid

    res2 = await db.execute(
        select(DoctorProfile.id).where(DoctorProfile.user_id == doc_uuid)
    )
    pid = res2.scalar_one_or_none()
    if pid:
        return pid

    raise HTTPException(status_code=404, detail="Dokter tidak ditemukan")


def _build_response(doctor_id: uuid.UUID, rows: list) -> DoctorScheduleResponse:
    grouped: dict = defaultdict(list)
    for row in rows:
        if row.is_active:
            # handle DayOfWeek enum properly
            val = row.day_of_week.value if hasattr(row.day_of_week, 'value') else row.day_of_week
            hari = EN_TO_IND.get(val)
            if hari:
                grouped[hari].append(row.start_time)

    schedule = []
    for hari in HARI_ORDER:
        if hari in grouped:
            slots = sorted(set(grouped[hari]))
            schedule.append(DaySchedule(hari=hari, slots=slots))

    return DoctorScheduleResponse(
        doctor_id=str(doctor_id),
        schedule=schedule,
    )


@router.get("/doctors/{doctor_id}/schedule", response_model=DoctorScheduleResponse)
async def get_doctor_schedule_public(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
):
    profile_id = await _resolve_profile_id(doctor_id, db)
    result = await db.execute(
        select(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )
    rows = result.scalars().all()
    return _build_response(profile_id, rows)


@router.get("/doctor/schedule", response_model=DoctorScheduleResponse)
async def get_my_schedule(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Hanya dokter yang dapat mengakses endpoint ini")

    res = await db.execute(
        select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
    )
    profile = res.scalar_one_or_none()
    
    if not profile:
        profile = DoctorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            specialization="Umum",
            hospital_name="Belum Diatur"
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    profile_id = profile.id

    result = await db.execute(
        select(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )
    rows = result.scalars().all()
    return _build_response(profile_id, rows)


@router.put("/doctor/schedule", response_model=DoctorScheduleResponse)
async def update_my_schedule(
    data: DoctorScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Hanya dokter yang dapat mengakses endpoint ini")

    res = await db.execute(
        select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
    )
    profile = res.scalar_one_or_none()
    
    if not profile:
        profile = DoctorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            specialization="Umum",
            hospital_name="Belum Diatur"
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    profile_id = profile.id

    await db.execute(
        delete(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )

    new_rows = []
    for day_input in data.schedule:
        day_enum = IND_TO_EN.get(day_input.hari)
        if not day_enum:
            continue
        for slot_str in day_input.slots:
            try:
                t = datetime.strptime(slot_str.strip(), "%H:%M")
                # calculate +30 mins
                m = t.minute + 30
                end_h = t.hour + (m // 60)
                end_m = m % 60
                end_str = f"{end_h:02d}:{end_m:02d}"
            except ValueError:
                continue

            new_rows.append(
                DoctorSchedule(
                    id=uuid.uuid4(),
                    doctor_id=profile_id,
                    day_of_week=day_enum,
                    start_time=slot_str.strip(),
                    end_time=end_str,
                    is_active=True
                )
            )

    if new_rows:
        db.add_all(new_rows)
        
    await db.commit()

    result = await db.execute(
        select(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )
    rows = result.scalars().all()
    return _build_response(profile_id, rows)

