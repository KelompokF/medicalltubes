"""
Doctor Patients Router
-----------------------
Provides endpoint for doctors to view the history of patients
who have done consultations (via ChatRoom) and home visits.
"""

import traceback
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.chat_room import ChatRoom
from app.models.home_visit import HomeVisit
from app.models.doctor_profile import DoctorProfile

router = APIRouter(prefix="/doctor", tags=["Doctor Patients"])


# ========================
# SCHEMAS
# ========================
class PatientHistoryItem(BaseModel):
    """Satu record riwayat pasien (bisa konsultasi atau home visit)."""
    id: str
    patient_id: str
    patient_name: str
    type: str  # "consultation" | "home_visit"
    status: str
    date: str
    time: str
    notes: Optional[str] = None
    address: Optional[str] = None
    complaint: Optional[str] = None


class PatientSummary(BaseModel):
    """Ringkasan per pasien unik."""
    patient_id: str
    patient_name: str
    total_consultations: int = 0
    total_home_visits: int = 0
    last_interaction: str
    last_type: str  # "consultation" | "home_visit"


class DoctorPatientsResponse(BaseModel):
    """Response untuk halaman My Patients."""
    patients: List[PatientSummary]
    history: List[PatientHistoryItem]
    total_patients: int
    total_consultations: int
    total_home_visits: int


