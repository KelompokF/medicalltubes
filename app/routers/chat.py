from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List

from app.database import get_db
from app.models.message import Message
from app.schemas.chat import MessageResponse

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/messages/{user1}/{user2}", response_model=List[MessageResponse])
async def get_messages(user1: str, user2: str, db: AsyncSession = Depends(get_db)):
    """Ambil riwayat pesan antara dua user, diurutkan dari terlama ke terbaru."""
    result = await db.execute(
        select(Message).where(
            or_(
                and_(Message.sender_id == user1, Message.receiver_id == user2),
                and_(Message.sender_id == user2, Message.receiver_id == user1)
            )
        ).order_by(Message.created_at.asc())
    )
    messages = result.scalars().all()
    return messages