from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, health_record, user
from app.routers.patient import router as patient_router
from app.routers.chat import router as chat_router
from app.Websocket.chat import router as websocket_router
from app.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Jalankan startup tasks: buat semua tabel jika belum ada."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
app.include_router(chat_router)
app.include_router(websocket_router)



@app.get("/", tags=["Root"])
async def root():
    return {"message": "Medicall API is running 🚀", "docs": "/docs"}
