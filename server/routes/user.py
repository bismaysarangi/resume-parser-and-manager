from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from models.user import UserOut, UserInDB, UserRole
from dependencies.auth import get_current_active_user
from core.database import users_collection
from core.security import get_password_hash, create_access_token
from core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

router = APIRouter(tags=["User"])

class UserUpdate(BaseModel):
    full_name: str | None = None
    company_name: str | None = None
    email: str | None = None
    password: str | None = None


@router.get("/user/profile", response_model=UserOut)
async def get_profile(current_user: UserInDB = Depends(get_current_active_user)):
    """
    Get the profile details of the current logged-in user.
    """
    return UserOut(
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        disabled=current_user.disabled,
        role=UserRole(current_user.role),
        company_name=current_user.company_name
    )


@router.put("/user/profile/update")
async def update_profile(
    update_data: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Update the logged-in user's profile (full name, company name, email, or password).
    Returns new token if email is updated.
    """
    update_fields = {}
    email_updated = False

    if update_data.full_name:
        update_fields["full_name"] = update_data.full_name
    
    if update_data.company_name is not None:
        # Only recruiters should update company_name
        if current_user.role == UserRole.RECRUITER:
            update_fields["company_name"] = update_data.company_name
    
    if update_data.email and update_data.email != current_user.email:
        # Check if new email already exists
        existing_user = users_collection.find_one({"email": update_data.email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered by another user."
            )
        update_fields["email"] = update_data.email
        email_updated = True
    
    if update_data.password:
        update_fields["hashed_password"] = get_password_hash(update_data.password)

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update."
        )

    # Update user in database
    result = users_collection.update_one(
        {"username": current_user.username},
        {"$set": update_fields}
    )

    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or no changes made."
        )

    updated_user = users_collection.find_one({"username": current_user.username})

    response_data = {
        "user": UserOut(
            username=updated_user["username"],
            email=updated_user["email"],
            full_name=updated_user.get("full_name"),
            disabled=updated_user.get("disabled", False),
            role=UserRole(updated_user.get("role", "candidate")),
            company_name=updated_user.get("company_name")
        )
    }

    # Generate new token if email was updated
    if email_updated:
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": updated_user["email"], "role": updated_user.get("role", "candidate")}, 
            expires_delta=access_token_expires
        )
        response_data["access_token"] = access_token
        response_data["token_type"] = "bearer"

    return response_data