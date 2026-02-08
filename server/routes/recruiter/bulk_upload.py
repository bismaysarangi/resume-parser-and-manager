from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_recruiter
from services.resume_parser import parse_resume
from models.resume import ResumeData
from core.database import db
from datetime import datetime, timedelta
from typing import List
import asyncio
import hashlib
import time

router = APIRouter()
resume_history_collection = db["resume_history"]

# Enhanced rate limiting configuration
BASE_DELAY = 2.0  # Reduced from 3.0
MAX_DELAY = 30.0  # Increased from 10.0
RATE_LIMIT_WINDOW = 60  # 1 minute window
MAX_REQUESTS_PER_MINUTE = 8  # Groq limit

# Token tracking
request_timestamps = []

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
    
    # More aggressive rate limiting to avoid 429 errors
    if recent_requests >= MAX_REQUESTS_PER_MINUTE:
        return MAX_DELAY
    elif recent_requests >= MAX_REQUESTS_PER_MINUTE * 0.8:  # 6+ requests
        return BASE_DELAY * 4
    elif recent_requests >= MAX_REQUESTS_PER_MINUTE * 0.6:  # 5+ requests
        return BASE_DELAY * 2.5
    elif recent_requests >= MAX_REQUESTS_PER_MINUTE * 0.4:  # 3+ requests
        return BASE_DELAY * 1.5
    else:
        return BASE_DELAY

def get_time_until_next_available():
    """Calculate when the next API call will be available"""
    now = time.time()
    recent_requests = [ts for ts in request_timestamps if now - ts < RATE_LIMIT_WINDOW]
    
    if len(recent_requests) < MAX_REQUESTS_PER_MINUTE:
        return 0
    
    # Find the oldest request in the window
    oldest_request = min(recent_requests)
    time_until_available = RATE_LIMIT_WINDOW - (now - oldest_request)
    
    return max(0, time_until_available)

def generate_resume_hash(parsed_data: dict) -> str:
    """Generate hash for duplicate detection"""
    unique_string = f"{parsed_data.get('email', '')}|{parsed_data.get('name', '')}|{parsed_data.get('phone', '')}"
    return hashlib.md5(unique_string.lower().encode()).hexdigest()

async def countdown_timer(seconds, message="Waiting"):
    """Display a countdown timer"""
    for remaining in range(int(seconds), 0, -1):
        mins = remaining // 60
        secs = remaining % 60
        if mins > 0:
            print(f"\r⏳ {message}: {mins}m {secs}s remaining...", end="", flush=True)
        else:
            print(f"\r⏳ {message}: {secs}s remaining...     ", end="", flush=True)
        await asyncio.sleep(1)
    print("\r✓ Ready to continue!                    ")

