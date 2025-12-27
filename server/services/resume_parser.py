import pdfplumber
from docx import Document
import re
import json
import httpx
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_PARSING_MODEL
import io


async def extract_text_from_file(file):
    """Extract text from uploaded file (PDF, DOCX, TXT)"""
    text = ""
    file_content = await file.read()
    await file.seek(0)

    if file.filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
    elif file.filename.endswith(".docx"):
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([p.text for p in doc.paragraphs])
    elif file.filename.endswith(".txt"):
        text = file_content.decode("utf-8")
    else:
        raise ValueError("Unsupported file type. Please upload PDF, DOCX, or TXT.")

    text = re.sub(r"[ \t]+", " ", text)
    return text


def create_resume_parse_prompt(text):
    """Create prompt for resume parsing"""
    prompt = f"""
    Extract structured resume data from the following text and return ONLY valid JSON with NO additional text, explanations, or markdown formatting.

    CRITICAL: Return ONLY the JSON object below, nothing else. No "```json", no explanations, just the raw JSON:

    {{
      "name": "",
      "email": "",
      "phone": "",
      "education": [{{"Degree": "", "University": "", "Grade": "", "Years": ""}}],
      "skills": [],
      "derived_skills": [],
      "experience": [{{"Company": "", "Role": "", "Years": ""}}],
      "projects": [{{"Name": "", "Description": "", "Tech Stack": "", "Date": ""}}],
      "10th Marks": "",
      "12th Marks": ""
    }}

    INSTRUCTIONS:
    1. "skills": Extract skills explicitly mentioned in the skills section
    2. "derived_skills": Extract technical skills from Experience and Projects sections that are NOT in skills list
    3. If any field is missing, use empty string "" or empty array []
    4. Return ONLY the JSON object - no markdown, no explanations, no extra text

    Resume text:
    {text[:6000]}
    """
    return prompt


