from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_recruiter
from services.resume_parser import parse_resume
from models.resume import ResumeData
from core.database import db
from datetime import datetime
from typing import List
import asyncio
import hashlib
import time

router = APIRouter()
resume_history_collection = db["resume_history"]

# Enhanced rate limiting configuration
BASE_DELAY = 0.5  # Base delay between requests
MAX_DELAY = 5.0   # Maximum delay if rate limited
RATE_LIMIT_WINDOW = 60  # 1 minute window for tracking

# Track request timing for adaptive rate limiting
request_timestamps = []

def is_rate_limited():
    """Check if we're approaching rate limits based on recent requests"""
    now = time.time()
    # Remove timestamps older than our window
    global request_timestamps
    request_timestamps = [ts for ts in request_timestamps if now - ts < RATE_LIMIT_WINDOW]
    
    # If we have many recent requests, slow down
    if len(request_timestamps) > 10:  # More than 10 requests in last minute
        return True
    return False

def calculate_dynamic_delay():
    """Calculate delay based on recent request patterns"""
    if is_rate_limited():
        return min(BASE_DELAY * 3, MAX_DELAY)  # Triple the delay if approaching limits
    return BASE_DELAY

def generate_resume_hash(parsed_data: dict) -> str:
    """
    Generate a hash from resume content to detect duplicates
    Uses email, name, and phone as unique identifiers
    """
    unique_string = f"{parsed_data.get('email', '')}|{parsed_data.get('name', '')}|{parsed_data.get('phone', '')}"
    return hashlib.md5(unique_string.lower().encode()).hexdigest()

async def parse_single_resume_safe(file: UploadFile, current_user: dict, seen_hashes: set, max_retries=3):
    """
    Parse a single resume with enhanced retry logic and rate limit handling
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            await file.seek(0)
            # Record this request timestamp for rate limiting
            request_timestamps.append(time.time())
            
            # Attempt to parse
            parsed_data = await parse_resume(file)
            
            # Validate that we got data back
            if not isinstance(parsed_data, dict):
                raise ValueError("Parser returned invalid data format")
            
            # Generate hash to check for duplicates
            resume_hash = generate_resume_hash(parsed_data)
            
            # Check if this resume is a duplicate
            if resume_hash in seen_hashes:
                return {
                    "success": False,
                    "is_duplicate": True,
                    "error": f"Duplicate resume detected (same email/name/phone as another uploaded resume)"
                }
            
            # Add hash to seen set
            seen_hashes.add(resume_hash)
            
            # Create resume data model
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

            # Create history entry
            history_entry = {
                "recruiter_email": current_user.email,
                "filename": parsed_data.get("filename"),
                "parsed_data": resume_data.dict(),
                "parsed_at": datetime.utcnow(),
                "upload_type": "bulk",
                "candidate_email": parsed_data.get("email"),
                "resume_hash": resume_hash
            }

            # Insert into MongoDB
            result = resume_history_collection.insert_one(history_entry)

            return {
                "success": True,
                "is_duplicate": False,
                "data": {
                    "filename": file.filename,
                    "resume_id": str(result.inserted_id),
                    "data": resume_data.dict()
                }
            }
            
        except Exception as e:
            error_msg = str(e)
            last_error = error_msg
            
            # Enhanced error handling for rate limits
            if any(term in error_msg.lower() for term in ['rate limit', '429', 'too many requests', 'tokens per minute']):
                # Exponential backoff for rate limits
                wait_time = min((2 ** attempt) * 2, 30)  # 2s, 4s, 8s, max 30s
                print(f"Rate limit hit for {file.filename}. Waiting {wait_time}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
                
                # Reset file pointer for retry
                try:
                    await file.seek(0)
                except:
                    pass
                continue
                
            # Check if it's an API error that might succeed on retry
            elif any(term in error_msg for term in ["'choices'", "choices", "Failed to parse resume"]):
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 3  # 3s, 6s, 9s
                    print(f"API error for {file.filename}. Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    
                    # Reset file pointer for retry
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
        "is_duplicate": False,
        "error": last_error
    }

@router.post("/bulk-parse-resume", dependencies=[Depends(require_recruiter)])
async def bulk_parse_resume_endpoint(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_active_user)
):
    """
    Parse multiple resumes for recruiter bulk upload with enhanced rate limiting
    """
    # Validate file count to prevent abuse
    if len(files) > 50:
        raise HTTPException(
            status_code=400,
            detail="Maximum 50 resumes allowed per bulk upload"
        )
    
    results = {"successful": [], "failed": [], "duplicates": []}
    seen_hashes = set()

    print(f"Processing {len(files)} resumes sequentially with enhanced rate limiting...")
    
    # Process files SEQUENTIALLY with dynamic delays
    for idx, file in enumerate(files):
        print(f"Processing file {idx + 1}/{len(files)}: {file.filename}")
        
        # Parse with retry logic and duplicate detection
        result = await parse_single_resume_safe(file, current_user, seen_hashes)
        
        if result["success"]:
            results["successful"].append(result["data"])
        elif result.get("is_duplicate"):
            results["duplicates"].append({
                "filename": file.filename,
                "reason": result["error"]
            })
        else:
            results["failed"].append({
                "filename": file.filename,
                "error": result["error"]
            })
        
        # Dynamic delay based on current rate limiting status
        if idx < len(files) - 1:
            delay = calculate_dynamic_delay()
            print(f"Waiting {delay}s before next resume (adaptive rate limiting)...")
            await asyncio.sleep(delay)

    # Return results even if some failed
    total_files = len(files)
    successful_count = len(results["successful"])
    failed_count = len(results["failed"])
    duplicate_count = len(results["duplicates"])
    
    print(f"Bulk parsing complete: {successful_count}/{total_files} successful, {failed_count}/{total_files} failed, {duplicate_count}/{total_files} duplicates")
    
    # Only raise error if ALL files failed
    if successful_count == 0 and duplicate_count == 0:
        raise HTTPException(
            status_code=500, 
            detail=f"All {total_files} resumes failed to parse. Check API key and rate limits."
        )

    return {
        **results,
        "summary": {
            "total": total_files,
            "successful": successful_count,
            "failed": failed_count,
            "duplicates": duplicate_count
        }
    }