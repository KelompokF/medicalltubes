from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, health_record, user, emergency, tracking
from app.routers.patient import router as patient_router
from app.routers.dashboard import router as dashboard_router
from app.routers.chat import router as chat_router
from app.routers.home_visit import router as home_visit_router
from app.routers.doctor import router as doctor_router
from app.routers.doctor_patients import router as doctor_patients_router
from app.routers.doctor_schedule import router as doctor_schedule_router
from app.Websocket.chat import router as websocket_router
from app.Websocket.tracking_manager import tracking_manager
from app.database import engine, Base, get_db
from app.routers.auth import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.emergency_request import EmergencyRequest
from sqlalchemy import select
# Ensure models are loaded for create_all
import app.models.doctor_profile  # noqa: F401
import app.models.doctor_schedule  # noqa: F401
import app.models.chat_room  # noqa: F401
import app.models.prescription  # noqa: F401
import app.models.emergency_request  # noqa: F401
import app.models.home_visit  # noqa: F401
import app.models.consultation  # noqa: F401


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
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS location_sharing_enabled BOOLEAN DEFAULT FALSE",
            "ALTER TABLE health_records ADD COLUMN IF NOT EXISTS diagnosed_conditions VARCHAR",
            "ALTER TABLE health_records ADD COLUMN IF NOT EXISTS allergies VARCHAR",
            "ALTER TABLE health_records ADD COLUMN IF NOT EXISTS current_medications VARCHAR",
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
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:5173"],
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
app.include_router(websocket_router)
app.include_router(home_visit_router)  

from app.routers.prescription import router as prescription_router
app.include_router(prescription_router)
app.include_router(emergency.router)
app.include_router(tracking.router, prefix="/api")
app.include_router(doctor_schedule_router)  # must be BEFORE doctor_router (specific before wildcard)
app.include_router(doctor_patients_router)
app.include_router(doctor_router)



@app.websocket("/ws/tracking/{emergency_request_id}")
async def websocket_tracking_endpoint(
    websocket: WebSocket,
    emergency_request_id: int,
    token: str = None
):
    """
    WebSocket endpoint for real-time ambulance tracking.
    
    Args:
        websocket: WebSocket connection
        emergency_request_id: ID of the emergency request to track
        token: Authentication token (passed as query parameter)
    """
    # Accept the WebSocket connection first
    await websocket.accept()
    
    try:
        # Authenticate user
        if not token:
            await websocket.send_json({
                "type": "error",
                "message": "Authentication token required"
            })
            await websocket.close(code=1008)  # Policy violation
            return
        
        # Get database session
        async for db in get_db():
            try:
                # Verify token and get user
                from app.routers.auth import verify_token
                payload = verify_token(token)
                if not payload:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid or expired token"
                    })
                    await websocket.close(code=1008)
                    return
                
                user_id = payload.get("user_id")
                if not user_id:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid token payload"
                    })
                    await websocket.close(code=1008)
                    return
                
                # Verify user has access to this emergency request
                result = await db.execute(
                    select(EmergencyRequest).where(
                        EmergencyRequest.id == emergency_request_id
                    )
                )
                emergency = result.scalar_one_or_none()
                
                if not emergency:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Emergency request not found"
                    })
                    await websocket.close(code=1008)
                    return
                
                # Check if user is the requester or assigned ambulance driver
                if emergency.user_id != user_id and emergency.ambulance_driver_id != user_id:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Access denied to this emergency request"
                    })
                    await websocket.close(code=1008)
                    return
                
                # Connect to tracking room
                await tracking_manager.connect(emergency_request_id, websocket)
                
                # Send initial connection success message
                await websocket.send_json({
                    "type": "connected",
                    "message": "Connected to tracking room",
                    "emergency_request_id": emergency_request_id
                })
                
                # Keep connection alive and handle incoming messages
                try:
                    while True:
                        # Receive messages from client (e.g., ping/pong for keep-alive)
                        data = await websocket.receive_json()
                        
                        # Handle ping messages
                        if data.get("type") == "ping":
                            await websocket.send_json({"type": "pong"})
                        
                except WebSocketDisconnect:
                    # Client disconnected normally
                    pass
                
            finally:
                # Always disconnect from tracking room
                tracking_manager.disconnect(emergency_request_id, websocket)
                break
    
    except Exception as e:
        # Handle any unexpected errors
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Server error: {str(e)}"
            })
        except:
            pass
        finally:
            try:
                await websocket.close(code=1011)  # Internal error
            except:
                pass


@app.get("/", tags=["Root"])
async def root():
    return {"message": "Medicall API is running 🚀", "docs": "/docs"}
