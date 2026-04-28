from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, health_record, user, emergency
from app.routers.patient import router as patient_router
from app.routers.dashboard import router as dashboard_router
from app.routers.chat import router as chat_router
from app.routers.chat_history import router as chat_history_router
from app.routers.home_visit import router as home_visit_router
from app.routers.doctor import router as doctor_router
from app.Websocket.chat import router as websocket_router
from app.routers.home_visit import router as home_visit_router
from app.database import engine, Base
# Ensure doctor_profile model is loaded for create_all
import app.models.doctor_profile  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Jalankan startup tasks: buat semua tabel jika belum ada."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Add missing columns to existing 'users' table (create_all won't alter existing tables)
        from sqlalchemy import text
        alter_statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_type VARCHAR",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies VARCHAR",
        ]
        for stmt in alter_statements:
            await conn.execute(text(stmt))
        print("Database tables initialized successfully")
    yield


app = FastAPI(
    title="Medicall API",
    description="Backend API untuk aplikasi kesehatan Medicall",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend origins during development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Daftarkan semua router
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(health_record.router)
app.include_router(patient_router)
app.include_router(dashboard_router)
app.include_router(chat_router)
app.include_router(chat_history_router)
app.include_router(websocket_router)
app.include_router(home_visit_router)  

app.include_router(emergency.router)
app.include_router(doctor_router)



@app.get("/", tags=["Root"])
async def root():
    return {"message": "Medicall API is running 🚀", "docs": "/docs"}
