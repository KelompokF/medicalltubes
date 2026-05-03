from fastapi import APIRouter, Depends
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
from app.schemas.dashboard import DashboardResponse, DashboardStats, ActivityItem, UpcomingAppointment, HistoryItem

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

    # 2. Hitung total home visits
    result_home_visits = await db.execute(
        select(func.count(HomeVisit.id)).where(HomeVisit.patient_id == current_user.id)
    )
    total_home_visits = result_home_visits.scalar() or 0

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

    # 6. Ambil history home visit terbaru
    booking_history = []
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
            specialization="Umum",
            date=h.created_at.strftime("%d %b %Y"),
            time=h.created_at.strftime("%H:%M"),
            status=h.status,
            type="home_visit"
        ))

    return DashboardResponse(
        stats=stats,
        recentActivities=activity_items,
        consultationHistory=consultation_history,
        bookingHistory=booking_history,
        upcomingAppointment=upcoming_appointment
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
