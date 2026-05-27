# app/routers/review.py
"""
Review Router
--------------
Endpoints for patients to submit ratings & comments for doctors,
and for anyone to view reviews on a doctor's profile.
"""

import uuid as _uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, text

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.doctor_review import DoctorReview
from app.models.doctor_profile import DoctorProfile
from app.schemas.doctor_review import (
    ReviewCreate,
    ReviewResponse,
    ReviewSummary,
    ReviewCheckResponse,
)

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def _format_review(review: DoctorReview, patient_name: str) -> ReviewResponse:
    return ReviewResponse(
        id=str(review.id),
        patient_id=str(review.patient_id),
        patient_name=patient_name,
        doctor_id=str(review.doctor_id),
        rating=review.rating,
        comment=review.comment,
        context_type=review.context_type,
        context_id=str(review.context_id),
        created_at=review.created_at.isoformat() if review.created_at else "",
    )


# ─── POST /reviews ────────────────────────────────────────────
@router.post("", response_model=ReviewResponse)
async def submit_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a rating & comment for a doctor.
    Requires the patient to be authenticated.
    Validates that the context (consultation/home_visit) is valid and completed.
    """
    # Only patients can review
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Hanya pasien yang dapat memberi review.")

    # Validate doctor_id
    try:
        doctor_uuid = _uuid.UUID(data.doctor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format doctor_id tidak valid.")

    # Validate context_id
    try:
        context_uuid = _uuid.UUID(data.context_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format context_id tidak valid.")

    # Verify the doctor exists
    doc_result = await db.execute(
        select(User).where(User.id == doctor_uuid, User.role == "doctor")
    )
    doctor_user = doc_result.scalar_one_or_none()
    if not doctor_user:
        raise HTTPException(status_code=404, detail="Dokter tidak ditemukan.")

    # Validate context: check session is completed/ended
    if data.context_type == "consultation":
        from app.models.chat_room import ChatRoom
        room_result = await db.execute(
            select(ChatRoom).where(
                ChatRoom.id == context_uuid,
                ChatRoom.patient_id == current_user.id,
                ChatRoom.doctor_id == doctor_uuid,
            )
        )
        room = room_result.scalar_one_or_none()
        if not room:
            raise HTTPException(status_code=404, detail="Sesi konsultasi tidak ditemukan.")
        if room.status != "ended":
            raise HTTPException(status_code=400, detail="Sesi konsultasi belum berakhir.")

    elif data.context_type == "home_visit":
        # Check in home_visit_requests_v3
        hv_result = await db.execute(
            text("""
                SELECT id, status, user_id, doctor_id
                FROM home_visit_requests_v3
                WHERE id = :id
            """),
            {"id": str(context_uuid)},
        )
        hv_row = hv_result.mappings().fetchone()
        if not hv_row:
            raise HTTPException(status_code=404, detail="Home visit tidak ditemukan.")
        if hv_row["status"] != "completed":
            raise HTTPException(status_code=400, detail="Home visit belum selesai.")
    else:
        raise HTTPException(status_code=400, detail="context_type harus 'consultation' atau 'home_visit'.")

    # Check if already reviewed
    existing = await db.execute(
        select(DoctorReview).where(
            DoctorReview.patient_id == current_user.id,
            DoctorReview.doctor_id == doctor_uuid,
            DoctorReview.context_type == data.context_type,
            DoctorReview.context_id == context_uuid,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Anda sudah memberi review untuk sesi ini.")

    # Create review
    review = DoctorReview(
        patient_id=current_user.id,
        doctor_id=doctor_uuid,
        rating=data.rating,
        comment=data.comment or None,
        context_type=data.context_type,
        context_id=context_uuid,
    )
    db.add(review)
    await db.flush()

    # Update doctor_profiles aggregate rating
    avg_result = await db.execute(
        select(
            func.avg(DoctorReview.rating).label("avg_rating"),
            func.count(DoctorReview.id).label("total"),
        ).where(DoctorReview.doctor_id == doctor_uuid)
    )
    stats = avg_result.first()
    avg_rating = round(float(stats.avg_rating or 0), 1)
    total_reviews = int(stats.total or 0)

    await db.execute(
        text("""
            UPDATE doctor_profiles
            SET rating = :rating, total_reviews = :total_reviews
            WHERE user_id = :doctor_id
        """),
        {"rating": avg_rating, "total_reviews": total_reviews, "doctor_id": str(doctor_uuid)},
    )

    await db.commit()
    await db.refresh(review)

    return _format_review(review, current_user.full_name)


# ─── GET /reviews/check ───────────────────────────────────────
@router.get("/check", response_model=ReviewCheckResponse)
async def check_review(
    context_type: str = Query(..., description="consultation atau home_visit"),
    context_id: str = Query(..., description="ID sesi"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if the current user has already reviewed a given context."""
    try:
        ctx_uuid = _uuid.UUID(context_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format context_id tidak valid.")

    result = await db.execute(
        select(DoctorReview).where(
            DoctorReview.patient_id == current_user.id,
            DoctorReview.context_type == context_type,
            DoctorReview.context_id == ctx_uuid,
        )
    )
    review = result.scalar_one_or_none()

    if review:
        # Get patient name
        return ReviewCheckResponse(
            has_reviewed=True,
            review=_format_review(review, current_user.full_name),
        )
    return ReviewCheckResponse(has_reviewed=False)


# ─── GET /reviews/doctor/{doctor_id} ──────────────────────────
@router.get("/doctor/{doctor_id}", response_model=ReviewSummary)
async def get_doctor_reviews(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get all reviews for a doctor (public endpoint).
    Returns summary with average, distribution, and list of reviews.
    """
    try:
        doc_uuid = _uuid.UUID(doctor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Format doctor_id tidak valid.")

    # Get all reviews with patient names
    result = await db.execute(
        select(DoctorReview, User.full_name)
        .join(User, DoctorReview.patient_id == User.id)
        .where(DoctorReview.doctor_id == doc_uuid)
        .order_by(DoctorReview.created_at.desc())
    )
    rows = result.all()

    reviews = [_format_review(review, name) for review, name in rows]

    # Calculate stats
    total = len(reviews)
    avg = round(sum(r.rating for r in reviews) / total, 1) if total > 0 else 0.0

    # Distribution
    distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for r in reviews:
        distribution[str(r.rating)] = distribution.get(str(r.rating), 0) + 1

    return ReviewSummary(
        average_rating=avg,
        total_reviews=total,
        distribution=distribution,
        reviews=reviews,
    )
