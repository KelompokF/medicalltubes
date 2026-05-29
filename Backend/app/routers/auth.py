from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID as PyUUID

from app.database import get_db
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import logging

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, UserResponse, Token, LocationSettingUpdate, DeleteAccountResponse
from app.schemas.location import LocationSettingResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Daftarkan user baru."""
    result = await db.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")

    user = User(
        full_name=data.full_name,
        email=data.email,
        hashed_password=hash_password(data.password)
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user

@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login dan dapatkan JWT access token."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        logger.warning(f"LOGIN DEBUG: No user found for email={data.email}")
        raise HTTPException(status_code=401, detail="Email atau password salah")
        
    logger.warning(f"LOGIN DEBUG: User found: email={user.email}, role={user.role}, hash_prefix={user.hashed_password[:20] if user.hashed_password else 'NONE'}")
    
    if not verify_password(data.password, user.hashed_password):
        logger.warning(f"LOGIN DEBUG: Password verification FAILED for email={data.email}")
        raise HTTPException(status_code=401, detail="Wrong Password or Email")
        
    if getattr(user, 'is_deleted', False):
        raise HTTPException(status_code=403, detail="Akun telah dihapus")

    account_status = getattr(user, 'account_status', 'active')
    if account_status == 'suspended':
        raise HTTPException(status_code=403, detail="Akun Ditangguhkan Sementara, Silahkan Hubungi Admin")
    if account_status == 'banned':
        raise HTTPException(status_code=403, detail="Akun Diblokir Admin")

    token = create_access_token({"sub": str(user.id), "role": getattr(user, 'role', 'patient')})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Dapatkan informasi user yang sedang login."""
    return current_user

@router.put("/location-setting", response_model=LocationSettingResponse)
async def update_location_setting(
    payload: LocationSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.location_sharing_enabled = payload.is_location_enabled

    await db.commit()
    await db.refresh(current_user)
    
    # Map back to expected response structure
    return {"is_location_enabled": current_user.location_sharing_enabled}

@router.get("/location-setting", response_model=LocationSettingResponse)
async def get_location_setting(
    current_user: User = Depends(get_current_user)
):
    return {"is_location_enabled": current_user.location_sharing_enabled}

@router.delete("/delete-account", response_model=DeleteAccountResponse)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import delete
    from app.models.ambulance import AmbulanceService
    from app.models.emergency import Emergency
    from app.models.emergency_request import EmergencyRequest
    from app.models.prescription import Prescription
    from app.models.health_record import HealthRecord
    from app.models.consultation import Consultation
    from app.models.home_visit import HomeVisit
    from app.models.doctor_profile import DoctorProfile
    from app.models.patient_profile import PatientProfile
    from app.models.message import Message
    from app.models.chat_room import ChatRoom
    from app.models.doctor_schedule import DoctorSchedule
    from sqlalchemy import or_

    user_id = current_user.id

    # Hapus semua data relasi secara eksplisit (Manual Cascade Delete)
    # Ini menjamin akun terhapus bersih 100% dan mencegah IntegrityError
    # pada tabel yang belum menerapkan ON DELETE CASCADE di database schema.
    await db.execute(delete(AmbulanceService).where(AmbulanceService.user_id == user_id))
    await db.execute(delete(Emergency).where(Emergency.user_id == user_id))
    await db.execute(delete(EmergencyRequest).where(EmergencyRequest.user_id == user_id))
    
    # Hapus prescription baik sebagai dokter maupun pasien
    await db.execute(delete(Prescription).where(Prescription.doctor_id == user_id))
    await db.execute(delete(Prescription).where(Prescription.patient_id == user_id))

    # Hapus data dari tabel-tabel lainnya
    await db.execute(delete(HealthRecord).where(HealthRecord.user_id == user_id))
    await db.execute(delete(Consultation).where(Consultation.patient_id == user_id))
    await db.execute(delete(HomeVisit).where(HomeVisit.patient_id == user_id))
    await db.execute(delete(DoctorProfile).where(DoctorProfile.user_id == user_id))
    await db.execute(delete(PatientProfile).where(PatientProfile.user_id == user_id))
    await db.execute(delete(DoctorSchedule).where(DoctorSchedule.doctor_id == user_id))

    # Hapus chat dan pesan
    await db.execute(delete(ChatRoom).where(or_(ChatRoom.patient_id == user_id, ChatRoom.doctor_id == user_id)))
    await db.execute(delete(Message).where(or_(Message.sender_id == user_id, Message.receiver_id == user_id)))

    # Untuk HomeVisit di mana user ini adalah dokternya, set doctor_id menjadi NULL
    from sqlalchemy import update
    await db.execute(update(HomeVisit).where(HomeVisit.doctor_id == user_id).values(doctor_id=None))

    # Perform hard delete user utama
    await db.delete(current_user)
    await db.commit()

    return {"message": "Akun berhasil dihapus total"}

from pydantic import BaseModel
from app.dependencies import get_current_user

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.put("/change-password")
async def change_password(data: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    db.add(current_user)
    await db.commit()
    return {"detail": "Password updated successfully"}

from pydantic import EmailStr
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.config import settings
from app.services.email_service import send_reset_password_email
import string
import random
from datetime import datetime, timedelta

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if user:
        otp = ''.join(random.choices(string.digits, k=6))
        user.reset_otp = otp
        user.reset_otp_expire = datetime.utcnow() + timedelta(minutes=15)
        db.add(user)
        await db.commit()
        
        try:
            await send_reset_password_email(user.email, otp)
        except Exception as e:
            logger.error(f"Failed to send reset email: {e}")
            raise HTTPException(status_code=500, detail="Failed to send reset email")

    # Always return success to prevent email enumeration
    return {"message": "If that email exists, an OTP has been sent."}

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.reset_otp or user.reset_otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if not user.reset_otp_expire or user.reset_otp_expire < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP expired")
        
    user.hashed_password = hash_password(data.new_password)
    user.reset_otp = None
    user.reset_otp_expire = None
    db.add(user)
    await db.commit()
    
    return {"message": "Password successfully reset"}

@router.post("/google", response_model=Token)
async def google_login(data: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        idinfo = id_token.verify_oauth2_token(
            data.token, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        email = idinfo.get("email")
        full_name = idinfo.get("name", "Google User")
        
        if not email:
            raise HTTPException(status_code=400, detail="No email provided by Google")
            
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            # Register new user
            random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
            user = User(
                full_name=full_name,
                email=email,
                hashed_password=hash_password(random_password),
                role='patient' # Default role
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
        if getattr(user, 'is_deleted', False):
            raise HTTPException(status_code=403, detail="Akun telah dihapus")

        account_status = getattr(user, 'account_status', 'active')
        if account_status == 'suspended':
            raise HTTPException(status_code=403, detail="Akun Ditangguhkan Sementara, Silahkan Hubungi Admin")
        if account_status == 'banned':
            raise HTTPException(status_code=403, detail="Akun Diblokir Admin")

        token = create_access_token({"sub": str(user.id), "role": getattr(user, 'role', 'patient')})
        return {"access_token": token, "token_type": "bearer"}
        
    except ValueError as e:
        logger.error(f"Google Token Verification failed: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
