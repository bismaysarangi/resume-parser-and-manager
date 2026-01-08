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
    """Create enhanced prompt for comprehensive resume parsing including personal information"""
    prompt = f"""
    Extract ALL structured data from the following resume and return ONLY valid JSON with NO additional text, explanations, or markdown formatting.

    CRITICAL JSON RULES:
    1. Return ONLY the JSON object - no markdown, no explanations, no preamble
    2. All string values MUST have escaped quotes if they contain quotes
    3. Use double quotes for all keys and string values
    4. No trailing commas before closing braces or brackets
    5. Ensure all arrays and objects are properly closed
    6. If a field has no data, use empty string "" or empty array [] or null

    RETURN THIS EXACT JSON STRUCTURE:

    {{
      "name": "",
      "email": "",
      "phone": "",
      
      "gender": "",
      "date_of_birth": "",
      "age": null,
      "nationality": "",
      "marital_status": "",
      
      "current_location": "",
      "permanent_address": "",
      "hometown": "",
      "preferred_locations": [],
      "willing_to_relocate": null,
      
      "work_authorization": "",
      "visa_status": "",
      "notice_period": "",
      "availability_date": "",
      
      "current_ctc": "",
      "expected_ctc": "",
      "current_salary": "",
      "expected_salary": "",
      
      "summary": "",
      "objective": "",
      "career_objective": "",
      
      "education": [{{"Degree": "", "University": "", "Grade": "", "Years": ""}}],
      "tenth_marks": "",
      "twelfth_marks": "",
      "graduation_year": "",
      "current_year_of_study": "",
      "university_roll_number": "",
      "student_id": "",
      
      "skills": [],
      "derived_skills": [],
      "experience": [{{"Company": "", "Role": "", "Years": "", "Description": ""}}],
      "internships": [{{"Company": "", "Role": "", "Duration": "", "Description": ""}}],
      "projects": [{{"Name": "", "Description": "", "Tech Stack": "", "Date": ""}}],
      
      "achievements": [{{"Title": "", "Description": "", "Date": ""}}],
      "publications": [{{"Title": "", "Authors": "", "Journal/Conference": "", "Date": "", "DOI/Link": ""}}],
      "research": [{{"Title": "", "Description": "", "Duration": "", "Institution": ""}}],
      "certifications": [{{"Name": "", "Issuer": "", "Date": "", "Validity": ""}}],
      "awards": [{{"Title": "", "Issuer": "", "Date": "", "Description": ""}}],
      "volunteer_work": [{{"Organization": "", "Role": "", "Duration": "", "Description": ""}}],
      "extracurricular_activities": [{{"Activity": "", "Role": "", "Description": "", "Duration": ""}}],
      
      "languages": [{{"Language": "", "Proficiency": ""}}],
      "interests": [],
      "hobbies": [],
      "references": [{{"Name": "", "Title": "", "Contact": "", "Relationship": ""}}],
      
      "linkedin_url": "",
      "github_url": "",
      "portfolio_url": "",
      "personal_website": "",
      
      "placement_preferences": "",
      "preferred_job_role": "",
      "preferred_industry": "",
      
      "extra_sections": {{}}
    }}

    EXTRACTION INSTRUCTIONS:

    PERSONAL INFORMATION:
    1. "gender": Look for: Gender, Sex - extract as Male/Female/Other/Not specified
    2. "date_of_birth": Look for: DOB, Date of Birth, Born on - format as DD/MM/YYYY or MM/YYYY
    3. "age": Calculate from DOB or extract if directly mentioned
    4. "nationality": Look for: Nationality, Citizen of
    5. "marital_status": Look for: Marital Status, Married/Single/Unmarried

    LOCATION INFORMATION:
    6. "current_location": Look for: Current Location, Address, City, Based in
    7. "permanent_address": Look for: Permanent Address, Home Address
    8. "hometown": Look for: Hometown, Native Place, Place of Origin
    9. "preferred_locations": Look for: Preferred Location, Willing to relocate to
    10. "willing_to_relocate": Look for statements like "Open to relocation", "Willing to relocate"

    WORK AUTHORIZATION:
    11. "work_authorization": Look for: Work Authorization, Citizenship Status
    12. "visa_status": Look for: Visa Status, Work Permit, H1B, Student Visa
    13. "notice_period": Look for: Notice Period, Available from
    14. "availability_date": Look for: Available from, Joining date, Can join by

    COMPENSATION:
    15. "current_ctc": Look for: Current CTC, Current Salary, Present Compensation
    16. "expected_ctc": Look for: Expected CTC, Expected Salary, Salary Expectations
    17. "current_salary": Alternative to current_ctc
    18. "expected_salary": Alternative to expected_ctc

    ACADEMIC DETAILS:
    19. "graduation_year": Year of graduation or expected graduation
    20. "current_year_of_study": For current students (1st year, 2nd year, etc.)
    21. "university_roll_number": University roll number or registration number
    22. "student_id": Student ID number

    PROFESSIONAL SECTIONS:
    23. "skills": Extract skills explicitly mentioned in skills section
    24. "derived_skills": Extract technical skills from Experience, Projects, Research sections NOT in skills list
    25. "internships": Separate internship experiences from full-time experience
    26. "extracurricular_activities": College clubs, societies, sports, cultural activities

    SOCIAL LINKS:
    27. "linkedin_url": LinkedIn profile URL
    28. "github_url": GitHub profile URL
    29. "portfolio_url": Portfolio website URL
    30. "personal_website": Personal website or blog URL

    UNIVERSITY RECRUITMENT SPECIFIC:
    31. "placement_preferences": Look for: Looking for Full-time/Internship/Both
    32. "preferred_job_role": Desired job role or position
    33. "preferred_industry": Preferred industry sector
    34. "career_objective": Career objective or career goal statement

    IMPORTANT NOTES:
    - If information is not present in resume, use empty string "" or null or []
    - For boolean fields (willing_to_relocate), use true/false or null if not mentioned
    - For age, if DOB is present, calculate age; otherwise extract if directly mentioned
    - In Description fields, replace quote characters with single quotes to avoid JSON errors
    - Extract internships separately from full-time experience
    - Be thorough in extracting personal information as it's required for university recruitment

    Resume text:
    {text[:8000]}
    
    Remember: Return ONLY valid JSON, nothing else. Double-check that all quotes are properly escaped and all brackets/braces are closed.
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
        "max_tokens": 3000  # Increased for more comprehensive parsing
    }

    last_error = None
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(GROQ_URL, headers=headers, json=payload)
                response.raise_for_status()
                
                # Parse and display token usage
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
            
            # Parse rate limit info from error
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
    """Parse and clean AI response JSON with enhanced error handling and auto-repair"""
    # Remove any markdown code fences
    cleaned = re.sub(r'^```json\s*', '', response_text.strip(), flags=re.IGNORECASE | re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip()
    
    # Try to find JSON object if there's extra text
    json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)
    
    # Try parsing directly first
    try:
        parsed = json.loads(cleaned)
        return parsed
    except json.JSONDecodeError as e:
        print(f"⚠️  Initial JSON parse error: {e}")
        print(f"📄 Error at position {e.pos}: {cleaned[max(0, e.pos-50):e.pos+50]}")
        
        # Strategy 1: Try to fix common JSON errors
        try:
            # Fix trailing commas before closing braces/brackets
            fixed = re.sub(r',(\s*[}\]])', r'\1', cleaned)
            
            # Fix missing commas between array elements or object properties
            fixed = re.sub(r'"\s*\n\s*"', '",\n"', fixed)
            fixed = re.sub(r'}\s*\n\s*{', '},\n{', fixed)
            fixed = re.sub(r']\s*\n\s*{', '],\n{', fixed)
            
            parsed = json.loads(fixed)
            print("✓ Recovered JSON by fixing common errors")
            return parsed
        except json.JSONDecodeError:
            pass
        
        # Strategy 2: Try to extract just the first complete JSON object
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
                # Try to fix any trailing issues
                truncated = re.sub(r',(\s*})', r'\1', truncated)
                parsed = json.loads(truncated)
                print("✓ Recovered JSON by truncating to first complete object")
                return parsed
            except json.JSONDecodeError as e2:
                print(f"⚠️  Still failed after truncation: {e2}")
        
        # Strategy 3: Try to parse what we can and fill in defaults
        print("⚠️  Attempting partial parse with defaults...")
        try:
            # Find the error position and try to close the JSON properly
            error_pos = e.pos
            partial = cleaned[:error_pos]
            
            # Count unclosed braces and brackets
            open_braces = partial.count('{') - partial.count('}')
            open_brackets = partial.count('[') - partial.count(']')
            
            # Close them
            partial += ']' * open_brackets
            partial += '}' * open_braces
            
            parsed = json.loads(partial)
            print("✓ Recovered partial JSON with defaults")
            return parsed
        except:
            pass
        
        # If all strategies fail, raise the original error with helpful context
        print(f"📄 Raw response (first 1000 chars): {cleaned[:1000]}")
        raise ValueError(f"Failed to parse AI response as JSON: {e}. Check if the model is outputting valid JSON without extra text.")


async def parse_resume(file):
    """Main function to parse resume with enhanced comprehensive data extraction"""
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
        estimated_tokens = prompt_length // 4
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
            "summary": "",
            "objective": "",
            "education": [],
            "skills": [],
            "derived_skills": [],
            "experience": [],
            "projects": [],
            "achievements": [],
            "publications": [],
            "research": [],
            "certifications": [],
            "awards": [],
            "volunteer_work": [],
            "languages": [],
            "interests": [],
            "references": [],
            "10th Marks": "",
            "12th Marks": "",
            "extra_sections": {}
        }
        
        # Merge parsed data with defaults
        for key, default_value in default_structure.items():
            if key not in parsed or parsed[key] is None:
                parsed[key] = default_value
        
        # Validate and clean data types
        list_fields = ["skills", "derived_skills", "education", "experience", "projects",
                      "achievements", "publications", "research", "certifications",
                      "awards", "volunteer_work", "languages", "interests", "references"]
        
        for field in list_fields:
            if not isinstance(parsed.get(field), list):
                parsed[field] = []
            # Clean each item in the list
            if parsed[field]:
                cleaned_items = []
                for item in parsed[field]:
                    if isinstance(item, dict):
                        # Remove any null values and clean strings
                        cleaned_item = {}
                        for k, v in item.items():
                            if v is not None:
                                if isinstance(v, str):
                                    # Remove excessive whitespace and fix encoding issues
                                    v = ' '.join(v.split())
                                cleaned_item[k] = v
                        if cleaned_item:  # Only add if not empty
                            cleaned_items.append(cleaned_item)
                    elif isinstance(item, str) and item.strip():
                        cleaned_items.append(item.strip())
                parsed[field] = cleaned_items
        
        # Clean string fields
        string_fields = ["name", "email", "phone", "summary", "objective", "10th Marks", "12th Marks"]
        for field in string_fields:
            if isinstance(parsed.get(field), str):
                parsed[field] = ' '.join(parsed[field].split())
        
        if not isinstance(parsed.get("extra_sections"), dict):
            parsed["extra_sections"] = {}

        print(f"✅ Successfully parsed: {parsed.get('name', 'Unknown')}")
        
        # Log what sections were found
        sections_found = []
        if parsed.get("achievements"): sections_found.append("Achievements")
        if parsed.get("publications"): sections_found.append("Publications")
        if parsed.get("research"): sections_found.append("Research")
        if parsed.get("certifications"): sections_found.append("Certifications")
        if parsed.get("awards"): sections_found.append("Awards")
        if parsed.get("volunteer_work"): sections_found.append("Volunteer Work")
        if parsed.get("languages"): sections_found.append("Languages")
        if parsed.get("extra_sections"): sections_found.append(f"Extra ({len(parsed['extra_sections'])} sections)")
        
        if sections_found:
            print(f"📋 Additional sections found: {', '.join(sections_found)}")
        
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