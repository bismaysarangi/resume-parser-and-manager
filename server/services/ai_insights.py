import json
from .resume_parser import call_groq_api, parse_ai_response


def create_insights_prompt(resume_data):
    """
    Create prompt for generating career insights
    """
    prompt = f"""
    Analyze this resume data and provide comprehensive career insights in JSON format:
    {json.dumps(resume_data)}
    
    Return JSON with this structure:
    {{
      "strengths": ["list of 3-4 key strengths"],
      "improvements": ["list of 3-4 areas for improvement"],
      "skillGaps": {{
        "Frontend Developer": ["gap1", "gap2"],
        "Backend Developer": ["gap1", "gap2"],
        "Full Stack Developer": ["gap1", "gap2"]
      }},
      "careerSuggestions": ["list of suitable job roles"],
      "interviewTips": ["list of 4-5 interview preparation tips"],
      "overallScore": <calculate a score between 40-95 based on resume quality, experience, skills, and achievements>,
      "summary": "brief overall assessment"
    }}
    
    Be constructive, specific, and actionable.
    """
    return prompt


async def generate_insights(resume_data):
    """
    Generate AI-powered career insights
    """
    try:
        # Create prompt
        prompt = create_insights_prompt(resume_data)
        
        # Call Groq API
        response = await call_groq_api(prompt, temperature=0.7)
        data = response.json()
        
        # Parse response
        ai_text = data["choices"][0]["message"]["content"]
        insights = parse_ai_response(ai_text)
        
        return {"insights": insights}
    
    except Exception as e:
        raise Exception(f"Failed to generate insights: {str(e)}")