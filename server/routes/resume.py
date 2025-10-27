from fastapi import APIRouter, UploadFile, File
from services.resume_parser import parse_resume
from services.ai_insights import generate_insights

router = APIRouter()


@router.post("/parse-resume")
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """
    Parse resume file and extract structured data
    """
    try:
        result = await parse_resume(file)
        return result
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {
            "error": "Failed to parse resume",
            "details": str(e)
        }


@router.post("/ai-insights")
async def get_ai_insights(resume_data: dict):
    """
    Generate AI-powered career insights based on parsed resume data
    """
    try:
        insights = await generate_insights(resume_data)
        return insights
    except Exception as e:
        return {
            "error": "Failed to generate insights",
            "details": str(e)
        }