async def parse_single_resume_safe(file: UploadFile, current_user: dict, seen_hashes: set, max_retries=5):
    """
    Parse a single resume with AGGRESSIVE retry logic and countdown timers
    """
    last_error = None
    
    for attempt in range(max_retries):
        try:
            await file.seek(0)
            
            # Check rate limit BEFORE making request
            time_to_wait = get_time_until_next_available()
            if time_to_wait > 0:
                print(f"⚠️  Rate limit reached. Need to wait before processing.")
                await countdown_timer(time_to_wait + 2, "Rate limit cooldown")
            
            request_timestamps.append(time.time())
            
            if attempt > 0:
                print(f"🔄 Retry attempt {attempt + 1}/{max_retries}")
            
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
                gender=parsed_data.get("gender"),
                date_of_birth=parsed_data.get("date_of_birth"),
                age=parsed_data.get("age"),
                nationality=parsed_data.get("nationality"),
                marital_status=parsed_data.get("marital_status"),
                current_location=parsed_data.get("current_location"),
                permanent_address=parsed_data.get("permanent_address"),
                hometown=parsed_data.get("hometown"),
                preferred_locations=parsed_data.get("preferred_locations", []),
                willing_to_relocate=parsed_data.get("willing_to_relocate"),
                work_authorization=parsed_data.get("work_authorization"),
                visa_status=parsed_data.get("visa_status"),
                notice_period=parsed_data.get("notice_period"),
                availability_date=parsed_data.get("availability_date"),
                current_ctc=parsed_data.get("current_ctc"),
                expected_ctc=parsed_data.get("expected_ctc"),
                current_salary=parsed_data.get("current_salary"),
                expected_salary=parsed_data.get("expected_salary"),
                summary=parsed_data.get("summary"),
                objective=parsed_data.get("objective"),
                career_objective=parsed_data.get("career_objective"),
                education=parsed_data.get("education", []),
                tenth_marks=parsed_data.get("tenth_marks"),
                twelfth_marks=parsed_data.get("twelfth_marks"),
                graduation_year=parsed_data.get("graduation_year"),
                current_year_of_study=parsed_data.get("current_year_of_study"),
                university_roll_number=parsed_data.get("university_roll_number"),
                student_id=parsed_data.get("student_id"),
                skills=parsed_data.get("skills", []),
                derived_skills=parsed_data.get("derived_skills", []),
                experience=parsed_data.get("experience", []),
                projects=parsed_data.get("projects", []),
                internships=parsed_data.get("internships", []),
                achievements=parsed_data.get("achievements", []),
                publications=parsed_data.get("publications", []),
                research=parsed_data.get("research", []),
                certifications=parsed_data.get("certifications", []),
                awards=parsed_data.get("awards", []),
                volunteer_work=parsed_data.get("volunteer_work", []),
                extracurricular_activities=parsed_data.get("extracurricular_activities", []),
                languages=parsed_data.get("languages", []),
                interests=parsed_data.get("interests", []),
                hobbies=parsed_data.get("hobbies", []),
                references=parsed_data.get("references", []),
                linkedin_url=parsed_data.get("linkedin_url"),
                github_url=parsed_data.get("github_url"),
                portfolio_url=parsed_data.get("portfolio_url"),
                personal_website=parsed_data.get("personal_website"),
                placement_preferences=parsed_data.get("placement_preferences"),
                preferred_job_role=parsed_data.get("preferred_job_role"),
                preferred_industry=parsed_data.get("preferred_industry"),
                extra_sections=parsed_data.get("extra_sections", {})
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
            
            # Rate limit error - wait and retry
            if any(term in error_msg.lower() for term in ['rate limit', '429', 'too many requests', 'tokens per minute']):
                if attempt < max_retries - 1:
                    wait_time = min((2 ** attempt) * 10, 60)  # 10s, 20s, 40s, 60s
                    print(f"⚠️  Rate limit hit for {file.filename}")
                    print(f"   └─ Current requests in window: {len([ts for ts in request_timestamps if time.time() - ts < RATE_LIMIT_WINDOW])}/{MAX_REQUESTS_PER_MINUTE}")
                    await countdown_timer(wait_time, f"Rate limit retry {attempt + 1}/{max_retries}")
                    
                    try:
                        await file.seek(0)
                    except:
                        pass
                    continue
                else:
                    print(f"❌ Max retries reached for rate limit error")
                    break
                
            # API error - retry
            elif any(term in error_msg for term in ["'choices'", "choices", "Failed to parse", "validation error"]):
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 3
                    print(f"🔄 Parse error for {file.filename}")
                    print(f"   └─ Error: {error_msg[:150]}")
                    await countdown_timer(wait_time, f"Retry {attempt + 1}/{max_retries}")
                    
                    try:
                        await file.seek(0)
                    except:
                        pass
                    continue
                else:
                    print(f"❌ Max retries reached after parse errors")
                    break
            
            # Other errors - retry once
            else:
                if attempt < max_retries - 1:
                    wait_time = 5
                    print(f"⚠️  Unexpected error for {file.filename}: {error_msg[:100]}")
                    await countdown_timer(wait_time, f"Retry {attempt + 1}/{max_retries}")
                    
                    try:
                        await file.seek(0)
                    except:
                        pass
                    continue
                else:
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
    """
    Parse multiple resumes with AGGRESSIVE retry and countdown timers
    """
    if len(files) > 50:
        raise HTTPException(
            status_code=400,
            detail="Maximum 50 resumes allowed per bulk upload"
        )
    
    results = {"successful": [], "failed": [], "duplicates": []}
    seen_hashes = set()

    print(f"\n{'='*70}")
    print(f"🚀 BULK UPLOAD STARTED")
    print(f"{'='*70}")
    print(f"📦 Total files: {len(files)}")
    print(f"⏱️  Estimated time: ~{len(files) * BASE_DELAY / 60:.1f} minutes (minimum)")
    print(f"👤 Recruiter: {current_user.email}")
    print(f"🎯 Rate limit: {MAX_REQUESTS_PER_MINUTE} requests per minute")
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
            print(f"❌ FAILED: {result['error'][:150]}")
        
        # Show progress
        completed = idx + 1
        progress = (completed / len(files)) * 100
        remaining = len(files) - completed
        print(f"\n📊 Progress: {completed}/{len(files)} ({progress:.1f}%) | Remaining: {remaining}")
        
        # Show API stats
        recent_requests = len([ts for ts in request_timestamps if time.time() - ts < RATE_LIMIT_WINDOW])
        print(f"🎯 API Stats:")
        print(f"   └─ Requests in last minute: {recent_requests}/{MAX_REQUESTS_PER_MINUTE}")
        print(f"   └─ Available slots: {MAX_REQUESTS_PER_MINUTE - recent_requests}")
        
        # Show next available time
        time_to_next = get_time_until_next_available()
        if time_to_next > 0:
            next_time = datetime.now() + timedelta(seconds=time_to_next)
            print(f"   └─ Next API call available at: {next_time.strftime('%H:%M:%S')}")
        else:
            print(f"   └─ Next API call: Available now")
        
        # Dynamic delay with countdown
        if idx < len(files) - 1:
            delay = calculate_dynamic_delay()
            print(f"\n⏳ Waiting before next resume...")
            await countdown_timer(delay, "Delay")

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
    print(f"\n🎯 API USAGE:")
    print(f"   └─ Total API calls: {len(request_timestamps)}")
    print(f"   └─ Success rate: {successful_count/(successful_count + failed_count)*100:.1f}%" if (successful_count + failed_count) > 0 else "   └─ Success rate: N/A")
    
    # Show when next bulk upload can start
    time_to_next = get_time_until_next_available()
    if time_to_next > 0:
        next_time = datetime.now() + timedelta(seconds=time_to_next)
        print(f"\n⏰ NEXT UPLOAD:")
        print(f"   └─ Can start next bulk upload at: {next_time.strftime('%H:%M:%S')}")
        print(f"   └─ Time until available: {int(time_to_next)}s")
    else:
        print(f"\n⏰ NEXT UPLOAD:")
        print(f"   └─ Ready for next bulk upload immediately!")
    
    print(f"{'='*70}\n")
    
    # Don't error if some succeeded
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
            "average_time_per_resume": round(elapsed_time / total_files, 2),
            "next_upload_available_in_seconds": max(0, int(time_to_next))
        }
    }