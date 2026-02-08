import pdfplumber
from docx import Document
import re
import json
import httpx
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_PARSING_MODEL
import io
from datetime import datetime


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


def extract_personal_info_regex(text):
    """
    ENHANCED REGEX EXTRACTION - Multiple patterns for each field
    """
    info = {}
    
    # ============ GENDER ============
    gender_patterns = [
        r"Gender\s*[:\-]?\s*([MF])\b",
        r"Gender\s*[:\-]?\s*(Male|Female|MALE|FEMALE|M|F)\b",
        r"Sex\s*[:\-]?\s*(Male|Female|MALE|FEMALE|M|F)\b",
        r"\b(Male|Female)\b(?=\s*\n|\s*[,;]|\s*Marital)",
    ]
    
    for pattern in gender_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = match.group(1).strip().upper()
            if val in ['M', 'MALE']:
                info['gender'] = 'Male'
            elif val in ['F', 'FEMALE']:
                info['gender'] = 'Female'
            else:
                info['gender'] = val.capitalize()
            break
    
    # ============ DATE OF BIRTH ============
    dob_patterns = [
        r"(?:Date of Birth|DOB|D\.O\.B\.?|Birth Date)\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
        r"(?:Date of Birth|DOB|D\.O\.B\.?)\s*[:\-]?\s*(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})",
        r"\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\b(?=.*(?:Birth|DOB))",
    ]
    
    for pattern in dob_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            dob_str = match.group(1).strip()
            dob_str = dob_str.replace('-', '/').replace('.', '/')
            info['date_of_birth'] = dob_str
            
            try:
                parts = dob_str.split('/')
                if len(parts) == 3:
                    day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
                    if year < 100:
                        year += 1900 if year > 50 else 2000
                    birth_year = year
                    current_year = datetime.now().year
                    info['age'] = current_year - birth_year
            except:
                pass
            break
    
    # ============ NATIONALITY ============
    nationality_patterns = [
        r"Nationality\s*[:\-]?\s*([A-Za-z]+)",
        r"Citizen(?:ship)?\s*[:\-]?\s*([A-Za-z]+)",
        r"\b(Indian|American|British|Canadian|Australian|Chinese|Japanese)\b(?=\s*\n|\s*[,;]|\s*Marital)",
    ]
    
    for pattern in nationality_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            if val.upper() == 'INDIAN':
                info['nationality'] = 'Indian'
            elif val.upper() in ['USA', 'US', 'AMERICAN']:
                info['nationality'] = 'American'
            else:
                info['nationality'] = val.capitalize()
            break
    
    # ============ MARITAL STATUS ============
    marital_patterns = [
        r"Marital Status\s*[:\-]?\s*(Single|Married|Divorced|Widowed|SINGLE|MARRIED|DIVORCED|WIDOWED)",
        r"\b(Single|Married|Divorced|Widowed)\b(?=\s*\n|\s*[,;]|\s*Nationality)",
    ]
    
    for pattern in marital_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            info['marital_status'] = match.group(1).strip().capitalize()
            break
    
    # ============ CURRENT LOCATION ============
    location_patterns = [
        r"(?:Address|Location|City)\s*[:\-]?\s*([A-Za-z\s]+)\s*[-,]?\s*(\d{6})",
        r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*(Karnataka|Tamil Nadu|Maharashtra|Delhi|Telangana|West Bengal|Gujarat|Rajasthan|Punjab|Haryana|Uttar Pradesh|Madhya Pradesh|Kerala|Andhra Pradesh|Odisha|Chhattisgarh)\b",
        r"\b([A-Z][A-Z\s]+)\s*-?\s*(\d{6})",
        r"\b(Bangalore|Bengaluru|Chennai|Mumbai|Delhi|Hyderabad|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Kanpur|Nagpur|Visakhapatnam|Bhopal|Patna|Ludhiana|Agra|Nashik|Vadodara|Coimbatore|Madurai|Mysore|Bhubaneswar)\b",
    ]
    
    for pattern in location_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            if len(match.groups()) >= 2:
                city = match.group(1).strip()
                state_or_pin = match.group(2).strip()
                info['current_location'] = f"{city}, {state_or_pin}"
            else:
                info['current_location'] = match.group(1).strip().title()
            break
    
    # ============ PHONE NUMBER ============
    phone_patterns = [
        r"(?:Phone|Mobile|Contact|Cell)\s*[:\-]?\s*(\+?\d{1,3}[-.\s]?\d{10})",
        r"(?:Phone|Mobile|Contact|Cell)\s*[:\-]?\s*(\d{10})",
        r"\b(\+?\d{1,3}[-.\s]?\d{10})\b",
        r"\b(\d{10})\b",
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            phone = match.group(1).strip()
            digits_only = re.sub(r'\D', '', phone)
            if len(digits_only) >= 10:
                info['phone'] = phone
                break
    
    # ============ EMAIL ============
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(email_pattern, text)
    if match:
        info['email'] = match.group(0).strip()
    
    return info


def create_resume_parse_prompt(text, regex_info=None):
    """
    ENHANCED AI PROMPT with strict format requirements
    """
    
    regex_context = ""
    if regex_info:
        regex_context = f"""
ALREADY EXTRACTED BY REGEX (use as reference):
{json.dumps(regex_info, indent=2)}
"""
    
    prompt = f"""Extract ALL information from this resume into a structured JSON format.

{regex_context}

**CRITICAL FORMAT REQUIREMENTS:**

For array fields that expect dictionaries, you MUST return arrays of objects, NOT strings:

CORRECT:
"achievements": [{{"title": "Merit Scholarship", "description": "Received in 2024"}}]
"awards": [{{"name": "Gold Medal", "issuer": "XIM University", "year": "2024"}}]
"volunteer_work": [{{"organization": "NGO Name", "role": "Volunteer", "duration": "6 months"}}]

WRONG (DO NOT DO THIS):
"achievements": ["Merit Scholarship 2024"]  ❌
"awards": ["Gold Medal"]  ❌
"volunteer_work": ["NGO work"]  ❌

If a field is not mentioned, use an EMPTY ARRAY [], NOT ["Not mentioned"] or ["not available"]

Return ONLY a valid JSON object (no markdown, no explanations):

{{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+91XXXXXXXXXX or 10-digit number",
  
  "gender": "Male/Female or null",
  "date_of_birth": "DD/MM/YYYY or null",
  "age": number_or_null,
  "nationality": "Indian/American/etc or null",
  "marital_status": "Single/Married or null",
  "current_location": "City, State, Country or null",
  
  "permanent_address": "full address or null",
  "hometown": "hometown or null",
  "preferred_locations": ["city1", "city2"] or [],
  "willing_to_relocate": true/false/null,
  
  "work_authorization": "string or null",
  "visa_status": "string or null",
  "notice_period": "string or null",
  "availability_date": "string or null",
  
  "current_ctc": "string or null",
  "expected_ctc": "string or null",
  "current_salary": "string or null",
  "expected_salary": "string or null",
  
  "summary": "string or null",
  "objective": "string or null",
  
  "education": [
    {{
      "Degree": "Ph.D./M.Tech/B.Tech/etc",
      "University": "University Name",
      "Grade": "CGPA or %",
      "Years": "2020-2024 or year"
    }}
  ],
  
  "tenth_marks": "string or null",
  "twelfth_marks": "string or null",
  "graduation_year": "string or null",
  "current_year_of_study": "string or null",
  "university_roll_number": "string or null",
  "student_id": "string or null",
  
  "skills": ["skill1", "skill2"] or [],
  "derived_skills": [] or [],
  
  "experience": [
    {{
      "Company": "Company Name",
      "Role": "Job Title",
      "Years": "2020-2022",
      "Description": "brief description or null"
    }}
  ],
  
  "projects": [
    {{
      "Title": "Project Name",
      "Description": "what it does",
      "Technologies": "tech stack",
      "Duration": "time period"
    }}
  ],
  
  "internships": [
    {{
      "Company": "Company Name",
      "Role": "Intern Title",
      "Duration": "3 months",
      "Description": "what you did"
    }}
  ],
  
  "achievements": [
    {{
      "title": "Achievement name",
      "description": "Brief description",
      "year": "2024 or null"
    }}
  ],
  
  "publications": [
    {{
      "Title": "Paper Title",
      "Authors": "Author names or null",
      "Journal/Conference": "where published or null",
      "Date": "year or null",
      "DOI/Link": "link or null"
    }}
  ],
  
  "research": [
    {{
      "Title": "Research Title",
      "Description": "brief description",
      "Duration": "time period or null",
      "Institution": "where conducted or null"
    }}
  ],
  
  "certifications": [
    {{
      "Name": "Certification Name",
      "Issuer": "who issued",
      "Date": "when obtained or null",
      "Expiry": "if applicable or null"
    }}
  ],
  
  "awards": [
    {{
      "name": "Award name",
      "issuer": "Organization that gave award",
      "year": "2024 or null"
    }}
  ],
  
  "volunteer_work": [
    {{
      "organization": "Organization name",
      "role": "Your role",
      "duration": "Time period or null"
    }}
  ],
  
  "extracurricular_activities": [
    {{
      "activity": "Activity name",
      "role": "Your role or null",
      "duration": "Time period or null"
    }}
  ],
  
  "languages": [
    {{
      "Language": "English",
      "Proficiency": "Fluent/Native/Intermediate"
    }}
  ],
  
  "interests": ["interest1", "interest2"] or [],
  "hobbies": ["hobby1", "hobby2"] or [],
  
  "references": [
    {{
      "Name": "Reference Name",
      "Title": "their title",
      "Contact": "email/phone",
      "Relationship": "Manager/Professor"
    }}
  ],
  
  "linkedin_url": "url or null",
  "github_url": "url or null",
  "portfolio_url": "url or null",
  "personal_website": "url or null",
  
  "placement_preferences": "string or null",
  "preferred_job_role": "string or null",
  "preferred_industry": "string or null",
  "career_objective": "string or null",
  
  "extra_sections": {{}}
}}

**CRITICAL RULES:**
1. achievements, awards, volunteer_work, extracurricular_activities MUST be arrays of objects (dictionaries), NOT arrays of strings
2. If not mentioned, use [] (empty array), NOT ["Not mentioned"]
3. Return ONLY the JSON object
4. No markdown backticks
5. All quotes properly escaped
6. No trailing commas

Resume Text:
{text[:15000]}

Return ONLY the JSON object with proper structure.
"""
    return prompt


async def call_groq_api(prompt, temperature=0.1, max_retries=3):
    """Call Groq API with retry logic"""
    import asyncio
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_PARSING_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": 4000
    }

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=90) as client:
                response = await client.post(GROQ_URL, headers=headers, json=payload)
                response.raise_for_status()
                return response
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise Exception(f"API failed: {str(e)}")


