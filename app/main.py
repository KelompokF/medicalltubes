from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, health_record, user, emergency
from app.routers.patient import router as patient_router
from app.routers.chat import router as chat_router
from app.Websocket.chat import router as websocket_router

app = FastAPI(title="Medicall API")

# CORS — allow frontend origins during development
# Allow any localhost/127.0.0.1 origin on any port during development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(patient_router)
app.include_router(chat_router)
app.include_router(websocket_router)
app.include_router(health_record.router)
app.include_router(emergency.router)


@app.get("/")
async def root():
    return {"message": "Medicall API is running "}

