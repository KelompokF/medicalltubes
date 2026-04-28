import asyncio
from app.database import engine, Base
from app.models.user import User
from app.models.home_visit import HomeVisit, HomeVisitRequest
from app.models.patient_profile import PatientProfile
from app.models.consultation import Consultation
from app.models.ambulance import AmbulanceService
from app.models.doctor_profile import DoctorProfile
from app.models.health_record import HealthRecord
from app.models.message import Message
from app.models.emergency import Emergency

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully.")

if __name__ == "__main__":
    asyncio.run(init_models())
