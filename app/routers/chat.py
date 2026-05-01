from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.dependencies import get_current_user
from app.models.chat_room import ChatRoom, RoomStatus
from app.models.user import User
from app.core.encryption import encrypt_messages, decrypt_messages

router = APIRouter(prefix="/chat", tags=["Chat"])


class CreateRoomRequest(BaseModel):
    doctor_id: str


class RoomResponse(BaseModel):
    room_id: str
    patient_id: str
    doctor_id: str
    doctor_name: str
    patient_name: str
    status: str
    created_at: str


# ─────────────────────────────────────────────
# 1. Buat / Dapatkan Chat Room
# ─────────────────────────────────────────────
@router.post("/room")
async def create_or_get_room(
    body: CreateRoomRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Pasien klik 'Chat' di search-doctor → buat room baru atau kembalikan room yang sudah ada.
    """
    patient_id = str(current_user.id)
    doctor_id = body.doctor_id

    # Validate UUID format
    import uuid as _uuid
    try:
        _uuid.UUID(doctor_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid doctor_id format")

    # Cek apakah sudah ada room active antara pasien-dokter ini
    result = await db.execute(
        select(ChatRoom).where(
            and_(
                ChatRoom.patient_id == patient_id,
                ChatRoom.doctor_id == doctor_id,
                ChatRoom.status == RoomStatus.ACTIVE,
            )
        )
    )
    room = result.scalar_one_or_none()

    if not room:
        # Buat room baru dengan encrypted empty array
        room = ChatRoom(
            patient_id=patient_id,
            doctor_id=doctor_id,
            status=RoomStatus.ACTIVE,
            encrypted_messages=encrypt_messages([]),
        )
        db.add(room)
        await db.commit()
        await db.refresh(room)

    # Ambil nama dokter
    doc_result = await db.execute(select(User).where(User.id == doctor_id))
    doctor = doc_result.scalar_one_or_none()

    return {
        "room_id": str(room.id),
        "patient_id": str(room.patient_id),
        "doctor_id": str(room.doctor_id),
        "doctor_name": doctor.full_name if doctor else "Dokter",
        "patient_name": current_user.full_name,
        "status": room.status,
        "created_at": room.created_at.isoformat() if room.created_at else "",
    }


# ─────────────────────────────────────────────
# 2. Ambil Daftar Room (untuk sidebar)
# ─────────────────────────────────────────────
@router.get("/rooms")
async def get_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ambil semua chat room milik user (baik sebagai pasien maupun dokter)."""
    user_id = current_user.id

    result = await db.execute(
        select(ChatRoom).where(
            or_(
                ChatRoom.patient_id == user_id,
                ChatRoom.doctor_id == user_id,
            )
        ).order_by(ChatRoom.updated_at.desc())
    )
    rooms = result.scalars().all()

    # Kumpulkan semua partner IDs untuk resolve nama
    partner_ids = set()
    for r in rooms:
        pid = str(r.patient_id)
        did = str(r.doctor_id)
        current_uid = str(user_id)
        partner_id = did if pid == current_uid else pid
        partner_ids.add(partner_id)

    # Resolve names
    import uuid as _uuid
    names = {}
    for pid in partner_ids:
        try:
            # Cast string to UUID object for database query
            target_id = _uuid.UUID(pid) if isinstance(pid, str) else pid
            res = await db.execute(select(User).where(User.id == target_id))
            u = res.scalar_one_or_none()
            if u:
                names[str(u.id)] = {"full_name": u.full_name, "role": u.role}
        except Exception:
            pass

    room_list = []
    for r in rooms:
        pid = str(r.patient_id)
        did = str(r.doctor_id)
        current_uid = str(user_id)
        
        partner_id = did if pid == current_uid else pid
        partner_info = names.get(str(partner_id), {})

        # Ambil pesan terakhir (decrypt hanya untuk preview)
        msgs = decrypt_messages(r.encrypted_messages)
        last_msg = msgs[-1] if msgs else None

        unread_count = sum(1 for m in msgs if m.get("receiver_id") == current_uid and not m.get("is_read"))

        room_list.append({
            "room_id": str(r.id),
            "partner_id": str(partner_id),
            "partner_name": partner_info.get("full_name", "Unknown User"),
            "partner_role": partner_info.get("role", "unknown"),
            "status": r.status,
            "last_message": last_msg["content"] if last_msg else None,
            "last_date": last_msg["created_at"] if last_msg else (r.created_at.isoformat() if r.created_at else None),
            "message_count": len(msgs),
            "unread_count": unread_count,
        })

    return room_list


# ─────────────────────────────────────────────
# 3. Ambil Pesan dari Room (decrypt)
# ─────────────────────────────────────────────
@router.get("/room/{room_id}/messages")
async def get_room_messages(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ambil semua pesan dari room, di-decrypt dari blob."""
    user_id = str(current_user.id)

    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")

    # Pastikan user adalah member room
    if str(room.patient_id) != user_id and str(room.doctor_id) != user_id:
        raise HTTPException(status_code=403, detail="Akses ditolak")

    messages = decrypt_messages(room.encrypted_messages)
    return messages


# ─────────────────────────────────────────────
# 4. End Session
# ─────────────────────────────────────────────
@router.post("/room/{room_id}/end")
async def end_session(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dokter mengakhiri sesi konsultasi."""
    user_id = str(current_user.id)

    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()

    if not room:
        raise HTTPException(status_code=404, detail="Room tidak ditemukan")

    if str(room.doctor_id) != user_id:
        raise HTTPException(status_code=403, detail="Hanya dokter yang dapat mengakhiri sesi")

    room.status = RoomStatus.ENDED
    await db.commit()

    # Kirim sinyal end_session via websocket ke pasien
    from app.Websocket.manager import manager
    await manager.send_message(str(room.patient_id), {
        "type": "end_session",
        "room_id": str(room.id),
        "content": "Sesi konsultasi telah berakhir."
    })

    return {"success": True, "message": "Session ended"}