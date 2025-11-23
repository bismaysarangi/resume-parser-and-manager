from fastapi import APIRouter
from .candidates import router as candidates_router
from .bulk_upload import router as bulk_upload_router

router = APIRouter()

router.include_router(candidates_router, tags=["recruiter-candidates"])
router.include_router(bulk_upload_router, tags=["recruiter-bulk-upload"])