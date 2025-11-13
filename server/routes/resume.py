from fastapi import APIRouter, UploadFile, File, Depends
from bson import ObjectId
from services.resume_parser import parse_resume
from services.ai_insights import generate_insights
from models.resume import ResumeHistory, ResumeData
from dependencies.auth import get_current_active_user
from core.database import db
from datetime import datetime

router = APIRouter()

# Collection for resume history
resume_history_collection = db["resume_history"]

@router.post("/parse-resume")
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Parse resume file, extract structured data and store in history
    """
    try:
        # Parse resume
        result = await parse_resume(file)
        
        # Store in history
        resume_history = {
            "user_email": current_user.email,
            "filename": file.filename,
            "parsed_data": result,
            "parsed_at": datetime.utcnow()
        }
        
        # Insert into database
        inserted = resume_history_collection.insert_one(resume_history)
        
        # Add history ID to response
        result["history_id"] = str(inserted.inserted_id)
        
        return result
        
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {
            "error": "Failed to parse resume",
            "details": str(e)
        }

@router.post("/ai-insights")
async def get_ai_insights(resume_data: dict):
    """
    Generate AI-powered career insights based on parsed resume data
    """
    try:
        insights = await generate_insights(resume_data)
        return insights
    except Exception as e:
        return {
            "error": "Failed to generate insights",
            "details": str(e)
        }
    