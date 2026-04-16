# app/routers/chat.py

from fastapi import APIRouter
from sqlalchemy import select, or_, and_
from app.database import AsyncSessionLocal
from app.models.message import Message

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/messages/{user1}/{user2}")
async def get_messages(user1: str, user2: str):
    async with AsyncSessionLocal() as db:

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