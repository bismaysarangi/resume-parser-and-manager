from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
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
from routes.recruiter import bulk_upload
app.include_router(bulk_upload.router, prefix="/api/recruiter", tags=["recruiter-bulk"])

@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 50_000_000:  # 50MB
            return JSONResponse(
                status_code=413,
                content={"detail": "File too large. Maximum size is 50MB"}
            )
    return await call_next(request)
@app.get("/")
async def root():
    return {"message": "Resume Parser API is running"}