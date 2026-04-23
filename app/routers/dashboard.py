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
from app.schemas.dashboard import DashboardResponse, DashboardStats, ActivityItem, UpcomingAppointment

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

    upcoming_hv = await db.execute(
        select(HomeVisit)
        .where(HomeVisit.patient_id == current_user.id, HomeVisit.scheduled_time > now, HomeVisit.status == "active")
        .order_by(HomeVisit.scheduled_time.asc())
        .limit(1)
    )
    next_hv = upcoming_hv.scalar_one_or_none()

    # Bandingkan mana yang lebih dulu
    next_event = None
    event_type = ""
    
    if next_cons and next_hv:
        if next_cons.scheduled_time < next_hv.scheduled_time:
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
        upcoming_appointment = UpcomingAppointment(
            doctor=next_event.doctor_name,
            specialization=getattr(next_event, "specialization", "General") or "General",
            date=next_event.scheduled_time.strftime("%B %d, %Y"),
            time=next_event.scheduled_time.strftime("%I:%M %p"),
            type=event_type
        )

    return DashboardResponse(
        stats=stats,
        recentActivities=activity_items,
        upcomingAppointment=upcoming_appointment
    )
