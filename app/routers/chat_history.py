# app/routers/chat_history.py

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, func, case
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.message import Message
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/history")
async def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Ambil riwayat chat: daftar user yang pernah chat dengan current_user,
    beserta pesan terakhir dan jumlah pesan.
    """
    user_id = str(current_user.id)

    # Ambil semua pesan yang melibatkan user ini
    result = await db.execute(
        select(Message)
        .where(
            or_(
                Message.sender_id == user_id,
                Message.receiver_id == user_id,
            )
        )
        .order_by(Message.created_at.desc())
    )
    messages = result.scalars().all()

    # Group by conversation partner
    conversations = {}
    for msg in messages:
        sender_id_str = str(msg.sender_id)
        receiver_id_str = str(msg.receiver_id)
        partner_id = receiver_id_str if sender_id_str == user_id else sender_id_str
        
        if partner_id not in conversations:
            conversations[partner_id] = {
                "partner_id": partner_id,
                "last_message": msg.content,
                "last_date": msg.created_at.isoformat() if msg.created_at else None,
                "message_count": 0,
            }
        conversations[partner_id]["message_count"] += 1

    # Resolve partner names
    partner_ids = list(conversations.keys())
    partner_names = {}
    if partner_ids:
        for pid in partner_ids:
            try:
                res = await db.execute(select(User).where(User.id == pid))
                user_obj = res.scalar_one_or_none()
                if user_obj:
                    partner_names[str(user_obj.id)] = {
                        "full_name": user_obj.full_name,
                        "role": user_obj.role,
                    }
            except Exception:
                pass

    history = []
    for pid, conv in conversations.items():
        partner_info = partner_names.get(pid, {})
        history.append({
            "partner_id": pid,
            "partner_name": partner_info.get("full_name", "Unknown User"),
            "partner_role": partner_info.get("role", "unknown"),
            "last_message": conv["last_message"],
            "last_date": conv["last_date"],
            "message_count": conv["message_count"],
        })

    # Sort by last_date descending
    history.sort(key=lambda x: x["last_date"] or "", reverse=True)
    return history
