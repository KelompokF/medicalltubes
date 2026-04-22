from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.home_visit import HomeVisitRequest
from app.schemas.home_visit import HomeVisitRequestCreate, HomeVisitRequestResponse
from typing import Optional

router = APIRouter(prefix="/home-visit", tags=["Home Visit"])


@router.post(
    "/",
    response_model=HomeVisitRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_home_visit_request(
    payload: HomeVisitRequestCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Buat permintaan kunjungan rumah baru. 
    Jika tidak login (preview mode), user_id diset ke None.
    """
    user_id = current_user.id if current_user else None
    
    new_request = HomeVisitRequest(
        user_id=user_id,
        doctor_id=payload.doctor_id,
        patient_name=payload.patient_name,
        address=payload.address,
        phone_number=payload.phone_number,
        complaint=payload.complaint,
        preferred_date=payload.preferred_date,
        preferred_time=payload.preferred_time,
    )

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)
    return new_request


@router.get(
    "/",
    response_model=List[HomeVisitRequestResponse],
)
async def get_my_home_visit_requests(
    skip: int = 0,
    limit: int = 100,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ambil daftar permintaan kunjungan rumah.
    Jika tidak login, ambil data yang user_id-nya None (preview data).
    """
    # Ambil daftar permintaan dengan join ke User (dokter) untuk mendapatkan nama dokter
    result = await db.execute(
        select(HomeVisitRequest, User.full_name.label("doctor_name"))
        .outerjoin(User, HomeVisitRequest.doctor_id == User.id)
        .where(HomeVisitRequest.user_id == user_id)
        .order_by(HomeVisitRequest.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    
    rows = result.all()
    requests_data = []
    for row in rows:
        req = row[0]
        # Kita bisa menambahkan attribute secara dinamis ke object SQLAlchemy 
        # karena schema Pydantic akan mengambilnya
        req.doctor_name = row[1]
        requests_data.append(req)
        
    return requests_data


@router.get(
    "/{request_id}",
    response_model=HomeVisitRequestResponse,
)
async def get_home_visit_request_detail(
    request_id: UUID,
    current_user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ambil detail satu permintaan kunjungan rumah.
    """
    user_id = current_user.id if current_user else None
    result = await db.execute(
        select(HomeVisitRequest)
        .where(HomeVisitRequest.id == request_id)
        .where(HomeVisitRequest.user_id == user_id)
    )
    visit_request = result.scalar_one_or_none()

    if not visit_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permintaan kunjungan rumah tidak ditemukan",
        )

    return visit_request
