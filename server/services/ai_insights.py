import json
import httpx
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_INSIGHTS_MODEL


def create_insights_prompt(resume_data):
    """
    Create prompt for generating career insights
    """
    prompt = f"""
    Analyze this resume data and provide comprehensive career insights in JSON format:
    {json.dumps(resume_data, indent=2)}
    
    Return ONLY valid JSON with this exact structure (no markdown, no extra text):
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
    
    Be constructive, specific, and actionable. Return ONLY the JSON object, nothing else.
    """
    return prompt


async def call_groq_for_insights(prompt, temperature=0.7):
    """
    Call Groq API specifically for insights generation
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_INSIGHTS_MODEL,  # Use insights model from config
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()  # Raise error for bad status codes

    return response


def parse_ai_response(response_text):
    """
    Parse and clean AI response JSON
    """
    import re
    # Remove ```json ... ``` if present
    cleaned = re.sub(r"^```json\s*|\s*```$", "", response_text.strip(), flags=re.DOTALL)
    return json.loads(cleaned)


async def generate_insights(resume_data):
    """
    Generate AI-powered career insights with error handling
    """
    try:
        # Validate input
        if not resume_data:
            raise ValueError("Resume data cannot be empty")
        
        # Create prompt
        prompt = create_insights_prompt(resume_data)
        
        # Call Groq API with insights model
        response = await call_groq_for_insights(prompt, temperature=0.7)
        data = response.json()
        
        # Check if response has choices (handle API errors)
        if "choices" not in data:
            error_msg = data.get("error", {}).get("message", "Unknown API error")
            raise Exception(f"API error: {error_msg}")
        
        # Parse response
        ai_text = data["choices"][0]["message"]["content"]
        insights = parse_ai_response(ai_text)
        
        # Validate insights structure
        required_fields = ["strengths", "improvements", "skillGaps", "careerSuggestions", 
                          "interviewTips", "overallScore", "summary"]
        missing_fields = [field for field in required_fields if field not in insights]
        
        if missing_fields:
            raise ValueError(f"AI response missing required fields: {', '.join(missing_fields)}")
        
        # Ensure overallScore is a number between 40-95
        try:
            score = float(insights.get("overallScore", 70))
            insights["overallScore"] = max(40, min(95, score))
        except (ValueError, TypeError):
            insights["overallScore"] = 70  # Default score
        
        return {"insights": insights}
    
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI insights response as JSON: {str(e)}")
    except httpx.HTTPStatusError as e:
        raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
    except KeyError as e:
        raise Exception(f"Invalid API response format: missing {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to generate insights: {str(e)}")