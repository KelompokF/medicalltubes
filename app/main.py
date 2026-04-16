from fastapi import FastAPI
from app.routers import auth

app = FastAPI(title="Medicall API")

app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Medicall API is running "}