from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_candidate
from services.resume_parser import parse_resume
from models.resume import ResumeHistory, ResumeData
from core.database import db
from datetime import datetime
import traceback

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
    Parse uploaded resume with comprehensive data extraction (CANDIDATE ONLY)
    """
    try:
        # Parse the resume
        parsed_data = await parse_resume(file)
        
        # Create resume data object with all new fields
        resume_data = ResumeData(
            name=parsed_data.get("name"),
            email=parsed_data.get("email"),
            phone=parsed_data.get("phone"),
            summary=parsed_data.get("summary"),
            objective=parsed_data.get("objective"),
            education=parsed_data.get("education", []),
            skills=parsed_data.get("skills", []),
            derived_skills=parsed_data.get("derived_skills", []),
            experience=parsed_data.get("experience", []),
            projects=parsed_data.get("projects", []),
            tenth_marks=parsed_data.get("10th Marks"),
            twelfth_marks=parsed_data.get("12th Marks"),
            achievements=parsed_data.get("achievements", []),
            publications=parsed_data.get("publications", []),
            research=parsed_data.get("research", []),
            certifications=parsed_data.get("certifications", []),
            awards=parsed_data.get("awards", []),
            volunteer_work=parsed_data.get("volunteer_work", []),
            languages=parsed_data.get("languages", []),
            interests=parsed_data.get("interests", []),
            references=parsed_data.get("references", []),
            extra_sections=parsed_data.get("extra_sections", {})
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
    Enhanced error handling and logging
    """
    try:
        print(f"Generating AI insights for user: {current_user.email}")
        
        # Validate input
        if not request.resume_data:
            raise HTTPException(
                status_code=400, 
                detail="Resume data is required"
            )
        
        # Import here to avoid circular imports
        from services.ai_insights import generate_insights
        
        # Generate insights with timeout
        insights = await generate_insights(request.resume_data)
        
        print(f"✓ Successfully generated insights for {current_user.email}")
        return insights
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        # Log the full error for debugging
        error_trace = traceback.format_exc()
        print(f"❌ Error generating insights for {current_user.email}:")
        print(error_trace)
        
        # Return user-friendly error message
        error_message = str(e)
        if "rate limit" in error_message.lower() or "429" in error_message:
            raise HTTPException(
                status_code=429,
                detail="AI service is currently busy. Please try again in a few moments."
            )
        elif "timeout" in error_message.lower():
            raise HTTPException(
                status_code=504,
                detail="AI service took too long to respond. Please try again."
            )
        elif "choices" in error_message or "Invalid API response" in error_message:
            raise HTTPException(
                status_code=502,
                detail="AI service returned an invalid response. Please try again."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate insights: {error_message}"
            )