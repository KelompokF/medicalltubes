from contextlib import asynccontextmanager
import socket

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
from app.core.config import get_database_connection_hint, settings
from app.database import engine, Base
# Ensure doctor_profile model is loaded for create_all
import app.models.doctor_profile  # noqa: F401
import app.models.emergency_request  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Jalankan startup tasks: buat semua tabel jika belum ada."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except (socket.gaierror, OSError) as exc:
        hint = get_database_connection_hint(settings.DATABASE_URL)
        if hint:
            raise RuntimeError(hint) from exc
        raise
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
app.include_router(home_visit_router)
app.include_router(websocket_router)
app.include_router(emergency.router)
app.include_router(doctor_router)



@app.get("/", tags=["Root"])
async def root():
    return {"message": "Medicall API is running 🚀", "docs": "/docs"}
