from fastapi import APIRouter, UploadFile, File, Depends
from bson import ObjectId
from services.resume_parser import parse_resume
from services.ai_insights import generate_insights
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
        
        # Generate AI insights
        try:
            insights_response = await generate_insights(result)
            insights_data = insights_response.get("insights", {})
        except Exception as e:
            print(f"Error generating insights: {e}")
            insights_data = {"overallScore": 0, "error": "Failed to generate insights"}
        
        # Store in history with insights
        resume_history = {
            "user_email": current_user.email,
            "filename": file.filename,
            "parsed_data": result,
            "ai_insights": insights_data,
            "parsed_at": datetime.utcnow()
        }
        
        # Insert into database
        inserted = resume_history_collection.insert_one(resume_history)
        
        # Add history ID and insights to response
        result["history_id"] = str(inserted.inserted_id)
        result["ai_insights"] = insights_data
        
        return result
        
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        print(f"Error in parse_resume_endpoint: {e}")
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