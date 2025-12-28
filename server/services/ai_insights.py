import json
import httpx
import asyncio
import re
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_INSIGHTS_MODEL


def create_insights_prompt(resume_data):
    """
    Create prompt for generating career insights
    """
    prompt = f"""
    Analyze this resume data and provide comprehensive career insights.
    
    Resume Data:
    {json.dumps(resume_data, indent=2)[:6000]}
    
    CRITICAL: Return ONLY a valid JSON object with NO markdown, NO explanations, NO extra text.
    
    Return this EXACT structure:
    {{
      "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
      "improvements": ["improvement 1", "improvement 2", "improvement 3", "improvement 4"],
      "careerSuggestions": ["role 1", "role 2", "role 3", "role 4"],
      "interviewTips": ["tip 1", "tip 2", "tip 3", "tip 4", "tip 5"],
      "overallScore": 75,
      "summary": "brief overall assessment (1-2 sentences)"
    }}
    
    RULES:
    1. overallScore must be a number between 40 and 95 based on resume quality
    2. Each array should have the exact number of items shown above
    3. Be specific, constructive, and actionable
    4. Return ONLY the JSON object - no markdown backticks, no explanations
    5. Ensure all quotes are properly escaped
    6. No trailing commas
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
        "temperature": temperature,
        "max_tokens": 2000
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


def parse_insights_response(response_text):
    """
    Parse and clean AI insights response JSON with error recovery
    """
    if not response_text or not response_text.strip():
        raise ValueError("Empty response from AI")
    
    # Remove markdown code fences
    cleaned = re.sub(r'^```json\s*', '', response_text.strip(), flags=re.IGNORECASE | re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip()
    
    # Try to find JSON object if there's extra text
    json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)
    
    # Try parsing directly
    try:
        insights = json.loads(cleaned)
        return insights
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parse error: {e}")
        print(f"📄 Error at position {e.pos}: {cleaned[max(0, e.pos-50):e.pos+50]}")
        
        # Strategy 1: Fix common errors
        try:
            fixed = re.sub(r',(\s*[}\]])', r'\1', cleaned)  # Remove trailing commas
            fixed = re.sub(r'"\s*\n\s*"', '",\n"', fixed)  # Add missing commas
            insights = json.loads(fixed)
            print("✓ Recovered JSON by fixing common errors")
            return insights
        except:
            pass
        
        # Strategy 2: Extract first complete JSON object
        print("⚠️  Attempting to extract complete JSON object...")
        brace_count = 0
        json_end = -1
        in_string = False
        escape_next = False
        
        for i, char in enumerate(cleaned):
            if escape_next:
                escape_next = False
                continue
            if char == '\\':
                escape_next = True
                continue
            if char == '"' and not escape_next:
                in_string = not in_string
                continue
            if not in_string:
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break
        
        if json_end > 0:
            try:
                truncated = cleaned[:json_end]
                truncated = re.sub(r',(\s*})', r'\1', truncated)
                insights = json.loads(truncated)
                print("✓ Recovered JSON by truncating")
                return insights
            except:
                pass
        
        # If all fails, show helpful error
        print(f"📄 Raw response (first 500 chars): {cleaned[:500]}")
        raise ValueError(f"Failed to parse AI insights response as JSON: {e}")


def validate_and_fix_insights(insights):
    """
    Validate insights structure and fill in defaults if needed
    """
    # Default structure
    default_insights = {
        "strengths": [
            "Strong technical foundation demonstrated through projects and experience",
            "Good educational background with relevant qualifications",
            "Clear career progression and professional growth",
            "Diverse skill set applicable to multiple roles"
        ],
        "improvements": [
            "Consider adding quantifiable achievements and metrics",
            "Expand on technical skills with specific project examples",
            "Include certifications to validate expertise",
            "Add more details about leadership and team collaboration"
        ],
        "careerSuggestions": [
            "Software Developer",
            "Full Stack Engineer",
            "Technical Analyst",
            "Project Coordinator"
        ],
        "interviewTips": [
            "Prepare specific examples demonstrating your key technical skills",
            "Research the company's tech stack and recent projects",
            "Practice explaining your problem-solving approach with real scenarios",
            "Prepare questions about team structure and development practices",
            "Be ready to discuss challenges faced and how you overcame them"
        ],
        "overallScore": 70,
        "summary": "Solid foundation with good potential. Focus on highlighting measurable achievements and expanding technical depth to stand out to recruiters."
    }
    
    # Merge with defaults
    for key, default_value in default_insights.items():
        if key not in insights or insights[key] is None:
            insights[key] = default_value
        elif isinstance(default_value, list) and not isinstance(insights[key], list):
            insights[key] = default_value
        elif isinstance(insights[key], list) and len(insights[key]) == 0:
            insights[key] = default_value
    
    # Validate overallScore
    try:
        score = float(insights.get("overallScore", 70))
        insights["overallScore"] = max(40, min(95, score))
    except (ValueError, TypeError):
        insights["overallScore"] = 70
    
    # Ensure summary is a string
    if not isinstance(insights.get("summary"), str) or not insights["summary"]:
        insights["summary"] = default_insights["summary"]
    
    # Clean up arrays - remove empty items
    for key in ["strengths", "improvements", "careerSuggestions", "interviewTips"]:
        if isinstance(insights.get(key), list):
            insights[key] = [item for item in insights[key] if item and str(item).strip()]
            # If still empty, use defaults
            if not insights[key]:
                insights[key] = default_insights[key]
    
    return insights


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
        
        # Get AI response text
        ai_text = data["choices"][0]["message"]["content"]
        
        # Parse response with error recovery
        insights = parse_insights_response(ai_text)
        
        # Validate and fix structure
        insights = validate_and_fix_insights(insights)
        
        print("✓ Insights generated successfully")
        return {"insights": insights}
    
    except json.JSONDecodeError as e:
        error_msg = f"Failed to parse AI insights response as JSON: {str(e)}"
        print(error_msg)
        # Return default insights instead of failing
        print("⚠️  Returning default insights due to parse error")
        return {
            "insights": validate_and_fix_insights({})
        }
    except httpx.HTTPStatusError as e:
        error_msg = f"API request failed: {e.response.status_code} - {e.response.text}"
        print(error_msg)
        raise Exception(error_msg)
    except ValueError as e:
        error_msg = f"Validation error: {str(e)}"
        print(error_msg)
        # Return default insights instead of failing
        print("⚠️  Returning default insights due to validation error")
        return {
            "insights": validate_and_fix_insights({})
        }
    except Exception as e:
        error_msg = f"Failed to generate insights: {str(e)}"
        print(error_msg)
        # As last resort, return default insights
        print("⚠️  Returning default insights due to unexpected error")
        return {
            "insights": validate_and_fix_insights({})
        }