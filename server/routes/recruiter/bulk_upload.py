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

# Rate limiting configuration
BASE_DELAY = 3.0
MAX_DELAY = 10.0
RATE_LIMIT_WINDOW = 60 * 8
MAX_REQUESTS_PER_MINUTE = 8

# ✅ Token tracking
request_timestamps = []
total_tokens_used = 0
total_prompt_tokens = 0
total_completion_tokens = 0

def is_rate_limited():
    """Check if we're approaching rate limits"""
    now = time.time()
    global request_timestamps
    request_timestamps = [ts for ts in request_timestamps if now - ts < RATE_LIMIT_WINDOW]
    
    if len(request_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        return True
    return False

def calculate_dynamic_delay():
    """Calculate delay based on recent request patterns"""
    now = time.time()
    recent_requests = len([ts for ts in request_timestamps if now - ts < RATE_LIMIT_WINDOW])
    
    if recent_requests >= MAX_REQUESTS_PER_MINUTE:
        return MAX_DELAY
    elif recent_requests >= MAX_REQUESTS_PER_MINUTE * 0.75:
        return BASE_DELAY * 2
    elif recent_requests >= MAX_REQUESTS_PER_MINUTE * 0.5:
        return BASE_DELAY * 1.5
    else:
        return BASE_DELAY

def generate_resume_hash(parsed_data: dict) -> str:
    """Generate hash for duplicate detection"""
    unique_string = f"{parsed_data.get('email', '')}|{parsed_data.get('name', '')}|{parsed_data.get('phone', '')}"
    return hashlib.md5(unique_string.lower().encode()).hexdigest()

async def parse_single_resume_safe(file: UploadFile, current_user: dict, seen_hashes: set, max_retries=3):
    """Parse a single resume with enhanced retry logic"""
    last_error = None
    
    for attempt in range(max_retries):
        try:
            await file.seek(0)
            request_timestamps.append(time.time())
            
            parsed_data = await parse_resume(file)
            
            if not isinstance(parsed_data, dict):
                raise ValueError("Parser returned invalid data format")
            
            resume_hash = generate_resume_hash(parsed_data)
            
            if resume_hash in seen_hashes:
                return {
                    "success": False,
                    "is_duplicate": True,
                    "error": f"Duplicate resume detected"
                }
            
            seen_hashes.add(resume_hash)
            
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

            history_entry = {
                "recruiter_email": current_user.email,
                "filename": parsed_data.get("filename"),
                "parsed_data": resume_data.dict(),
                "parsed_at": datetime.utcnow(),
                "upload_type": "bulk",
                "candidate_email": parsed_data.get("email"),
                "resume_hash": resume_hash
            }

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
            
            if any(term in error_msg.lower() for term in ['rate limit', '429', 'too many requests', 'tokens per minute']):
                wait_time = min((2 ** attempt) * 5, 30)
                print(f"⏳ Rate limit for {file.filename}. Waiting {wait_time}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
                
                try:
                    await file.seek(0)
                except:
                    pass
                continue
                
            elif any(term in error_msg for term in ["'choices'", "choices", "Failed to parse resume"]):
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 4
                    print(f"🔄 API error for {file.filename}. Retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    
                    try:
                        await file.seek(0)
                    except:
                        pass
                    continue
            
            break
    
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
    """Parse multiple resumes with improved rate limiting and token tracking"""
    if len(files) > 50:
        raise HTTPException(
            status_code=400,
            detail="Maximum 50 resumes allowed per bulk upload"
        )
    
    # ✅ Reset token counters for this batch
    global total_tokens_used, total_prompt_tokens, total_completion_tokens
    total_tokens_used = 0
    total_prompt_tokens = 0
    total_completion_tokens = 0
    
    results = {"successful": [], "failed": [], "duplicates": []}
    seen_hashes = set()

    print(f"\n{'='*70}")
    print(f"🚀 BULK UPLOAD STARTED")
    print(f"{'='*70}")
    print(f"📦 Total files: {len(files)}")
    print(f"⏱️  Estimated time: ~{len(files) * BASE_DELAY / 60:.1f} minutes")
    print(f"👤 Recruiter: {current_user.email}")
    print(f"{'='*70}\n")
    
    start_time = time.time()
    
    for idx, file in enumerate(files):
        print(f"\n{'='*70}")
        print(f"📄 [{idx + 1}/{len(files)}] Processing: {file.filename}")
        print(f"{'='*70}")
        
        result = await parse_single_resume_safe(file, current_user, seen_hashes)
        
        if result["success"]:
            results["successful"].append(result["data"])
            print(f"✅ SUCCESS")
        elif result.get("is_duplicate"):
            results["duplicates"].append({
                "filename": file.filename,
                "reason": result["error"]
            })
            print(f"⚠️  DUPLICATE")
        else:
            results["failed"].append({
                "filename": file.filename,
                "error": result["error"]
            })
            print(f"❌ FAILED: {result['error'][:100]}")
        
        # Show progress
        completed = idx + 1
        progress = (completed / len(files)) * 100
        print(f"\n📊 Progress: {completed}/{len(files)} ({progress:.1f}%)")
        
        # Dynamic delay
        if idx < len(files) - 1:
            delay = calculate_dynamic_delay()
            print(f"⏳ Waiting {delay:.1f}s before next resume...")
            await asyncio.sleep(delay)

    elapsed_time = time.time() - start_time
    
    total_files = len(files)
    successful_count = len(results["successful"])
    failed_count = len(results["failed"])
    duplicate_count = len(results["duplicates"])
    
    print(f"\n{'='*70}")
    print(f"🏁 BULK UPLOAD COMPLETED")
    print(f"{'='*70}")
    print(f"📊 RESULTS:")
    print(f"   ✅ Successful: {successful_count}/{total_files} ({successful_count/total_files*100:.1f}%)")
    print(f"   ⚠️  Duplicates: {duplicate_count}/{total_files} ({duplicate_count/total_files*100:.1f}%)")
    print(f"   ❌ Failed: {failed_count}/{total_files} ({failed_count/total_files*100:.1f}%)")
    print(f"\n⏱️  TIME:")
    print(f"   └─ Total: {elapsed_time:.1f}s ({elapsed_time/60:.1f} min)")
    print(f"   └─ Average per resume: {elapsed_time/total_files:.1f}s")
    
    # ✅ Show cumulative token usage (if available)
    # Note: Token tracking happens in resume_parser.py via print statements
    # This is a placeholder for future enhancement where we track tokens globally
    print(f"\n💡 TIP: Check individual resume logs above for detailed token usage")
    print(f"{'='*70}\n")
    
    # Only error if ALL failed
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
            "duplicates": duplicate_count,
            "elapsed_time_seconds": round(elapsed_time, 2),
            "average_time_per_resume": round(elapsed_time / total_files, 2)
        }
    }