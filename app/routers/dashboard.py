from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import datetime

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.consultation import Consultation
from app.models.home_visit import HomeVisit
from app.models.chat_room import ChatRoom
from app.models.emergency_request import EmergencyRequest
from app.models.prescription import Prescription
from app.schemas.dashboard import DashboardResponse, DashboardStats, ActivityItem, UpcomingAppointment, HistoryItem, PrescriptionDashboardItem
from app.schemas.prescription import MedicationItem
from sqlalchemy import text
from app.models.doctor_profile import DoctorProfile
from pydantic import BaseModel
from typing import List, Any, Optional

class AdminStats(BaseModel):
    totalUsers: int
    totalDoctors: int
    activeEmergencies: int
    totalConsultations: int

class AdminDashboardResponse(BaseModel):
    stats: AdminStats
    recentUsers: List[Any]
    analyticsData: List[Any]

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str
    created_at: str

class UpdateUserStatusRequest(BaseModel):
    status: str

class AdminUsersResponse(BaseModel):
    users: List[UserResponse]
    total: int

router = APIRouter(tags=["Dashboard"])

@router.get("/patient/dashboard", response_model=DashboardResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Hitung total consultations (ChatRooms)
    result_chat = await db.execute(
        select(func.count(ChatRoom.id)).where(ChatRoom.patient_id == current_user.id)
    )
    total_chat_rooms = result_chat.scalar() or 0

    # Juga hitung consultations (scheduled)
    result_cons = await db.execute(
        select(func.count(Consultation.id)).where(Consultation.patient_id == current_user.id)
    )
    total_scheduled = result_cons.scalar() or 0
    
    total_consultations = max(total_chat_rooms, total_scheduled)

    # 2. Hitung total home visits (dari dua tabel)
    # Tabel 1: HomeVisit model
    result_hv_model = await db.execute(
        select(func.count(HomeVisit.id)).where(HomeVisit.patient_id == current_user.id)
    )
    total_hv_model = result_hv_model.scalar() or 0

    # Tabel 2: home_visit_requests_v3 (tampilkan data sesuai akun saat ini)
    result_hv_v3 = await db.execute(
        text("SELECT count(*) FROM home_visit_requests_v3 WHERE (user_id = :user_id OR LOWER(patient_name) = LOWER(:full_name)) AND payment_status = 'paid_cash'"),
        {"user_id": current_user.id, "full_name": current_user.full_name}
    )
    total_hv_v3 = result_hv_v3.scalar() or 0
    
    total_home_visits = total_hv_model + total_hv_v3

    # 3. Hitung emergency requests
    result_emergency = await db.execute(
        select(func.count(EmergencyRequest.id)).where(EmergencyRequest.user_id == current_user.id)
    )
    total_emergency = result_emergency.scalar() or 0

    # 4. Hitung active prescriptions
    result_rx = await db.execute(
        select(func.count(Prescription.id)).where(Prescription.patient_id == current_user.id)
    )
    total_rx = result_rx.scalar() or 0

    stats = DashboardStats(
        totalConsultations=total_consultations,
        homeVisitBookings=total_home_visits,
        emergencyRequests=total_emergency,
        activePrescriptions=total_rx
    )

    # 3. Ambil aktivitas terbaru (gabungan dari consultations dan home visits)
    # Kita ambil 3 konsultasi terakhir dan 3 home visit terakhir, lalu kita sort dan ambil 5 teratas
    recent_activities = []
    
    cons_result = await db.execute(
        select(Consultation).where(Consultation.patient_id == current_user.id).order_by(Consultation.created_at.desc()).limit(3)
    )
    for c in cons_result.scalars():
        recent_activities.append({
            "id": str(c.id),
            "status": c.status,
            "description": f"Consultation with {c.doctor_name}",
            "date": c.created_at.strftime("%Y-%m-%d"),
            "sort_key": c.created_at
        })

    hv_result = await db.execute(
        select(HomeVisit).where(HomeVisit.patient_id == current_user.id).order_by(HomeVisit.created_at.desc()).limit(3)
    )
    for h in hv_result.scalars():
        recent_activities.append({
            "id": str(h.id),
            "status": h.status,
            "description": f"Home Visit by {h.doctor_name}",
            "date": h.created_at.strftime("%Y-%m-%d"),
            "sort_key": h.created_at
        })

    # Sort descending
    recent_activities.sort(key=lambda x: x["sort_key"], reverse=True)
    
    # Format activity items
    activity_items = [
        ActivityItem(id=a["id"], status=a["status"], description=a["description"], date=a["date"])
        for a in recent_activities[:5]
    ]

    # 4. Cari appointment mendatang terdekat
    # Cari yang scheduled_time > sekarang
    now = datetime.datetime.utcnow()
    upcoming_appointment = None
    
    upcoming_cons = await db.execute(
        select(Consultation)
        .where(Consultation.patient_id == current_user.id, Consultation.scheduled_time > now, Consultation.status == "active")
        .order_by(Consultation.scheduled_time.asc())
        .limit(1)
    )
    next_cons = upcoming_cons.scalar_one_or_none()

    # For HomeVisit, we use date and time
    today = now.date()
    upcoming_hv = await db.execute(
        select(HomeVisit)
        .where(HomeVisit.patient_id == current_user.id, HomeVisit.date >= today, HomeVisit.status.in_(["pending", "confirmed"]))
        .order_by(HomeVisit.date.asc(), HomeVisit.time.asc())
        .limit(1)
    )
    next_hv = upcoming_hv.scalar_one_or_none()

    # Bandingkan mana yang lebih dulu
    next_event = None
    event_type = ""
    
    # Helper to get a proper datetime from HomeVisit
    def get_hv_dt(hv):
        try:
            return datetime.datetime.combine(hv.date, datetime.datetime.strptime(hv.time, "%H:%M").time())
        except:
            return datetime.datetime.combine(hv.date, datetime.time(0,0))

    if next_cons and next_hv:
        hv_dt = get_hv_dt(next_hv)
        if next_cons.scheduled_time < hv_dt:
            next_event = next_cons
            event_type = "Online Consultation"
        else:
            next_event = next_hv
            event_type = "Home Visit"
    elif next_cons:
        next_event = next_cons
        event_type = "Online Consultation"
    elif next_hv:
        next_event = next_hv
        event_type = "Home Visit"

    if next_event:
        if event_type == "Home Visit":
            dt_obj = get_hv_dt(next_event)
            formatted_date = dt_obj.strftime("%B %d, %Y")
            formatted_time = dt_obj.strftime("%I:%M %p")
        else:
            formatted_date = next_event.scheduled_time.strftime("%B %d, %Y")
            formatted_time = next_event.scheduled_time.strftime("%I:%M %p")

        upcoming_appointment = UpcomingAppointment(
            doctor=next_event.doctor_name,
            specialization=getattr(next_event, "specialization", "General") or "General",
            date=formatted_date,
            time=formatted_time,
            type=event_type
        )

    # 5. Ambil history dari ChatRoom (Riwayat Chat Asli)
    consultation_history = []
    
    # Query ChatRoom dan Join dengan User (Dokter)
    history_chat_result = await db.execute(
        select(ChatRoom, User)
        .join(User, ChatRoom.doctor_id == User.id)
        .where(ChatRoom.patient_id == current_user.id)
        .order_by(ChatRoom.updated_at.desc())
        .limit(5)
    )
    
    for room, doctor in history_chat_result:
        consultation_history.append(HistoryItem(
            id=str(room.id),
            doctor=doctor.full_name,
            specialization="Umum", # Bisa dikembangkan untuk ambil dari DoctorProfile
            date=room.updated_at.strftime("%d %b %Y"),
            time=room.updated_at.strftime("%H:%M"),
            status="Selesai" if room.status == "ended" else "Aktif",
            type="consultation"
        ))

    # 6. Ambil history home visit terbaru (gabungan dua tabel)
    booking_history = []
    
    # Dari HomeVisit model
    history_hv_result = await db.execute(
        select(HomeVisit)
        .where(HomeVisit.patient_id == current_user.id)
        .order_by(HomeVisit.created_at.desc())
        .limit(5)
    )
    for h in history_hv_result.scalars():
        booking_history.append(HistoryItem(
            id=str(h.id),
            doctor=h.doctor_name,
            specialization=h.specialization or "Umum",
            date=h.created_at.strftime("%d %b %Y"),
            time=h.created_at.strftime("%H:%M"),
            status=h.status,
            type="home_visit",
            sort_key=h.created_at
        ))

    # Dari home_visit_requests_v3 (tampilkan data sesuai akun saat ini)
    res_v3 = await db.execute(
        text("""
            SELECT r.*, u.full_name AS doctor_full_name, dp.specialization
            FROM home_visit_requests_v3 r
            LEFT JOIN doctor_profiles dp ON dp.id = r.doctor_id
            LEFT JOIN users u ON u.id = dp.user_id
            WHERE (r.user_id = :user_id OR LOWER(r.patient_name) = LOWER(:full_name)) AND r.payment_status = 'paid_cash'
            ORDER BY r.created_at DESC
            LIMIT 5
        """),
        {"user_id": current_user.id, "full_name": current_user.full_name}
    )
    for row in res_v3.mappings().all():
        # Avoid duplicates if ID somehow matches (unlikely but safe)
        if any(item.id == str(row["id"]) for item in booking_history):
            continue
            
        booking_history.append(HistoryItem(
            id=str(row["id"]),
            doctor=row["doctor_full_name"] or f"Dokter {str(row['doctor_id'])[:6]}",
            specialization=row["specialization"] or "Kunjungan Rumah",
            date=row["created_at"].strftime("%d %b %Y") if row["created_at"] else "Baru saja",
            time=row["created_at"].strftime("%H:%M") if row["created_at"] else "",
            status=row["status"] or "pending",
            type="home_visit",
            sort_key=row["created_at"] or datetime.datetime.utcnow()
        ))

    # Sort gabungan by date descending
    booking_history.sort(key=lambda x: getattr(x, 'sort_key', datetime.datetime.min), reverse=True)
    # Limit 5
    booking_history = booking_history[:5]

    # 7. Ambil resep obat pasien
    prescriptions = []
    pres_result = await db.execute(
        select(Prescription, User)
        .join(User, Prescription.doctor_id == User.id)
        .where(Prescription.patient_id == current_user.id)
        .order_by(Prescription.created_at.desc())
    )
    
    for pres, doctor in pres_result:
        meds = []
        if isinstance(pres.medications, list):
            for m in pres.medications:
                meds.append(MedicationItem(
                    name=m.get("name", ""),
                    dosage=m.get("dosage", ""),
                    duration=m.get("duration", ""),
                    instructions=m.get("instructions", "")
                ))
        
        prescriptions.append(PrescriptionDashboardItem(
            id=pres.id,
            doctor=doctor.full_name,
            date=pres.created_at.strftime("%d %b %Y, %H:%M"),
            medications=meds,
            notes=pres.notes
        ))

    return DashboardResponse(
        stats=stats,
        recentActivities=activity_items,
        consultationHistory=consultation_history,
        bookingHistory=booking_history,
        upcomingAppointment=upcoming_appointment,
        prescriptions=prescriptions
    )


@router.get("/doctor/dashboard", response_model=DashboardResponse)
async def get_doctor_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Dashboard khusus dokter."""
    if current_user.role != "doctor":
        # Jika bukan dokter, return data kosong saja agar tidak error
        return DashboardResponse(
            stats=DashboardStats(totalConsultations=0, homeVisitBookings=0, emergencyRequests=0, activePrescriptions=0),
            recentActivities=[],
            consultationHistory=[],
            bookingHistory=[],
            upcomingAppointment=None
        )

    # 1. Stats
    # Chat rooms where this user is the doctor
    res_chat = await db.execute(select(func.count(ChatRoom.id)).where(ChatRoom.doctor_id == current_user.id))
    total_chat = res_chat.scalar() or 0

    # Home visits where this user is the doctor (by full_name match for now, or profile id if available)
    # Better: join with DoctorProfile
    from app.models.doctor_profile import DoctorProfile
    res_prof = await db.execute(select(DoctorProfile.id).where(DoctorProfile.user_id == current_user.id))
    profile_id = res_prof.scalar()
    
    total_hv = 0
    if profile_id:
        res_hv = await db.execute(select(func.count(HomeVisit.id)).where(HomeVisit.doctor_id == profile_id))
        total_hv = res_hv.scalar() or 0

    # Prescriptions issued by this doctor
    res_rx = await db.execute(select(func.count(Prescription.id)).where(Prescription.doctor_id == current_user.id))
    total_rx = res_rx.scalar() or 0

    stats = DashboardStats(
        totalConsultations=total_chat,
        homeVisitBookings=total_hv,
        emergencyRequests=0, # Dokter biasanya tidak punya emergency request sendiri
        activePrescriptions=total_rx
    )

    # 2. Consultation History (Pasien-pasien terbaru)
    consultation_history = []
    history_chat_result = await db.execute(
        select(ChatRoom, User)
        .join(User, ChatRoom.patient_id == User.id)
        .where(ChatRoom.doctor_id == current_user.id)
        .order_by(ChatRoom.updated_at.desc())
        .limit(5)
    )
    for room, patient in history_chat_result:
        consultation_history.append(HistoryItem(
            id=str(room.id),
            doctor=patient.full_name, # Di dashboard dokter, field ini kita isi nama pasien
            specialization="Pasien",
            date=room.updated_at.strftime("%d %b %Y"),
            time=room.updated_at.strftime("%H:%M"),
            status="Selesai" if room.status == "ended" else "Aktif",
            type="consultation"
        ))

    # 3. Booking History
    booking_history = []
    if profile_id:
        history_hv_result = await db.execute(
            select(HomeVisit)
            .where(HomeVisit.doctor_id == profile_id)
            .order_by(HomeVisit.created_at.desc())
            .limit(5)
        )
        for h in history_hv_result.scalars():
            booking_history.append(HistoryItem(
                id=str(h.id),
                doctor=h.patient_name,
                specialization="Kunjungan Rumah",
                date=h.created_at.strftime("%d %b %Y"),
                time=h.created_at.strftime("%H:%M"),
                status=h.status,
                type="home_visit"
            ))

    return DashboardResponse(
        stats=stats,
        recentActivities=[],
        consultationHistory=consultation_history,
        bookingHistory=booking_history,
        upcomingAppointment=None
    )

@router.get("/admin/dashboard", response_model=AdminDashboardResponse)
async def get_admin_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Dashboard khusus admin."""
    if current_user.role != "admin":
        return AdminDashboardResponse(
            stats=AdminStats(totalUsers=0, totalDoctors=0, activeEmergencies=0, totalConsultations=0),
            recentUsers=[],
            analyticsData=[]
        )

    # 1. Total Users (Pasien)
    res_users = await db.execute(select(func.count(User.id)).where(User.role == "patient", User.is_deleted == False))
    total_users = res_users.scalar() or 0

    # 2. Total Doctors
    res_doctors = await db.execute(select(func.count(User.id)).where(User.role == "doctor", User.is_deleted == False))
    total_doctors = res_doctors.scalar() or 0

    # 3. Active Emergencies
    res_emergencies = await db.execute(select(func.count(EmergencyRequest.id)).where(EmergencyRequest.status == "pending"))
    active_emergencies = res_emergencies.scalar() or 0

    # 4. Total Consultations (ChatRooms)
    res_chat = await db.execute(select(func.count(ChatRoom.id)))
    total_consultations = res_chat.scalar() or 0

    stats = AdminStats(
        totalUsers=total_users,
        totalDoctors=total_doctors,
        activeEmergencies=active_emergencies,
        totalConsultations=total_consultations
    )

    # 5. Recent Users Table (5 newest users)
    recent_users_result = await db.execute(
        select(User).where(User.is_deleted == False).order_by(User.created_at.desc()).limit(5)
    )
    
    recent_users = []
    for u in recent_users_result.scalars():
        recent_users.append({
            "id": str(u.id),
            "name": u.full_name,
            "email": u.email,
            "role": u.role,
            "status": "Active" if u.is_active else "Inactive",
            "joined": u.created_at.strftime("%b %d, %Y") if u.created_at else "N/A"
        })

    # 6. Analytics Data (Mock data for now, could be dynamic)
    analytics_data = [
        {"month": "Jan", "consultations": 40, "homeVisits": 24, "emergencies": 10},
        {"month": "Feb", "consultations": 30, "homeVisits": 13, "emergencies": 5},
        {"month": "Mar", "consultations": 50, "homeVisits": 38, "emergencies": 15},
        {"month": "Apr", "consultations": 45, "homeVisits": 43, "emergencies": 8},
        {"month": "May", "consultations": total_consultations, "homeVisits": 20, "emergencies": active_emergencies},
    ]

    return AdminDashboardResponse(
        stats=stats,
        recentUsers=recent_users,
        analyticsData=analytics_data
    )

@router.get("/admin/users", response_model=AdminUsersResponse)
async def get_admin_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    role: Optional[str] = Query(None)
):
    """Ambil daftar SEMUA pengguna untuk admin dengan filter opsional."""
    if current_user.role != "admin":
        return AdminUsersResponse(users=[], total=0)
    
    # Build query
    query = select(User).where(User.is_deleted == False)
    
    # Apply role filter
    if role and role != "all":
        query = query.where(User.role == role)
    
    # Count total
    count_query = select(func.count(User.id)).where(User.is_deleted == False)
    if role and role != "all":
        count_query = count_query.where(User.role == role)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get ALL users (no pagination)
    query = query.order_by(User.created_at.desc())
    
    result = await db.execute(query)
    users_data = result.scalars().all()
    
    users_list = [
        UserResponse(
            id=str(u.id),
            name=u.full_name or "Unknown",
            email=u.email,
            role=u.role,
            status=(getattr(u, "account_status", None) or ("active" if u.is_active else "suspended")),
            created_at=u.created_at.strftime("%Y-%m-%d %H:%M:%S") if u.created_at else ""
        )
        for u in users_data
    ]
    
    return AdminUsersResponse(users=users_list, total=total)

@router.patch("/admin/users/{user_id}")
async def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update status pengguna (active/suspended/banned)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Get the user
    result = await db.execute(select(User).where(User.id == user_id, User.is_deleted == False))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    status_value = payload.status.lower()
    if status_value == "active":
        user.is_active = True
    elif status_value in ["suspended", "banned"]:
        user.is_active = False
    else:
        raise HTTPException(status_code=400, detail="Status tidak valid")

    user.account_status = status_value
    await db.commit()
    
    return {"message": "Status updated successfully"}

@router.delete("/admin/users/{user_id}")
async def delete_admin_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user account permanently."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()

    return {"message": "User deleted successfully"}
