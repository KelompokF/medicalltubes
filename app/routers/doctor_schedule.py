# app/routers/doctor_schedule.py
"""
Doctor Schedule Router
----------------------
GET  /doctors/{doctor_id}/schedule  — Public: ambil jadwal dokter (untuk pasien)
GET  /doctor/schedule               — Doctor: jadwal milik sendiri
PUT  /doctor/schedule               — Doctor: simpan/update jadwal sendiri
"""

import uuid
from datetime import datetime
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
from app.models.doctor_schedule import DoctorSchedule
from app.schemas.doctor_schedule import (
    DoctorScheduleResponse,
    DaySchedule,
    DoctorScheduleUpdate,
)

router = APIRouter(tags=["Doctor Schedule"])

# Urutan hari supaya response terurut
HARI_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]


def _parse_time_str(t) -> str:
    """Convert timedelta / time / string → 'HH:MM'."""
    if t is None:
        return "00:00"
    if hasattr(t, "seconds"):  # timedelta
        total = t.seconds
        h, m = divmod(total // 60, 60)
        return f"{h:02d}:{m:02d}"
    if hasattr(t, "strftime"):  # datetime.time
        return t.strftime("%H:%M")
    # string "HH:MM:SS" or "HH:MM"
    return str(t)[:5]


async def _resolve_profile_id(doctor_id_str: str, db: AsyncSession) -> uuid.UUID:
    """Accept either profile UUID or user UUID, return doctor_profiles.id."""
    try:
        doc_uuid = uuid.UUID(doctor_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format doctor ID tidak valid")

    # Try by profile id first
    res = await db.execute(
        select(DoctorProfile.id).where(DoctorProfile.id == doc_uuid)
    )
    if res.scalar_one_or_none():
        return doc_uuid

    # Try by user_id
    res2 = await db.execute(
        select(DoctorProfile.id).where(DoctorProfile.user_id == doc_uuid)
    )
    pid = res2.scalar_one_or_none()
    if pid:
        return pid

    raise HTTPException(status_code=404, detail="Dokter tidak ditemukan")


def _build_response(doctor_id: uuid.UUID, rows: list) -> DoctorScheduleResponse:
    """Group rows by hari and build response."""
    grouped: dict = defaultdict(list)
    for row in rows:
        slot_str = _parse_time_str(row.jam_tersedia)
        grouped[row.hari].append(slot_str)

    schedule = []
    for hari in HARI_ORDER:
        if hari in grouped:
            slots = sorted(set(grouped[hari]))
            schedule.append(DaySchedule(hari=hari, slots=slots))

    return DoctorScheduleResponse(
        doctor_id=str(doctor_id),
        schedule=schedule,
    )


# ─── GET /doctors/{doctor_id}/schedule — Public ───────────────────────────
@router.get("/doctors/{doctor_id}/schedule", response_model=DoctorScheduleResponse)
async def get_doctor_schedule_public(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Ambil jadwal dokter berdasarkan profile ID atau user ID.
    Dipakai oleh pasien saat memilih jadwal booking.
    """
    profile_id = await _resolve_profile_id(doctor_id, db)

    result = await db.execute(
        select(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )
    rows = result.scalars().all()
    return _build_response(profile_id, rows)


# ─── GET /doctor/schedule — Doctor: lihat jadwal sendiri ─────────────────
@router.get("/doctor/schedule", response_model=DoctorScheduleResponse)
async def get_my_schedule(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dokter melihat jadwal praktiknya sendiri."""
    print(f"DEBUG: Getting schedule for user_id={current_user.id}, role={current_user.role}")
    
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Hanya dokter yang dapat mengakses endpoint ini")

    res = await db.execute(
        select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
    )
    profile = res.scalar_one_or_none()
    
    if not profile:
        print(f"DEBUG: Profile not found for {current_user.id}. Creating a basic profile...")
        # Otomatis buat profil dasar agar dokter bisa pakai fitur schedule
        profile = DoctorProfile(
            id=uuid.uuid4(),
            user_id=current_user.id,
            specialization="Umum", # Default
            hospital_name="Belum Diatur"
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        print(f"DEBUG: Created new profile_id={profile.id}")

    profile_id = profile.id
    print(f"DEBUG: Final profile_id={profile_id}")

    result = await db.execute(
        select(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )
    rows = result.scalars().all()
    return _build_response(profile_id, rows)


# ─── PUT /doctor/schedule — Doctor: simpan jadwal ────────────────────────
@router.put("/doctor/schedule", response_model=DoctorScheduleResponse)
async def update_my_schedule(
    data: DoctorScheduleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Simpan jadwal praktik dokter (full replace).
    Hapus semua slot lama, insert slot baru sesuai input.
    """
    print(f"DEBUG: Updating schedule for user_id={current_user.id}")
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Hanya dokter yang dapat mengakses endpoint ini")

    res = await db.execute(
        select(DoctorProfile).where(DoctorProfile.user_id == current_user.id)
    )
    profile = res.scalar_one_or_none()
    
    if not profile:
        print(f"DEBUG: Profile not found for update. Creating for {current_user.id}...")
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
    print(f"DEBUG: Using profile_id={profile_id} for update")

    # Delete semua slot lama
    await db.execute(
        delete(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )

    # Insert slot baru
    new_rows = []
    for day_input in data.schedule:
        for slot_str in day_input.slots:
            # Parse "HH:MM" → datetime.time
            try:
                t = datetime.strptime(slot_str.strip(), "%H:%M").time()
            except ValueError:
                try:
                    t = datetime.strptime(slot_str.strip(), "%H:%M:%S").time()
                except ValueError:
                    continue  # skip invalid format

            new_rows.append(
                DoctorSchedule(
                    id=uuid.uuid4(),
                    doctor_id=profile_id,
                    hari=day_input.hari,
                    jam_tersedia=t,
                )
            )

    db.add_all(new_rows)
    await db.commit()

    # Re-fetch untuk response
    result = await db.execute(
        select(DoctorSchedule).where(DoctorSchedule.doctor_id == profile_id)
    )
    rows = result.scalars().all()
    return _build_response(profile_id, rows)
