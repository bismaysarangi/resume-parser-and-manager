from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta, datetime
from core.database import users_collection
from core.security import verify_password, get_password_hash, create_access_token
from core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from models.user import UserCreate, UserInDB, UserOut, UserRole
from schemas.token import Token
from dependencies.auth import get_user_by_email, get_current_active_user

router = APIRouter()

def authenticate_user(email: str, password: str):
    user = get_user_by_email(email)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def create_user(user: UserCreate):
    hashed_password = get_password_hash(user.password)
    user_dict = {
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name or "",
        "hashed_password": hashed_password,
        "disabled": False,
        "role": user.role.value,  # Store role as string
        "company_name": None,
        "created_at": datetime.utcnow().isoformat()
    }
    users_collection.insert_one(user_dict)
    return UserInDB(**user_dict)

@router.post("/signup", response_model=UserOut)
async def signup(user: UserCreate):
    existing_user = get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = create_user(user)
    print(f"New {user.role.value} created: {new_user.email}")
    
    return UserOut(
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        disabled=new_user.disabled,
        role=UserRole(new_user.role),
        company_name=new_user.company_name
    )

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": UserRole(user.role),
        "username": user.username
    }

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return UserOut(
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        disabled=current_user.disabled,
        role=UserRole(current_user.role),
        company_name=current_user.company_name
    )

@router.get("/me/items")
async def read_own_items(current_user: UserInDB = Depends(get_current_active_user)):
    return [{"item_id": 1, "owner": current_user.username}]