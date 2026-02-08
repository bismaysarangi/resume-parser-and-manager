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
    ✅ FIXED: Now saves ALL personal information fields to database
    """
    try:
        # Parse the resume
        parsed_data = await parse_resume(file)
        
        # ✅ FIX: Create resume data object with ALL fields from parsed_data
        resume_data = ResumeData(
            # Basic contact info
            name=parsed_data.get("name"),
            email=parsed_data.get("email"),
            phone=parsed_data.get("phone"),
            
            # ✅ Personal information (was missing before!)
            gender=parsed_data.get("gender"),
            date_of_birth=parsed_data.get("date_of_birth"),
            age=parsed_data.get("age"),
            nationality=parsed_data.get("nationality"),
            marital_status=parsed_data.get("marital_status"),
            
            # ✅ Location information
            current_location=parsed_data.get("current_location"),
            permanent_address=parsed_data.get("permanent_address"),
            hometown=parsed_data.get("hometown"),
            preferred_locations=parsed_data.get("preferred_locations", []),
            willing_to_relocate=parsed_data.get("willing_to_relocate"),
            
            # Work authorization & availability
            work_authorization=parsed_data.get("work_authorization"),
            visa_status=parsed_data.get("visa_status"),
            notice_period=parsed_data.get("notice_period"),
            availability_date=parsed_data.get("availability_date"),
            
            # Compensation
            current_ctc=parsed_data.get("current_ctc"),
            expected_ctc=parsed_data.get("expected_ctc"),
            current_salary=parsed_data.get("current_salary"),
            expected_salary=parsed_data.get("expected_salary"),
            
            # Professional info
            summary=parsed_data.get("summary"),
            objective=parsed_data.get("objective"),
            career_objective=parsed_data.get("career_objective"),
            
            # Academic details
            education=parsed_data.get("education", []),
            tenth_marks=parsed_data.get("tenth_marks"),
            twelfth_marks=parsed_data.get("twelfth_marks"),
            graduation_year=parsed_data.get("graduation_year"),
            current_year_of_study=parsed_data.get("current_year_of_study"),
            university_roll_number=parsed_data.get("university_roll_number"),
            student_id=parsed_data.get("student_id"),
            
            # Skills & experience
            skills=parsed_data.get("skills", []),
            derived_skills=parsed_data.get("derived_skills", []),
            experience=parsed_data.get("experience", []),
            projects=parsed_data.get("projects", []),
            internships=parsed_data.get("internships", []),
            
            # Achievements & qualifications
            achievements=parsed_data.get("achievements", []),
            publications=parsed_data.get("publications", []),
            research=parsed_data.get("research", []),
            certifications=parsed_data.get("certifications", []),
            awards=parsed_data.get("awards", []),
            volunteer_work=parsed_data.get("volunteer_work", []),
            extracurricular_activities=parsed_data.get("extracurricular_activities", []),
            
            # Languages & interests
            languages=parsed_data.get("languages", []),
            interests=parsed_data.get("interests", []),
            hobbies=parsed_data.get("hobbies", []),
            
            # References
            references=parsed_data.get("references", []),
            
            # Social & professional links
            linkedin_url=parsed_data.get("linkedin_url"),
            github_url=parsed_data.get("github_url"),
            portfolio_url=parsed_data.get("portfolio_url"),
            personal_website=parsed_data.get("personal_website"),
            
            # Additional information
            extra_sections=parsed_data.get("extra_sections", {}),
            
            # University-specific fields
            placement_preferences=parsed_data.get("placement_preferences"),
            preferred_job_role=parsed_data.get("preferred_job_role"),
            preferred_industry=parsed_data.get("preferred_industry")
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