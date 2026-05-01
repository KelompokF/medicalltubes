from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select, and_, or_
from app.Websocket.manager import manager
from app.database import AsyncSessionLocal
from app.models.chat_room import ChatRoom, RoomStatus
from app.core.encryption import encrypt_messages, decrypt_messages
from datetime import datetime

router = APIRouter()


@router.websocket("/ws/chat/{user_id}")
async def chat(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint untuk real-time chat.
    Kirim JSON: {"room_id": "...", "receiver_id": "...", "content": "..."}
    
    Pesan akan disimpan ke chat room sebagai encrypted JSON blob.
    """
    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            room_id = data.get("room_id")
            receiver_id = data.get("receiver_id")
            content = data.get("content")

            if not receiver_id or not content:
                await websocket.send_json({"error": "receiver_id dan content diperlukan"})
                continue

            now = datetime.utcnow().isoformat()

            # Simpan ke chat room (encrypted) dan cari room_id
            found_room_id = room_id
            try:
                async with AsyncSessionLocal() as db:
                    room = None

                    if room_id:
                        # Cari room berdasarkan ID
                        result = await db.execute(
                            select(ChatRoom).where(ChatRoom.id == room_id)
                        )
                        room = result.scalar_one_or_none()

                    if not room:
                        # Fallback: cari room berdasarkan pasangan user
                        result = await db.execute(
                            select(ChatRoom).where(
                                and_(
                                    ChatRoom.status == RoomStatus.ACTIVE,
                                    or_(
                                        and_(
                                            ChatRoom.patient_id == user_id,
                                            ChatRoom.doctor_id == receiver_id,
                                        ),
                                        and_(
                                            ChatRoom.patient_id == receiver_id,
                                            ChatRoom.doctor_id == user_id,
                                        ),
                                    )
                                )
                            )
                        )
                        room = result.scalar_one_or_none()

                    if room:
                        found_room_id = str(room.id)
                        
                    message_data = {
                        "sender_id": user_id,
                        "receiver_id": receiver_id,
                        "content": content,
                        "created_at": now,
                        "room_id": found_room_id,
                    }

                    # Kirim ke receiver dan sender secara real-time
                    await manager.send_message(receiver_id, message_data)
                    await manager.send_message(user_id, message_data)

                    if room:
                        # Decrypt existing messages, append, re-encrypt
                        messages = decrypt_messages(room.encrypted_messages)
                        messages.append(message_data)
                        room.encrypted_messages = encrypt_messages(messages)
                        room.updated_at = datetime.utcnow()
                        await db.commit()
                    else:
                        print(f"[WebSocket] No room found for {user_id} <-> {receiver_id}")

            except Exception as e:
                # Jangan blokir WebSocket karena error DB
                print(f"[WebSocket DB Error] {e}")

    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)