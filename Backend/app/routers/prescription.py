from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.prescription import Prescription
from app.models.chat_room import ChatRoom
from app.core.encryption import encrypt_messages, decrypt_messages
from app.schemas.prescription import PrescriptionCreate, PrescriptionResponse
from app.Websocket.manager import manager
from datetime import datetime

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

@router.post("", response_model=PrescriptionResponse)
async def create_prescription(
    body: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Hanya dokter yang dapat membuat resep")

    prescription = Prescription(
        room_id=body.room_id,
        doctor_id=current_user.id,
        patient_id=body.patient_id,
        medications=[m.dict() for m in body.medications],
        notes=body.notes,
        status="waiting_confirmation"
    )
    
    db.add(prescription)
    await db.commit()
    await db.refresh(prescription)
    
    # Also save as a special message in the room history
    if body.room_id:
        # Fetch the room
        room_result = await db.execute(select(ChatRoom).where(ChatRoom.id == body.room_id))
        room = room_result.scalar_one_or_none()
        
        if room:
            # Prepare prescription text for the message
            med_text = "\n".join([f"- {m['name']} ({m['dosage']}): {m['instructions']}" for m in prescription.medications])
            content = f"💊 RESEP OBAT BARU:\n{med_text}"
            if prescription.notes:
                content += f"\n\nCatatan: {prescription.notes}"
            
            # Decrypt, append, and re-encrypt
            messages = decrypt_messages(room.encrypted_messages)
            new_msg = {
                "sender_id": str(current_user.id),
                "receiver_id": str(body.patient_id),
                "content": content,
                "created_at": datetime.utcnow().isoformat(),
                "type": "prescription",
                "prescription_id": str(prescription.id)
            }
            messages.append(new_msg)
            room.encrypted_messages = encrypt_messages(messages)
            await db.commit()

            # Notify patient via WebSocket with the full message
            await manager.send_message(str(body.patient_id), {
                **new_msg,
                "type": "new_prescription" # Signal to show notification
            })
            
            # Also notify doctor (to show in their feed)
            await manager.send_message(str(current_user.id), new_msg)

    return prescription

@router.get("/room/{room_id}", response_model=List[PrescriptionResponse])
async def get_room_prescriptions(
    room_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Prescription).where(Prescription.room_id == room_id).order_by(Prescription.created_at.desc())
    )
    return result.scalars().all()

@router.get("/patient/{patient_id}", response_model=List[PrescriptionResponse])
async def get_patient_prescriptions(
    patient_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Security check: only the patient or a doctor can see this
    if current_user.role == "patient" and current_user.id != patient_id:
        raise HTTPException(status_code=403, detail="Akses ditolak")
        
    result = await db.execute(
        select(Prescription).where(Prescription.patient_id == patient_id).order_by(Prescription.created_at.desc())
    )
    return result.scalars().all()


# ============================================
# ADMIN ENDPOINTS FOR PRESCRIPTION TRACKING
# ============================================

@router.get("/admin/list")
async def get_admin_prescriptions_list(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import text
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak. Hanya untuk Admin.")
        
    try:
        result = await db.execute(
            text("""
                SELECT 
                    p.id,
                    p.patient_id,
                    p.doctor_id,
                    p.medications,
                    p.notes,
                    p.status,
                    p.created_at,
                    p.updated_at,
                    u_patient.full_name AS patient_name,
                    u_doctor.full_name AS doctor_name,
                    hv.address AS shipping_address,
                    hv.phone_number AS patient_phone
                FROM prescriptions p
                LEFT JOIN users u_patient ON u_patient.id = p.patient_id
                LEFT JOIN users u_doctor ON u_doctor.id = p.doctor_id
                LEFT JOIN (
                    SELECT DISTINCT ON (user_id) user_id, address, phone_number
                    FROM home_visit_requests_v3
                    ORDER BY user_id, created_at DESC
                ) hv ON hv.user_id = p.patient_id
                ORDER BY p.created_at DESC
            """)
        )
        rows = result.mappings().all()
        
        return [
            {
                "id": str(row["id"]),
                "patient_id": str(row["patient_id"]),
                "doctor_id": str(row["doctor_id"]),
                "medications": row["medications"],
                "notes": row["notes"],
                "status": row["status"] or "waiting_confirmation",
                "created_at": str(row["created_at"]),
                "updated_at": str(row["updated_at"]),
                "patient_name": row["patient_name"] or "Pasien",
                "doctor_name": row["doctor_name"] or "Dokter",
                "shipping_address": row["shipping_address"] or "Alamat tidak tersedia",
                "patient_phone": row["patient_phone"] or ""
            }
            for row in rows
        ]
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"[ADMIN-PRESCRIPTIONS-LIST] ERROR:\n{tb}")
        raise HTTPException(status_code=500, detail=f"Gagal mengambil resep: {str(e)}")


@router.patch("/admin/{prescription_id}/status")
async def update_prescription_status(
    prescription_id: UUID,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")
        
    status_val = payload.get("status")
    allowed_statuses = ["waiting_confirmation", "processing", "packaging", "shipping", "completed"]
    if status_val not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Status tidak valid. Harus salah satu dari {allowed_statuses}")
        
    result = await db.execute(
        select(Prescription).where(Prescription.id == prescription_id)
    )
    prescription = result.scalar_one_or_none()
    if not prescription:
        raise HTTPException(status_code=404, detail="Resep tidak ditemukan")
        
    prescription.status = status_val
    prescription.updated_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Status resep berhasil diperbarui", "status": status_val}
