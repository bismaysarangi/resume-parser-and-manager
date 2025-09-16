from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    password: str

class UserInDB(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: bool = False
    hashed_password: str

class UserOut(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: bool = False