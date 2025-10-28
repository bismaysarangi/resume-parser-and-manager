# server/routes/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from models.user import UserOut, UserInDB
from dependencies.auth import get_current_active_user
from core.database import users_collection

router = APIRouter(tags=["User"])

class UserUpdate(BaseModel):
    full_name: str | None = None
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
        disabled=current_user.disabled
    )


@router.put("/user/profile/update", response_model=UserOut)
async def update_profile(
    update_data: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Update the logged-in user's profile (full name, email, or password).
    """
    update_fields = {}

    if update_data.full_name:
        update_fields["full_name"] = update_data.full_name
    if update_data.email:
        update_fields["email"] = update_data.email
    if update_data.password:
        # Hash the new password (optional if implemented)
        from core.security import get_password_hash
        update_fields["hashed_password"] = get_password_hash(update_data.password)

    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update."
        )

    # ✅ Using PyMongo (non-async)
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

    return UserOut(
        username=updated_user["username"],
        email=updated_user["email"],
        full_name=updated_user.get("full_name"),
        disabled=updated_user.get("disabled", False)
    )