# ========================
# ENDPOINT
# ========================
@router.get("/patients", response_model=DoctorPatientsResponse)
async def get_doctor_patients(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mengambil daftar pasien yang pernah melakukan konsultasi
    dan home visit dengan dokter yang sedang login.
    """
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Hanya dokter yang dapat mengakses halaman ini")

    try:
        doctor_id = current_user.id

        # ─── 1. Ambil riwayat KONSULTASI dari ChatRoom ─────────────
        consultation_history: list[PatientHistoryItem] = []

        try:
            chat_result = await db.execute(
                select(ChatRoom, User)
                .join(User, ChatRoom.patient_id == User.id)
                .where(ChatRoom.doctor_id == doctor_id)
                .order_by(ChatRoom.updated_at.desc())
            )

            for room, patient in chat_result:
                pid = str(patient.id)
                status_str = str(room.status) if room.status else "active"
                # Handle RoomStatus enum
                if hasattr(room.status, 'value'):
                    status_str = room.status.value

                consultation_history.append(PatientHistoryItem(
                    id=str(room.id),
                    patient_id=pid,
                    patient_name=patient.full_name,
                    type="consultation",
                    status="Selesai" if status_str == "ended" else "Aktif",
                    date=room.updated_at.strftime("%d %b %Y") if room.updated_at else "-",
                    time=room.updated_at.strftime("%H:%M") if room.updated_at else "-",
                    notes=None,
                ))
        except Exception as e:
            print(f"[DOCTOR-PATIENTS] Error fetching consultations: {e}")
            traceback.print_exc()

        # ─── 2. Ambil riwayat HOME VISIT ──────────────────────────
        home_visit_history: list[PatientHistoryItem] = []

        # Cari doctor_profile id dulu
        profile_id = None
        try:
            res_prof = await db.execute(
                select(DoctorProfile.id).where(DoctorProfile.user_id == doctor_id)
            )
            profile_id = res_prof.scalar()
        except Exception as e:
            print(f"[DOCTOR-PATIENTS] Error fetching doctor profile: {e}")

        # Dari tabel home_visit_requests_v3 (data utama home visit)
        if profile_id:
            try:
                hv_result = await db.execute(
                    text("""
                        SELECT
                            r.id,
                            r.patient_name,
                            r.address,
                            r.phone_number,
                            r.complaint,
                            r.preferred_date,
                            r.preferred_time,
                            r.created_at,
                            r.status
                        FROM home_visit_requests_v3 r
                        WHERE r.doctor_id = :doctor_profile_id
                          AND r.payment_status = 'paid_cash'
                        ORDER BY r.created_at DESC
                    """),
                    {"doctor_profile_id": str(profile_id)}
                )
                for row in hv_result.mappings().all():
                    patient_name = row["patient_name"] or "Pasien"

                    created_at = row.get("created_at")
                    preferred_time = row.get("preferred_time")
                    status_val = row.get("status") or "pending"
                    # Handle enum status
                    if hasattr(status_val, 'value'):
                        status_val = status_val.value

                    home_visit_history.append(PatientHistoryItem(
                        id=str(row["id"]),
                        patient_id=str(row["id"]),  # Use request id as patient identifier
                        patient_name=patient_name,
                        type="home_visit",
                        status=str(status_val),
                        date=created_at.strftime("%d %b %Y") if created_at else "-",
                        time=str(preferred_time)[:5] if preferred_time else "-",
                        notes=None,
                        address=row.get("address"),
                        complaint=row.get("complaint"),
                    ))
            except Exception as e:
                print(f"[DOCTOR-PATIENTS] Error fetching home visit requests: {e}")
                traceback.print_exc()

        # Juga dari HomeVisit model (jika ada data di sana)
        if profile_id:
            try:
                hv_model_result = await db.execute(
                    select(HomeVisit)
                    .where(HomeVisit.doctor_id == profile_id)
                    .order_by(HomeVisit.created_at.desc())
                )
                for h in hv_model_result.scalars():
                    # Skip jika sudah ada di home_visit_history (dedup by id)
                    if any(item.id == str(h.id) for item in home_visit_history):
                        continue

                    # Ambil nama pasien
                    p_name = "Pasien"
                    p_id = str(h.patient_id)
                    try:
                        patient_res = await db.execute(
                            select(User.full_name, User.id).where(User.id == h.patient_id)
                        )
                        patient_row = patient_res.first()
                        if patient_row:
                            p_name = patient_row[0]
                            p_id = str(patient_row[1])
                    except Exception:
                        pass

                    status_val = h.status
                    if hasattr(status_val, 'value'):
                        status_val = status_val.value

                    home_visit_history.append(PatientHistoryItem(
                        id=str(h.id),
                        patient_id=p_id,
                        patient_name=p_name,
                        type="home_visit",
                        status=str(status_val),
                        date=h.created_at.strftime("%d %b %Y") if h.created_at else "-",
                        time=str(h.time) if h.time else "-",
                        notes=h.notes,
                        address=h.address,
                    ))
            except Exception as e:
                print(f"[DOCTOR-PATIENTS] Error fetching HomeVisit model: {e}")
                traceback.print_exc()

        # ─── 3. Gabungkan history dan buat summary ────────────────
        all_history = consultation_history + home_visit_history
        # Sort gabungan by date descending
        all_history.sort(key=lambda x: x.date, reverse=True)

        # Build patient summaries
        patient_map: dict[str, PatientSummary] = {}

        for item in all_history:
            key = item.patient_name  # Group by name since patient_id may not be consistent
            if key not in patient_map:
                patient_map[key] = PatientSummary(
                    patient_id=item.patient_id,
                    patient_name=item.patient_name,
                    total_consultations=0,
                    total_home_visits=0,
                    last_interaction=f"{item.date} {item.time}",
                    last_type=item.type,
                )

            if item.type == "consultation":
                patient_map[key].total_consultations += 1
            else:
                patient_map[key].total_home_visits += 1

        patients = list(patient_map.values())
        # Sort by last interaction desc (yang paling baru pertama)
        patients.sort(key=lambda x: x.last_interaction, reverse=True)

        total_consultations = len(consultation_history)
        total_home_visits = len(home_visit_history)

        return DoctorPatientsResponse(
            patients=patients,
            history=all_history,
            total_patients=len(patients),
            total_consultations=total_consultations,
            total_home_visits=total_home_visits,
        )

    except HTTPException:
        raise
    except Exception as e:
        tb = traceback.format_exc()
        print(f"[DOCTOR-PATIENTS] UNHANDLED ERROR:\n{tb}")
        raise HTTPException(status_code=500, detail=f"Gagal memuat data pasien: {str(e)}")
