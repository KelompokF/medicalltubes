
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.chat_room import ChatRoom

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(ChatRoom))
        rooms = result.scalars().all()
        print(f"Total rooms: {len(rooms)}")
        for r in rooms:
            print(f"Room: {r.id}, Patient: {r.patient_id}, Doctor: {r.doctor_id}")

if __name__ == "__main__":
    asyncio.run(main())
