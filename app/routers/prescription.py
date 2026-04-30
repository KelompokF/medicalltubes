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
        notes=body.notes
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
