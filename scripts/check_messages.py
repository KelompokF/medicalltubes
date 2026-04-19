import asyncio
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.message import Message


async def main(limit: int = 10):
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Message).order_by(Message.created_at.desc()).limit(limit))
        msgs = res.scalars().all()
        if not msgs:
            print("No messages found in 'messages' table.")
            return
        for m in msgs:
            print(f"[{m.created_at}] {m.sender_id} -> {m.receiver_id}: {m.content}")


if __name__ == "__main__":
    asyncio.run(main())
