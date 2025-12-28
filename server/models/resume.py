from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ResumeData(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: List[Dict[str, Any]] = []
    skills: List[str] = []
    derived_skills: List[str] = []  
    experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    tenth_marks: Optional[str] = None
    twelfth_marks: Optional[str] = None
    achievements: List[Dict[str, Any]] = []
    publications: List[Dict[str, Any]] = []
    research: List[Dict[str, Any]] = []
    certifications: List[Dict[str, Any]] = []
    awards: List[Dict[str, Any]] = []
    volunteer_work: List[Dict[str, Any]] = []
    languages: List[Dict[str, Any]] = []
    interests: List[str] = []
    summary: Optional[str] = None
    objective: Optional[str] = None
    references: List[Dict[str, Any]] = []
    extra_sections: Dict[str, Any] = {}  

class ResumeHistory(BaseModel):
    user_email: str
    filename: str
    parsed_data: ResumeData
    parsed_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True