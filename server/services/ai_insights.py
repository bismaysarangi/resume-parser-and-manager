import json
import httpx
import asyncio
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
      "careerSuggestions": ["list of suitable job roles"],
      "interviewTips": ["list of 4-5 interview preparation tips"],
      "overallScore": <calculate a score between 40-95 based on resume quality, experience, skills, and achievements>,
      "summary": "brief overall assessment"
    }}
    
    Be constructive, specific, and actionable. Return ONLY the JSON object, nothing else.
    """
    return prompt


async def call_groq_for_insights(prompt, temperature=0.7, max_retries=3):
    """
    Call Groq API specifically for insights generation with retry logic
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_INSIGHTS_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature
    }

    last_error = None
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=90) as client:
                response = await client.post(GROQ_URL, headers=headers, json=payload)
                
                # Check for rate limiting
                if response.status_code == 429:
                    wait_time = min((2 ** attempt) * 2, 30)  # Exponential backoff
                    print(f"Rate limited. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
                    await asyncio.sleep(wait_time)
                    continue
                
                # Raise for other HTTP errors
                response.raise_for_status()
                return response
                
        except httpx.TimeoutException as e:
            last_error = f"Request timeout (attempt {attempt + 1}/{max_retries})"
            print(last_error)
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
                
        except httpx.HTTPStatusError as e:
            last_error = f"HTTP {e.response.status_code}: {e.response.text}"
            print(f"API error (attempt {attempt + 1}/{max_retries}): {last_error}")
            
            # Don't retry on client errors (4xx except 429)
            if 400 <= e.response.status_code < 500 and e.response.status_code != 429:
                raise
                
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
                
        except Exception as e:
            last_error = str(e)
            print(f"Unexpected error (attempt {attempt + 1}/{max_retries}): {last_error}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
    
    # All retries exhausted
    raise Exception(f"Failed after {max_retries} attempts. Last error: {last_error}")


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
    Generate AI-powered career insights with enhanced error handling
    """
    try:
        # Validate input
        if not resume_data:
            raise ValueError("Resume data cannot be empty")
        
        print(f"Generating insights for resume...")
        
        # Create prompt
        prompt = create_insights_prompt(resume_data)
        
        # Call Groq API with insights model and retry logic
        response = await call_groq_for_insights(prompt, temperature=0.7)
        data = response.json()
        
        # Validate response structure
        if "choices" not in data or not data["choices"]:
            error_detail = data.get("error", {})
            error_msg = error_detail.get("message", "Invalid API response structure")
            print(f"API response error: {json.dumps(data, indent=2)}")
            raise Exception(f"API error: {error_msg}")
        
        # Parse response
        ai_text = data["choices"][0]["message"]["content"]
        insights = parse_ai_response(ai_text)
        
        # Validate insights structure
        required_fields = ["strengths", "improvements", "skillGaps", "careerSuggestions", 
                          "interviewTips", "overallScore", "summary"]
        missing_fields = [field for field in required_fields if field not in insights]
        
        if missing_fields:
            print(f"AI response missing fields: {missing_fields}")
            print(f"Raw AI response: {ai_text}")
            raise ValueError(f"AI response missing required fields: {', '.join(missing_fields)}")
        
        # Ensure overallScore is a number between 40-95
        try:
            score = float(insights.get("overallScore", 70))
            insights["overallScore"] = max(40, min(95, score))
        except (ValueError, TypeError):
            insights["overallScore"] = 70  # Default score
        
        print("✓ Insights generated successfully")
        return {"insights": insights}
    
    except json.JSONDecodeError as e:
        error_msg = f"Failed to parse AI insights response as JSON: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)
    except httpx.HTTPStatusError as e:
        error_msg = f"API request failed: {e.response.status_code} - {e.response.text}"
        print(error_msg)
        raise Exception(error_msg)
    except KeyError as e:
        error_msg = f"Invalid API response format: missing {str(e)}"
        print(error_msg)
        raise Exception(error_msg)
    except Exception as e:
        error_msg = f"Failed to generate insights: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)