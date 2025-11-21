from pydantic import BaseModel
from typing import Optional
from enum import Enum

class UserRole(str, Enum):
    CANDIDATE = "candidate"
    RECRUITER = "recruiter"

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    password: str
    role: UserRole = UserRole.CANDIDATE  # Default to candidate

class UserInDB(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: bool = False
    hashed_password: str
    role: UserRole = UserRole.CANDIDATE
    company_name: Optional[str] = None  # For recruiters
    created_at: Optional[str] = None

class UserOut(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: bool = False
    role: UserRole
    company_name: Optional[str] = None