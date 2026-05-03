from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
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
# GET AVAILABLE DOCTORS (berdasarkan hari)
# ========================
@router.get("/available-doctors")
async def get_available_doctors(
    hari: str = Query(..., description="Hari dalam bahasa Indonesia, misal: Senin, Selasa, ..."),
    db: AsyncSession = Depends(get_db),
):
    # Gunakan LEFT JOIN agar dokter tetap muncul meski tidak ada di tabel users/doctor_profiles
    # doctor_schedules.doctor_id → doctor_profiles.id → users.id (via user_id)
    result = await db.execute(
        text("""
            SELECT DISTINCT
                ds.doctor_id,
                u.full_name AS name,
                dp.specialization
            FROM doctor_schedules ds
            LEFT JOIN doctor_profiles dp ON dp.id = ds.doctor_id
            LEFT JOIN users u ON u.id = dp.user_id
            WHERE ds.hari = :hari
            ORDER BY u.full_name NULLS LAST
        """),
        {"hari": hari},
    )
    rows = result.mappings().all()
    def format_doctor_name(name: str | None, fallback: str) -> str:
        if not name:
            return fallback
        # Jika nama sudah diawali Dr./dr./DR., jangan tambah lagi
        if name.lower().startswith("dr."):
            return name
        return f"Dr. {name}"

    return [
        {
            "doctor_id": str(row["doctor_id"]),
            "name": format_doctor_name(row["name"], f"Dokter {str(row['doctor_id'])[:6]}"),
            "specialization": row["specialization"] or "",
        }
        for row in rows
    ]


# ========================
# GET AVAILABLE TIMES (berdasarkan doctor_id dan hari)
# ========================
@router.get("/available-times")
async def get_available_times(
    doctor_id: str = Query(...),
    hari: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("""
            SELECT jam_tersedia
            FROM doctor_schedules
            WHERE doctor_id = :doctor_id
              AND hari = :hari
            ORDER BY jam_tersedia
        """),
        {"doctor_id": doctor_id, "hari": hari},
    )
    rows = result.mappings().all()
    # Format jam "HH:MM:SS" → "HH:MM"
    times = [str(row["jam_tersedia"])[:5] for row in rows if row["jam_tersedia"]]
    # Deduplicate while preserving order
    seen = set()
    unique_times = []
    for t in times:
        if t not in seen:
            seen.add(t)
            unique_times.append(t)
    return unique_times



@router.get("/my-requests")
async def get_my_requests(
    db: AsyncSession = Depends(get_db),
):
    """Ambil semua permintaan Home Visit dari tabel home_visit_requests_v3,
    join dengan doctor_profiles dan users untuk mendapatkan nama dokter."""
    import traceback
    try:
        result = await db.execute(
            text("""
                SELECT
                    r.id,
                    r.patient_name,
                    r.doctor_id,
                    r.address,
                    r.phone_number,
                    r.complaint,
                    r.preferred_date,
                    r.preferred_time,
                    r.created_at,
                    u.full_name AS doctor_full_name,
                    dp.specialization
                FROM home_visit_requests_v3 r
                LEFT JOIN doctor_profiles dp ON dp.id = r.doctor_id
                LEFT JOIN users u ON u.id = dp.user_id
                ORDER BY r.created_at DESC
            """)
        )
        rows = result.mappings().all()

        def fmt_name(name: str | None) -> str:
            if not name:
                return "Dokter"
            if name.lower().startswith("dr."):
                return name
            return f"Dr. {name}"

        items = []
        for row in rows:
            full_name = row["doctor_full_name"]
            doctor_name = fmt_name(full_name)
            items.append({
                "id": str(row["id"]),
                "patient_name": row["patient_name"] or "",
                "doctor_id": str(row["doctor_id"]) if row["doctor_id"] else None,
                "doctor_name": doctor_name,
                "specialization": row["specialization"] or "",
                "address": row["address"] or "",
                "phone_number": row["phone_number"] or "",
                "complaint": row["complaint"] or "",
                "preferred_date": str(row["preferred_date"]) if row["preferred_date"] else "",
                "preferred_time": str(row["preferred_time"])[:5] if row["preferred_time"] else "",
                "status": "pending",   # tabel belum punya kolom status
                "notes": "",           # tabel belum punya kolom notes
                "created_at": str(row["created_at"]) if row["created_at"] else "",
            })

        return items

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[MY-REQUESTS] ERROR:\n{tb}")
        raise HTTPException(status_code=500, detail=f"Gagal mengambil data: {str(e)}")



# ========================
# CREATE REQUEST → INSERT ke home_visit_requests_v3
# ========================
@router.post("/request")
async def create_home_visit_request(
    payload: HomeVisitRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    import uuid as _uuid
    import traceback
    from datetime import date as _date, time as _time

    try:
        # ── Konversi tipe di Python (bukan di SQL) ──────────────────
        new_id = _uuid.uuid4()  # Python UUID object

        # doctor_id: string UUID → Python UUID
        try:
            doctor_id = _uuid.UUID(str(payload.doctor_id)) if payload.doctor_id else None
        except Exception:
            doctor_id = None

        # preferred_date: ambil "YYYY-MM-DD" → Python date object
        raw_date = payload.preferred_date.strip()[:10]
        date_obj = _date.fromisoformat(raw_date)

        # preferred_time: "HH:MM" atau "HH:MM:SS" → Python time object
        time_str = payload.preferred_time.strip()
        if len(time_str) == 5:
            time_str += ":00"
        time_obj = _time.fromisoformat(time_str)

        print(f"[HOME VISIT] Inserting: id={new_id}, patient={payload.patient_name}, "
              f"doctor_id={doctor_id}, date={date_obj}, time={time_obj}")

        # ── Raw INSERT via asyncpg connection langsung ──────────────
        raw_conn = await db.connection()
        asyncpg_conn = raw_conn.sync_connection.connection._connection

        await asyncpg_conn.execute(
            """
            INSERT INTO home_visit_requests_v3
                (id, patient_name, doctor_id, address, phone_number, complaint, preferred_date, preferred_time, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())
            """,
            new_id,
            payload.patient_name,
            doctor_id,
            payload.address,
            payload.phone_number,
            payload.complaint,
            date_obj,
            time_obj,
        )

        print(f"[HOME VISIT] INSERT SUCCESS: id={new_id}")

        return {
            "id": str(new_id),
            "patient_name": payload.patient_name,
            "doctor_id": str(doctor_id) if doctor_id else None,
            "address": payload.address,
            "phone_number": payload.phone_number,
            "complaint": payload.complaint,
            "preferred_date": str(date_obj),
            "preferred_time": str(time_obj),
            "message": "Permintaan Home Visit berhasil dikirim.",
        }

    except Exception as e:
        await db.rollback()
        error_detail = traceback.format_exc()
        print(f"[HOME VISIT] INSERT ERROR:\n{error_detail}")
        raise HTTPException(
            status_code=500,
            detail=f"Gagal menyimpan permintaan: {str(e)}"
        )








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