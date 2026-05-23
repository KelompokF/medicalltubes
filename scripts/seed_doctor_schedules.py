"""
Seed script for doctor schedules
This script populates the doctor_schedules table with sample schedules for all active doctors
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.future import select
import uuid

# Add parent directory to path
sys.path.insert(0, '/path/to/app')

from app.database import DATABASE_URL, Base
from app.models.user import User
from app.models.doctor_schedule import DoctorSchedule, DayOfWeek


async def seed_doctor_schedules():
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        # Create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        # Get all active doctors
        result = await session.execute(
            select(User).where(User.role == "doctor", User.is_active == True)
        )
        doctors = result.scalars().all()

        print(f"Found {len(doctors)} active doctors")

        # Sample schedules for each doctor
        schedule_templates = [
            # Morning slots
            {"day": DayOfWeek.monday, "start": "08:00", "end": "12:00"},
            {"day": DayOfWeek.tuesday, "start": "09:00", "end": "13:00"},
            {"day": DayOfWeek.wednesday, "start": "08:00", "end": "12:00"},
            {"day": DayOfWeek.thursday, "start": "09:00", "end": "13:00"},
            {"day": DayOfWeek.friday, "start": "08:00", "end": "12:00"},
            # Afternoon slots
            {"day": DayOfWeek.monday, "start": "14:00", "end": "18:00"},
            {"day": DayOfWeek.wednesday, "start": "14:00", "end": "18:00"},
            {"day": DayOfWeek.friday, "start": "14:00", "end": "18:00"},
            # Saturday slots
            {"day": DayOfWeek.saturday, "start": "10:00", "end": "14:00"},
        ]

        # Create schedules for each doctor
        for doctor in doctors:
            # Check if doctor already has schedules
            existing = await session.execute(
                select(DoctorSchedule).where(DoctorSchedule.doctor_id == doctor.id)
            )
            if existing.scalars().first():
                print(f"Doctor {doctor.full_name} already has schedules, skipping...")
                continue

            for schedule in schedule_templates:
                new_schedule = DoctorSchedule(
                    doctor_id=doctor.id,
                    day_of_week=schedule["day"],
                    start_time=schedule["start"],
                    end_time=schedule["end"],
                    is_active=True,
                )
                session.add(new_schedule)
                print(f"Added schedule for {doctor.full_name}: {schedule['day'].value} {schedule['start']}-{schedule['end']}")

        await session.commit()
        print("✅ Doctor schedules seeded successfully!")

    await engine.dispose()


if __name__ == "__main__":
    # Update this path to your actual app location
    sys.path.insert(0, str(__file__).replace("scripts/seed_doctor_schedules.py", ""))

    asyncio.run(seed_doctor_schedules())
