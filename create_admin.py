import asyncio
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import hash_password

async def create_admin():
    async with AsyncSessionLocal() as db:
        email = "admin@medicall.com"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            print("Admin user already exists.")
            return

        admin_user = User(
            full_name="Administrator",
            email=email,
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True
        )

        db.add(admin_user)
        await db.commit()
        print(f"Admin user created successfully! Email: {email}, Password: admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
