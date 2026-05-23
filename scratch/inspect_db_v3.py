import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def inspect():
    async with AsyncSessionLocal() as session:
        try:
            # Query table information schema for columns
            res = await session.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'home_visit_requests_v3'
            """))
            columns = res.fetchall()
            print("Columns in home_visit_requests_v3:")
            for col in columns:
                print(f" - {col[0]} ({col[1]})")
        except Exception as e:
            print(f"Error inspecting table: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
