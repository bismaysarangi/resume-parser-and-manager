from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import CORS_ORIGINS

app = FastAPI()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import auth
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])

from routes import user
app.include_router(user.router, prefix="/api/v1", tags=["user"])

from routes.candidate import resume as candidate_resume, history as candidate_history
app.include_router(
    candidate_resume.router, 
    prefix="/api/candidate", 
    tags=["candidate-resume"]
)
app.include_router(
    candidate_history.router, 
    prefix="/api/candidate", 
    tags=["candidate-history"]
)

from routes.recruiter import candidates as recruiter_candidates
app.include_router(
    recruiter_candidates.router, 
    prefix="/api/recruiter", 
    tags=["recruiter"]
)

@app.get("/")
async def root():
    return {"message": "Resume Parser API is running"}
