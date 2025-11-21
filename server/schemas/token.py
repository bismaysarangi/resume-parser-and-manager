from pydantic import BaseModel
from models.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str
    role: UserRole
    username: str

class TokenData(BaseModel):
    username: str | None = None
    role: str | None = None