async def call_groq_api(prompt, temperature=0.7, max_retries=3):
    """Call Groq API with retry logic and token tracking"""
    import asyncio
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_PARSING_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": 2000
    }

    last_error = None
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(GROQ_URL, headers=headers, json=payload)
                response.raise_for_status()
                
                # ✅ Parse and display token usage
                response_data = response.json()
                if "usage" in response_data:
                    usage = response_data["usage"]
                    prompt_tokens = usage.get("prompt_tokens", 0)
                    completion_tokens = usage.get("completion_tokens", 0)
                    total_tokens = usage.get("total_tokens", 0)
                    
                    print(f"📊 Token Usage:")
                    print(f"   ├─ Prompt: {prompt_tokens:,} tokens")
                    print(f"   ├─ Completion: {completion_tokens:,} tokens")
                    print(f"   └─ Total: {total_tokens:,} tokens")
                
                return response
                
        except httpx.HTTPStatusError as e:
            last_error = f"HTTP {e.response.status_code}: {e.response.text}"
            
            # ✅ Parse rate limit info from error
            if e.response.status_code == 429:
                try:
                    error_data = e.response.json()
                    error_msg = error_data.get("error", {}).get("message", "")
                    
                    # Extract rate limit details
                    limit_match = re.search(r'Limit (\d+)', error_msg)
                    used_match = re.search(r'Used (\d+)', error_msg)
                    requested_match = re.search(r'Requested (\d+)', error_msg)
                    retry_match = re.search(r'try again in ([\d.]+)([ms])', error_msg)
                    
                    if limit_match and used_match and requested_match:
                        limit = int(limit_match.group(1))
                        used = int(used_match.group(1))
                        requested = int(requested_match.group(1))
                        available = limit - used
                        
                        print(f"⚠️  Rate Limit Hit:")
                        print(f"   ├─ Limit: {limit:,} tokens/min")
                        print(f"   ├─ Used: {used:,} tokens ({used/limit*100:.1f}%)")
                        print(f"   ├─ Requested: {requested:,} tokens")
                        print(f"   └─ Available: {available:,} tokens")
                        
                        if retry_match:
                            wait_time = float(retry_match.group(1))
                            unit = retry_match.group(2)
                            if unit == 'm':
                                wait_time *= 60
                            print(f"   ⏳ Retry after: {wait_time:.1f}s")
                    
                    raise Exception(f"Rate limit exceeded. {error_msg}")
                except json.JSONDecodeError:
                    pass
            
            print(f"❌ API error (attempt {attempt + 1}/{max_retries}): {last_error}")
            
            if 400 <= e.response.status_code < 500 and e.response.status_code != 429:
                raise Exception(f"API request failed: {last_error}")
            
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise Exception(f"API request failed after {max_retries} attempts: {last_error}")
            
        except Exception as e:
            last_error = str(e)
            print(f"❌ Unexpected error (attempt {attempt + 1}/{max_retries}): {last_error}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise Exception(f"Failed after {max_retries} attempts: {last_error}")


def parse_ai_response(response_text):
    """Parse and clean AI response JSON with enhanced error handling"""
    # Remove any markdown code fences
    cleaned = re.sub(r'^```json\s*', '', response_text.strip(), flags=re.IGNORECASE | re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip()
    
    # Try to find JSON object if there's extra text
    json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)
    
    # Try parsing
    try:
        parsed = json.loads(cleaned)
        return parsed
    except json.JSONDecodeError as e:
        print(f"⚠️  JSON parse error: {e}")
        print(f"📄 Raw response (first 500 chars): {cleaned[:500]}")
        
        # Try to extract just the first complete JSON object
        brace_count = 0
        json_end = -1
        for i, char in enumerate(cleaned):
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
                parsed = json.loads(truncated)
                print("✓ Recovered JSON by truncating extra data")
                return parsed
            except:
                pass
        
        raise ValueError(f"Failed to parse AI response as JSON: {e}")


async def parse_resume(file):
    """Main function to parse resume with enhanced error handling and token tracking"""
    try:
        print(f"\n{'─'*60}")
        print(f"📄 Parsing: {file.filename}")
        print(f"{'─'*60}")
        
        # Extract text
        text = await extract_text_from_file(file)
        
        if not text or len(text.strip()) < 50:
            raise ValueError("Extracted text is too short or empty.")

        print(f"📝 Extracted: {len(text):,} characters")

        # Create prompt
        prompt = create_resume_parse_prompt(text)
        prompt_length = len(prompt)
        estimated_tokens = prompt_length // 4  # Rough estimate: 1 token ≈ 4 characters
        print(f"📤 Sending to API: ~{estimated_tokens:,} tokens (estimated)")

        # Call Groq API
        response = await call_groq_api(prompt)
        data = response.json()

        # Validate response structure
        if "choices" not in data or not data["choices"]:
            error_msg = data.get("error", {}).get("message", "Unknown API error")
            print(f"❌ API Error: {json.dumps(data, indent=2)}")
            raise Exception(f"API error: {error_msg}")

        # Get AI response text
        ai_text = data["choices"][0]["message"]["content"]

        # Parse with enhanced error handling
        parsed = parse_ai_response(ai_text)

        # Ensure all required fields exist with defaults
        default_structure = {
            "name": "Unknown Candidate",
            "email": "No email",
            "phone": "No phone",
            "education": [],
            "skills": [],
            "derived_skills": [],
            "experience": [],
            "projects": [],
            "10th Marks": "",
            "12th Marks": ""
        }
        
        # Merge parsed data with defaults
        for key, default_value in default_structure.items():
            if key not in parsed or parsed[key] is None:
                parsed[key] = default_value
        
        # Validate and clean data types
        if not isinstance(parsed.get("skills"), list):
            parsed["skills"] = []
        if not isinstance(parsed.get("derived_skills"), list):
            parsed["derived_skills"] = []
        if not isinstance(parsed.get("education"), list):
            parsed["education"] = []
        if not isinstance(parsed.get("experience"), list):
            parsed["experience"] = []
        if not isinstance(parsed.get("projects"), list):
            parsed["projects"] = []

        print(f"✅ Successfully parsed: {parsed.get('name', 'Unknown')}")
        print(f"{'─'*60}\n")
        
        return {"filename": file.filename, **parsed}

    except ValueError as e:
        error_msg = str(e)
        print(f"❌ ValueError: {error_msg}")
        print(f"{'─'*60}\n")
        raise ValueError(error_msg)
    except json.JSONDecodeError as e:
        error_msg = f"Failed to parse AI response as JSON: {str(e)}"
        print(f"❌ JSON error: {error_msg}")
        print(f"{'─'*60}\n")
        raise Exception(error_msg)
    except httpx.HTTPStatusError as e:
        error_msg = f"API request failed: {e.response.status_code} - {e.response.text}"
        print(f"❌ HTTP error: {error_msg}")
        print(f"{'─'*60}\n")
        raise Exception(error_msg)
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error: {error_msg}")
        print(f"{'─'*60}\n")
        raise Exception(f"Failed to parse resume: {error_msg}")