import asyncio
import uuid
from datetime import datetime

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password


async def seed_doctors(count: int = 20):
    async with AsyncSessionLocal() as session:
        for i in range(1, count + 1):
            email = f"doctor{i}@example.com"
            res = await session.execute(select(User).where(User.email == email))
            existing = res.scalars().first()
            if existing:
                print(f"User {email} already exists, skipping")
                continue

            user = User(
                id=uuid.uuid4(),
                full_name=f"Dr. Test Doctor {i}",
                email=email,
                hashed_password=hash_password("password123"),
                role="doctor",
                is_active=True,
                created_at=datetime.utcnow(),
            )
            session.add(user)
        await session.commit()
        print(f"Seeded up to {count} doctor users (existing emails skipped)")


if __name__ == "__main__":
    asyncio.run(seed_doctors())
import asyncio
import uuid
from datetime import datetime

from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password


async def seed_doctors(count: int = 20):
    async with AsyncSessionLocal() as session:
        # create doctors with emails doctor1@..., etc.
        for i in range(1, count + 1):
            email = f"doctor{i}@example.com"
            # check if exists
            from sqlalchemy import select
            res = await session.execute(select(User).where(User.email == email))
            existing = res.scalars().first()
            if existing:
                print(f"User {email} already exists, skipping")
                continue

            user = User(
                id=uuid.uuid4(),
                full_name=f"Dr. Test Doctor {i}",
                email=email,
                hashed_password=hash_password("password123"),
                is_active=True,
                created_at=datetime.utcnow(),
            )
            session.add(user)
        await session.commit()
        print(f"Seeded {count} doctor users (existing emails skipped)")


if __name__ == "__main__":
    asyncio.run(seed_doctors())
