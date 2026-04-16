from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.Websocket.manager import manager
from datetime import datetime

router = APIRouter()

@router.websocket("/ws/chat/{user_id}")
async def chat(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            sender_id = user_id
            receiver_id = data["receiver_id"]
            content = data["content"]

            message_data = {
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "content": content,
                "created_at": str(datetime.utcnow())
            }

            await manager.send_message(receiver_id, message_data)
            await manager.send_message(sender_id, message_data)

    except WebSocketDisconnect:
        manager.disconnect(user_id)