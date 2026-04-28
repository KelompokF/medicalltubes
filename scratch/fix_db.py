import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def add_column_and_fix_nulls():
    async with AsyncSessionLocal() as session:
        try:
            # Tambahkan kolom preferred_time
            await session.execute(text("ALTER TABLE home_visit_requests ADD COLUMN preferred_time VARCHAR"))
            print("Column 'preferred_time' added.")
        except Exception as e:
            print(f"Column 'preferred_time' might already exist: {e}")
            
        try:
            # Ubah user_id menjadi nullable (untuk SQLite, ini agak ribet, 
            # tapi kita coba jalankan perintah ALTER jika DB-nya mendukung, 
            # atau biarkan saja jika sudah nullable)
            await session.execute(text("ALTER TABLE home_visit_requests ALTER COLUMN user_id DROP NOT NULL"))
            print("Column 'user_id' is now nullable.")
        except Exception as e:
            print(f"Note on 'user_id' nullability: {e}")
            
        await session.commit()

if __name__ == "__main__":
    asyncio.run(add_column_and_fix_nulls())
