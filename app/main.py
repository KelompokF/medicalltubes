from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, health_record, user
from app.routers.chat import router as chat_router
from app.Websocket.chat import router as websocket_router

app = FastAPI(title="Medicall API")

# CORS — allow frontend origins during development
origins = [
    "http://localhost:8080",
    "http://localhost:8081",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user.router)
app.include_router(chat_router)
app.include_router(websocket_router)
app.include_router(health_record.router)


@app.get("/")
async def root():
    return {"message": "Medicall API is running "}

