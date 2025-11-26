from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_candidate
from services.resume_parser import parse_resume
from models.resume import ResumeHistory, ResumeData
from core.database import db
from datetime import datetime

router = APIRouter()

resume_history_collection = db["resume_history"]

# Request model for AI insights
class AIInsightsRequest(BaseModel):
    resume_data: dict

@router.post("/parse-resume", dependencies=[Depends(require_candidate)])
async def parse_resume_endpoint(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Parse uploaded resume (CANDIDATE ONLY)
    """
    try:
        # Parse the resume
        parsed_data = await parse_resume(file)
        
        # Create resume data object
        resume_data = ResumeData(
            name=parsed_data.get("name"),
            email=parsed_data.get("email"),
            phone=parsed_data.get("phone"),
            education=parsed_data.get("education", []),
            skills=parsed_data.get("skills", []),
            derived_skills=parsed_data.get("derived_skills", []),
            experience=parsed_data.get("experience", []),
            projects=parsed_data.get("projects", []),
            tenth_marks=parsed_data.get("10th Marks"),
            twelfth_marks=parsed_data.get("12th Marks")
        )
        
        # Save to history
        history_entry = {
            "user_email": current_user.email,
            "filename": parsed_data.get("filename"),
            "parsed_data": resume_data.dict(),
            "parsed_at": datetime.utcnow()
        }
        
        resume_history_collection.insert_one(history_entry)
        
        return {
            "message": "Resume parsed successfully",
            "data": resume_data.dict(),
            "filename": parsed_data.get("filename")
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse resume: {str(e)}")

@router.post("/ai-insights", dependencies=[Depends(require_candidate)])
async def get_ai_insights(
    request: AIInsightsRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Generate AI insights for resume (CANDIDATE ONLY)
    """
    try:
        from services.ai_insights import generate_insights
        insights = await generate_insights(request.resume_data)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate insights: {str(e)}")