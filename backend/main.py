from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import CORS_ORIGINS
from routes.auth import router as auth_router

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with the correct prefix
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

@app.get("/")
async def root():
    return {"message": "Resume Parser API is running!"}