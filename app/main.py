from fastapi import FastAPI
from app.routers import auth
from app.routers.chat import router as chat_router
from app.Websocket.chat import router as websocket_router

app = FastAPI(title="Medicall API")

app.include_router(auth.router)
app.include_router(chat_router)
app.include_router(websocket_router)

@app.get("/")
async def root():
    return {"message": "Medicall API is running "}

