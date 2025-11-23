# server/routes/recruiter/bulk_upload.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_recruiter
from services.resume_parser import parse_resume
from models.resume import ResumeData
from core.database import db
from datetime import datetime
from typing import List

router = APIRouter()
resume_history_collection = db["resume_history"]

@router.post("/bulk-parse-resume", dependencies=[Depends(require_recruiter)])
async def bulk_parse_resume_endpoint(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Parse multiple resumes for recruiter bulk upload (RECRUITER ONLY)
    """
    results = {"successful": [], "failed": []}

    for file in files:
        try:
            parsed_data = await parse_resume(file)  # must return dict with name, email, filename etc.

            resume_data = ResumeData(
                name=parsed_data.get("name"),
                email=parsed_data.get("email"),
                phone=parsed_data.get("phone"),
                education=parsed_data.get("education", []),
                skills=parsed_data.get("skills", []),
                experience=parsed_data.get("experience", []),
                projects=parsed_data.get("projects", []),
                tenth_marks=parsed_data.get("10th Marks"),
                twelfth_marks=parsed_data.get("12th Marks")
            )

            history_entry = {
                "recruiter_email": current_user.email,
                "filename": parsed_data.get("filename"),
                "parsed_data": resume_data.dict(),
                "parsed_at": datetime.utcnow(),
                "upload_type": "bulk",
                "candidate_email": parsed_data.get("email"),
            }

            result = resume_history_collection.insert_one(history_entry)

            results["successful"].append({
                "filename": file.filename,
                "resume_id": str(result.inserted_id),
                "data": resume_data.dict()
            })

        except Exception as e:
            results["failed"].append({
                "filename": file.filename,
                "error": str(e)
            })

    if len(results["successful"]) == 0:
        raise HTTPException(status_code=500, detail="All resumes failed to parse")

    return results
