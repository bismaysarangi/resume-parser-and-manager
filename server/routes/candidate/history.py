from fastapi import APIRouter, Depends, HTTPException
from typing import List
from bson import ObjectId
from models.resume import ResumeHistory
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_candidate
from core.database import db

router = APIRouter()

resume_history_collection = db["resume_history"]

@router.get("/resume-history", response_model=List[ResumeHistory], dependencies=[Depends(require_candidate)])
async def get_resume_history(current_user: dict = Depends(get_current_active_user)):
    """
    Get resume parsing history (CANDIDATE ONLY)
    """
    try:
        history = list(resume_history_collection.find(
            {"user_email": current_user.email}
        ).sort("parsed_at", -1))
        
        for item in history:
            item["_id"] = str(item["_id"])
            
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")

@router.delete("/resume-history/{resume_id}", dependencies=[Depends(require_candidate)])
async def delete_resume_history(resume_id: str, current_user: dict = Depends(get_current_active_user)):
    """
    Delete a resume (CANDIDATE ONLY)
    """
    try:
        result = resume_history_collection.delete_one({
            "_id": ObjectId(resume_id),
            "user_email": current_user.email
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Resume not found")
            
        return {"message": "Resume deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete resume: {str(e)}")