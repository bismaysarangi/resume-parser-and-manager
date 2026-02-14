from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_recruiter
from core.database import db
from datetime import datetime

router = APIRouter()

resume_history_collection = db["resume_history"]
recruiter_databases = db["recruiter_databases"]

@router.get("/candidates", dependencies=[Depends(require_recruiter)])
async def get_all_candidates(current_user: dict = Depends(get_current_active_user)):
    """
    Get all resumes saved by this recruiter (RECRUITER ONLY)
    """
    try:
        candidates = list(resume_history_collection.find(
            {"recruiter_email": current_user.email}
        ).sort("parsed_at", -1))
        
        for item in candidates:
            item["_id"] = str(item["_id"])
            
        return candidates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch candidates: {str(e)}")

@router.post("/candidates/{resume_id}/save", dependencies=[Depends(require_recruiter)])
async def save_candidate(
    resume_id: str, 
    current_user: dict = Depends(get_current_active_user)
):
    """
    Save a candidate resume to recruiter's database (RECRUITER ONLY)
    """
    try:
        resume = resume_history_collection.find_one({"_id": ObjectId(resume_id)})
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        # Add recruiter reference
        resume_history_collection.update_one(
            {"_id": ObjectId(resume_id)},
            {"$set": {
                "saved_by_recruiters": resume.get("saved_by_recruiters", []) + [current_user.email],
                "saved_at": datetime.utcnow()
            }}
        )
        
        return {"message": "Candidate saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save candidate: {str(e)}")

@router.get("/candidates/{resume_id}", dependencies=[Depends(require_recruiter)])
async def get_candidate_details(
    resume_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Get detailed view of a candidate (RECRUITER ONLY)
    """
    try:
        resume = resume_history_collection.find_one({"_id": ObjectId(resume_id)})
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        
        resume["_id"] = str(resume["_id"])
        return resume
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch candidate: {str(e)}")

@router.delete("/candidates/{resume_id}", dependencies=[Depends(require_recruiter)])
async def delete_candidate(
    resume_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Delete a candidate resume from recruiter's database (RECRUITER ONLY)
    """
    try:
        # Verify the resume exists and belongs to this recruiter
        resume = resume_history_collection.find_one({
            "_id": ObjectId(resume_id),
            "recruiter_email": current_user.email
        })
        
        if not resume:
            raise HTTPException(
                status_code=404, 
                detail="Resume not found or you don't have permission to delete it"
            )
        
        # Delete the resume
        result = resume_history_collection.delete_one({
            "_id": ObjectId(resume_id),
            "recruiter_email": current_user.email
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Failed to delete resume")
        
        return {
            "message": "Resume deleted successfully",
            "deleted_id": resume_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete resume: {str(e)}")