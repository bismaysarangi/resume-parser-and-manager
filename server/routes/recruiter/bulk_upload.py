# server/routes/recruiter/bulk_upload.py
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_recruiter
from services.resume_parser import parse_resume
from models.resume import ResumeData
from core.database import db
from datetime import datetime
from typing import List
import asyncio

router = APIRouter()
resume_history_collection = db["resume_history"]

# Rate limiting configuration (lighter delay since model is fixed)
DELAY_BETWEEN_REQUESTS = 0.5  # 0.5 seconds between each resume


async def parse_single_resume_safe(file: UploadFile, current_user: dict, max_retries=2):
    """
    Parse a single resume with retry logic and error handling
    Returns: dict with 'success' (bool), 'data' or 'error'
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            # Attempt to parse
            parsed_data = await parse_resume(file)
            
            # Validate that we got data back
            if not isinstance(parsed_data, dict):
                raise ValueError("Parser returned invalid data format")
            
            # Create resume data model
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

            # Create history entry
            history_entry = {
                "recruiter_email": current_user.email,
                "filename": parsed_data.get("filename"),
                "parsed_data": resume_data.dict(),
                "parsed_at": datetime.utcnow(),
                "upload_type": "bulk",
                "candidate_email": parsed_data.get("email"),
            }

            # Insert into MongoDB
            result = resume_history_collection.insert_one(history_entry)

            return {
                "success": True,
                "data": {
                    "filename": file.filename,
                    "resume_id": str(result.inserted_id),
                    "data": resume_data.dict()
                }
            }
            
        except Exception as e:
            error_msg = str(e)
            last_error = error_msg
            
            # Check if it's an API error that might succeed on retry
            if "'choices'" in error_msg or "choices" in error_msg or "Failed to parse resume" in error_msg:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 3  # 3s, 6s, 9s
                    print(f"API error for {file.filename}. Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    
                    # Need to reset file pointer for retry
                    try:
                        await file.seek(0)
                    except:
                        pass
                    
                    continue
            
            # For other errors, don't retry
            break
    
    # All retries failed
    return {
        "success": False,
        "error": last_error
    }


@router.post("/bulk-parse-resume", dependencies=[Depends(require_recruiter)])
async def bulk_parse_resume_endpoint(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Parse multiple resumes for recruiter bulk upload (RECRUITER ONLY)
    NOW WITH SEQUENTIAL PROCESSING AND RATE LIMITING
    """
    results = {"successful": [], "failed": []}

    print(f"Processing {len(files)} resumes sequentially with rate limiting...")
    
    # Process files SEQUENTIALLY with delays between each
    for idx, file in enumerate(files):
        print(f"Processing file {idx + 1}/{len(files)}: {file.filename}")
        
        # Parse with retry logic
        result = await parse_single_resume_safe(file, current_user)
        
        if result["success"]:
            results["successful"].append(result["data"])
        else:
            results["failed"].append({
                "filename": file.filename,
                "error": result["error"]
            })
        
        # Add delay between requests to avoid rate limiting
        # Skip delay after the last file
        if idx < len(files) - 1:
            print(f"Waiting {DELAY_BETWEEN_REQUESTS}s before next resume...")
            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)

    # Return results even if some failed
    total_files = len(files)
    successful_count = len(results["successful"])
    failed_count = len(results["failed"])
    
    print(f"Bulk parsing complete: {successful_count}/{total_files} successful, {failed_count}/{total_files} failed")
    
    # Only raise error if ALL files failed
    if successful_count == 0:
        raise HTTPException(
            status_code=500, 
            detail=f"All {total_files} resumes failed to parse. Check API key and rate limits."
        )

    return {
        **results,
        "summary": {
            "total": total_files,
            "successful": successful_count,
            "failed": failed_count
        }
    }