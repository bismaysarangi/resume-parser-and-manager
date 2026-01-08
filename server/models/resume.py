from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ResumeData(BaseModel):
    # Basic Contact Information
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    
    # Personal Information (for university recruitment)
    gender: Optional[str] = None  # Male/Female/Other/Prefer not to say
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    nationality: Optional[str] = None
    marital_status: Optional[str] = None  # Single/Married/Other
    
    # Location Information
    current_location: Optional[str] = None  # Current city/state/country
    permanent_address: Optional[str] = None
    hometown: Optional[str] = None
    preferred_locations: List[str] = []  # Willing to relocate to
    willing_to_relocate: Optional[bool] = None
    
    # Work Authorization & Availability
    work_authorization: Optional[str] = None  # Citizen/Permanent Resident/Work Permit/Student Visa
    visa_status: Optional[str] = None
    notice_period: Optional[str] = None  # Immediate/15 days/30 days/60 days/90 days
    availability_date: Optional[str] = None
    
    # Compensation
    current_ctc: Optional[str] = None
    expected_ctc: Optional[str] = None
    current_salary: Optional[str] = None
    expected_salary: Optional[str] = None
    
    # Academic Details
    education: List[Dict[str, Any]] = []
    tenth_marks: Optional[str] = None
    twelfth_marks: Optional[str] = None
    graduation_year: Optional[str] = None
    current_year_of_study: Optional[str] = None  # For current students
    university_roll_number: Optional[str] = None
    student_id: Optional[str] = None
    
    # Professional Information
    summary: Optional[str] = None
    objective: Optional[str] = None
    skills: List[str] = []
    derived_skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    internships: List[Dict[str, Any]] = []  # Separate field for internships
    
    # Additional Qualifications
    achievements: List[Dict[str, Any]] = []
    publications: List[Dict[str, Any]] = []
    research: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    awards: List[Dict[str, Any]] = []
    volunteer_work: List[Dict[str, Any]] = []
    extracurricular_activities: List[Dict[str, Any]] = []  # For university recruitment
    
    # Skills & Interests
    languages: List[Dict[str, Any]] = []  # Spoken languages
    interests: List[str] = []
    hobbies: List[str] = []
    
    # References
    references: List[Dict[str, Any]] = []
    
    # Social & Professional Links
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    personal_website: Optional[str] = None
    
    # Additional Information
    extra_sections: Dict[str, Any] = {}
    
    # University-Specific Fields
    placement_preferences: Optional[str] = None  # Full-time/Internship/Both
    preferred_job_role: Optional[str] = None
    preferred_industry: Optional[str] = None
    career_objective: Optional[str] = None

class ResumeHistory(BaseModel):
    user_email: str
    filename: str
    parsed_data: ResumeData
    parsed_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True