def parse_ai_response(response_text):
    """Parse AI JSON response with improved error handling"""
    cleaned = re.sub(r'^```json\s*', '', response_text.strip(), flags=re.IGNORECASE | re.MULTILINE)
    cleaned = re.sub(r'^```\s*', '', cleaned.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip()
    
    json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        try:
            fixed = re.sub(r',(\s*[}\]])', r'\1', cleaned)
            fixed = re.sub(r'"\s*\n\s*"', '",\n"', fixed)
            return json.loads(fixed)
        except:
            print(f"JSON Parse Error: {e}")
            print(f"Error at position {e.pos}: {cleaned[max(0, e.pos-50):e.pos+50]}")
            raise ValueError(f"Failed to parse AI response as JSON: {e}")


def normalize_list_fields(data):
    """
    ✅ FIX: Convert string arrays to dict arrays for Pydantic validation
    """
    # Fields that must be arrays of dictionaries
    dict_array_fields = {
        'achievements': lambda s: {'title': s, 'description': None, 'year': None},
        'awards': lambda s: {'name': s, 'issuer': None, 'year': None},
        'volunteer_work': lambda s: {'organization': s, 'role': None, 'duration': None},
        'extracurricular_activities': lambda s: {'activity': s, 'role': None, 'duration': None},
    }
    
    for field, converter in dict_array_fields.items():
        if field in data and isinstance(data[field], list):
            normalized = []
            for item in data[field]:
                if isinstance(item, str):
                    # Skip "Not mentioned", "not available", etc.
                    if item.lower() not in ['not mentioned', 'not available', 'none', 'n/a', 'nil']:
                        normalized.append(converter(item))
                elif isinstance(item, dict):
                    normalized.append(item)
            data[field] = normalized
    
    return data


def merge_regex_and_ai_data(regex_data, ai_data):
    """
    Intelligently merge regex and AI extracted data
    """
    final_data = ai_data.copy()
    
    personal_fields = ['gender', 'date_of_birth', 'age', 'nationality', 
                      'marital_status', 'current_location', 'phone', 'email']
    
    for field in personal_fields:
        if field in regex_data and regex_data[field]:
            final_data[field] = regex_data[field]
            print(f"  ✓ REGEX OVERRIDE '{field}' = {regex_data[field]}")
        elif field in regex_data and not regex_data[field] and field in ai_data and ai_data[field]:
            print(f"  ℹ AI RETAINED '{field}' = {ai_data[field]}")
    
    return final_data


async def parse_resume(file):
    """
    ENHANCED HYBRID PARSER with format normalization
    """
    try:
        print(f"\n{'='*70}")
        print(f"📄 PARSING: {file.filename}")
        print('='*70)
        
        text = await extract_text_from_file(file)
        if not text or len(text.strip()) < 50:
            raise ValueError("Could not extract meaningful text from file")
        
        print(f"✓ Extracted {len(text)} characters")
        
        print("\n🔍 REGEX EXTRACTION (High-Confidence Patterns):")
        regex_data = extract_personal_info_regex(text)
        
        if regex_data:
            for key, value in regex_data.items():
                print(f"  ✓ {key}: {value}")
        else:
            print("  ℹ No regex matches found")
        
        print("\n🤖 AI EXTRACTION:")
        prompt = create_resume_parse_prompt(text, regex_data)
        response = await call_groq_api(prompt, temperature=0.1)
        
        data = response.json()
        if "choices" not in data or not data["choices"]:
            raise ValueError("Invalid API response - no choices returned")
        
        ai_text = data["choices"][0]["message"]["content"]
        ai_data = parse_ai_response(ai_text)
        
        print(f"✓ AI extracted {len([k for k, v in ai_data.items() if v])} non-null fields")
        
        print("\n🔄 NORMALIZING DATA (Converting strings to dicts):")
        ai_data = normalize_list_fields(ai_data)
        print("✓ Normalized list fields for Pydantic validation")
        
        print("\n🔄 MERGING DATA (Regex priority for personal info):")
        final_data = merge_regex_and_ai_data(regex_data, ai_data)
        
        schema_defaults = {
            "gender": None, "date_of_birth": None, "age": None, "nationality": None,
            "marital_status": None, "current_location": None, "permanent_address": None,
            "hometown": None, "preferred_locations": [], "willing_to_relocate": None,
            "work_authorization": None, "visa_status": None, "notice_period": None,
            "availability_date": None, "current_ctc": None, "expected_ctc": None,
            "current_salary": None, "expected_salary": None, "summary": None,
            "objective": None, "career_objective": None, "tenth_marks": None,
            "twelfth_marks": None, "graduation_year": None, "current_year_of_study": None,
            "university_roll_number": None, "student_id": None, "derived_skills": [],
            "internships": [], "achievements": [], "research": [], "awards": [],
            "volunteer_work": [], "extracurricular_activities": [], "languages": [],
            "interests": [], "hobbies": [], "references": [], "linkedin_url": None,
            "github_url": None, "portfolio_url": None, "personal_website": None,
            "placement_preferences": None, "preferred_job_role": None,
            "preferred_industry": None, "extra_sections": {}
        }
        
        for field, default_value in schema_defaults.items():
            if field not in final_data:
                final_data[field] = default_value
        
        list_fields = ['education', 'skills', 'experience', 'projects', 'internships', 
                      'achievements', 'publications', 'research', 'certifications', 
                      'awards', 'volunteer_work', 'extracurricular_activities', 
                      'languages', 'interests', 'hobbies', 'references', 
                      'derived_skills', 'preferred_locations']
        
        for field in list_fields:
            if final_data.get(field) is None:
                final_data[field] = []
        
        if final_data.get('extra_sections') is None:
            final_data['extra_sections'] = {}
        
        final_data["filename"] = file.filename
        
        print(f"\n{'='*70}")
        print("✅ PARSING COMPLETE - FINAL RESULT:")
        print(f"   Name: {final_data.get('name', 'N/A')}")
        print(f"   Email: {final_data.get('email', 'N/A')}")
        print(f"   Phone: {final_data.get('phone', 'N/A')}")
        print(f"   Gender: {final_data.get('gender', 'Not Found')}")
        print(f"   DOB: {final_data.get('date_of_birth', 'Not Found')}")
        print(f"   Age: {final_data.get('age', 'Not Found')}")
        print(f"   Nationality: {final_data.get('nationality', 'Not Found')}")
        print(f"   Marital Status: {final_data.get('marital_status', 'Not Found')}")
        print(f"   Location: {final_data.get('current_location', 'Not Found')}")
        
        education = final_data.get('education', []) or []
        experience = final_data.get('experience', []) or []
        skills = final_data.get('skills', []) or []
        achievements = final_data.get('achievements', []) or []
        
        print(f"   Education Entries: {len(education)}")
        print(f"   Experience Entries: {len(experience)}")
        print(f"   Skills: {len(skills)}")
        print(f"   Achievements: {len(achievements)}")
        print('='*70 + '\n')
        
        return final_data
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise ValueError(f"Failed to parse resume: {str(e)}")