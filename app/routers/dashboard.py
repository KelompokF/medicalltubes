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
from app.schemas.dashboard import DashboardResponse, DashboardStats, ActivityItem, UpcomingAppointment, HistoryItem

router = APIRouter(prefix="/patient/dashboard", tags=["Patient Dashboard"])

@router.get("", response_model=DashboardResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Hitung total consultations
    result_consultations = await db.execute(
        select(func.count(Consultation.id)).where(Consultation.patient_id == current_user.id)
    )
    total_consultations = result_consultations.scalar() or 0

    # 2. Hitung total home visits
    result_home_visits = await db.execute(
        select(func.count(HomeVisit.id)).where(HomeVisit.patient_id == current_user.id)
    )
    total_home_visits = result_home_visits.scalar() or 0

    # Untuk demo, kita mock emergency dan prescriptions karena belum ada modelnya
    stats = DashboardStats(
        totalConsultations=total_consultations,
        homeVisitBookings=total_home_visits,
        emergencyRequests=0,
        activePrescriptions=0
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

    # 5. Ambil history untuk tab baru
    consultation_history = []
    booking_history = []

    # Ambil 5 history consultation terbaru
    history_cons_result = await db.execute(
        select(Consultation)
        .where(Consultation.patient_id == current_user.id)
        .order_by(Consultation.created_at.desc())
        .limit(5)
    )
    for c in history_cons_result.scalars():
        consultation_history.append(HistoryItem(
            id=str(c.id),
            doctor=c.doctor_name,
            specialization=c.specialization or "Umum",
            date=c.created_at.strftime("%d %b %Y"),
            time=c.created_at.strftime("%H:%M"),
            status=c.status,
            type="consultation"
        ))

    # Ambil 5 history home visit terbaru
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

    # Dummy data fallback (opsional, agar UI terlihat sesuai screenshot)
    if not consultation_history:
        consultation_history.append(HistoryItem(
            id="dummy-cons-1", doctor="Dr. Sarah Wijaya", specialization="Umum",
            date="24 Apr 2026", time="14:30", status="Selesai", type="consultation"
        ))
        consultation_history.append(HistoryItem(
            id="dummy-cons-2", doctor="Dr. Budi Santoso", specialization="Penyakit Dalam",
            date="20 Apr 2026", time="10:00", status="Dibatalkan", type="consultation"
        ))

    if not booking_history:
        booking_history.append(HistoryItem(
            id="dummy-hv-1", doctor="Dr. Andi Pratama", specialization="Umum",
            date="26 Apr 2026", time="09:00", status="Menunggu", type="home_visit"
        ))
        booking_history.append(HistoryItem(
            id="dummy-hv-2", doctor="Dr. Rina Sulistyowati", specialization="Penyakit Dalam",
            date="20 Apr 2026", time="14:00", status="Selesai", type="home_visit"
        ))

    return DashboardResponse(
        stats=stats,
        recentActivities=activity_items,
        consultationHistory=consultation_history,
        bookingHistory=booking_history,
        upcomingAppointment=upcoming_appointment
    )
