from fastapi import Depends, HTTPException, status
from models.user import UserRole
from .auth import get_current_active_user

async def require_role(*allowed_roles: UserRole):
    """
    Dependency to check if user has one of the allowed roles
    Usage: @router.get("/recruiter-only", dependencies=[Depends(require_role(UserRole.RECRUITER))])
    """
    async def check_role(current_user = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return check_role

async def require_candidate(current_user = Depends(get_current_active_user)):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This resource is only for candidates"
        )
    return current_user

async def require_recruiter(current_user = Depends(get_current_active_user)):
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This resource is only for recruiters"
        )
    return current_user