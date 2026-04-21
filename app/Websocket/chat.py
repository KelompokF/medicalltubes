from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.Websocket.manager import manager
from app.database import AsyncSessionLocal
from app.models.message import Message
from datetime import datetime

router = APIRouter()


@router.websocket("/ws/chat/{user_id}")
async def chat(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint untuk real-time chat.
    Kirim JSON: {"receiver_id": "...", "content": "..."}
    """
    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            receiver_id = data.get("receiver_id")
            content = data.get("content")

            if not receiver_id or not content:
                await websocket.send_json({"error": "receiver_id dan content diperlukan"})
                continue

            message_data = {
                "sender_id": user_id,
                "receiver_id": receiver_id,
                "content": content,
                "created_at": datetime.utcnow().isoformat(),
            }

            # Kirim ke receiver dan sender
            await manager.send_message(receiver_id, message_data)
            await manager.send_message(user_id, message_data)

            # Simpan ke database
            try:
                async with AsyncSessionLocal() as db:
                    msg = Message(
                        sender_id=user_id,
                        receiver_id=receiver_id,
                        content=content,
                        created_at=datetime.utcnow(),
                    )
                    db.add(msg)
                    await db.commit()
            except Exception as e:
                # Jangan blokir WebSocket karena error DB
                print(f"[WebSocket DB Error] {e}")

    except WebSocketDisconnect:
        manager.disconnect(user_id)