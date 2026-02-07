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
    MANDATORY REGEX EXTRACTION - This ALWAYS runs and ALWAYS fills personal fields
    """
    info = {}
    
    # Gender - multiple patterns
    patterns = [
        r"Gender\s+([A-Z]+)",
        r"Gender\s*:\s*([A-Za-z]+)",
        r"Sex\s*:\s*([A-Za-z]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = match.group(1).strip().upper()
            info['gender'] = 'Male' if val in ['M', 'MALE'] else ('Female' if val in ['F', 'FEMALE'] else val.capitalize())
            break
    
    # Date of Birth
    patterns = [
        r"Date of Birth\s+(\d{1,2}/\d{1,2}/\d{4})",
        r"Date of Birth\s*:\s*(\d{1,2}/\d{1,2}/\d{4})",
        r"DOB\s*:\s*(\d{1,2}/\d{1,2}/\d{4})",
        r"D\.O\.B\.?\s*:\s*(\d{1,2}/\d{1,2}/\d{4})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            info['date_of_birth'] = match.group(1).strip()
            # Calculate age
            try:
                parts = info['date_of_birth'].split('/')
                year = int(parts[2])
                info['age'] = datetime.now().year - year
            except:
                pass
            break
    
    # Nationality
    patterns = [
        r"Nationality\s+([A-Z]+)",
        r"Nationality\s*:\s*([A-Za-z]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val = match.group(1).strip()
            info['nationality'] = 'Indian' if val.upper() == 'INDIAN' else val.capitalize()
            break
    
    # Marital Status
    patterns = [
        r"Marital Status\s+([A-Z]+)",
        r"Marital Status\s*:\s*([A-Za-z]+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            info['marital_status'] = match.group(1).strip().capitalize()
            break
    
    # Location - from address
    patterns = [
        r"(BANGALORE\s*-?\s*\d{6}[,\s]*KARNATAKA)",
        r"(CHENNAI\s*-?\s*\d{6}[,\s]*TAMIL NADU)",
        r"(MUMBAI\s*-?\s*\d{6}[,\s]*MAHARASHTRA)",
        r"([A-Z\s]+\s*-?\s*\d{6}[,\s]*(?:KARNATAKA|TAMIL NADU|MAHARASHTRA|DELHI|TELANGANA|WEST BENGAL))",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            info['current_location'] = re.sub(r'\s+', ' ', match.group(1).strip())
            break
    
    return info


def create_resume_parse_prompt(text):
    """
    ULTRA-EXPLICIT AI PROMPT - Cannot be ignored or misunderstood
    """
    
    # First, let's check if there's a PERSONAL INFORMATION section
    personal_info_section = ""
    if re.search(r"PERSONAL\s+INFORMATION", text, re.IGNORECASE):
        # Extract the section
        match = re.search(r"(PERSONAL\s+INFORMATION.*?)(?=\n[A-Z\s]{10,}|\n\n\n|$)", text, re.IGNORECASE | re.DOTALL)
        if match:
            personal_info_section = match.group(1)
    
    prompt = f"""You are extracting data from a resume. You MUST extract ALL personal information fields.

CRITICAL INSTRUCTION: Look for a section titled "PERSONAL INFORMATION" or "PERSONAL DETAILS" in the resume. 
This section contains: Date of Birth, Nationality, Gender, Marital Status.

{f'PERSONAL INFORMATION SECTION FOUND:{personal_info_section}' if personal_info_section else ''}

Return ONLY this JSON (no markdown, no explanations):

{{
  "name": "extract full name",
  "email": "extract email",
  "phone": "extract phone",
  
  "gender": "LOOK FOR 'Gender' FIELD - extract Male/Female/MALE/FEMALE",
  "date_of_birth": "LOOK FOR 'Date of Birth' or 'DOB' - extract as DD/MM/YYYY",
  "nationality": "LOOK FOR 'Nationality' field - extract the value",
  "marital_status": "LOOK FOR 'Marital Status' field - extract Single/Married",
  "current_location": "extract from address - city, state, country",
  
  "education": [{{"Degree": "", "University": "", "Years": ""}}],
  "experience": [{{"Company": "", "Role": "", "Years": ""}}],
  "skills": ["skill1", "skill2"],
  "publications": [{{"Title": "", "Journal/Conference": "", "Date": ""}}]
}}

MANDATORY EXTRACTION RULES:
1. If you see "Gender MALE" → extract "Male"
2. If you see "Date of Birth 01/06/1969" → extract "01/06/1969"
3. If you see "Nationality INDIAN" → extract "Indian"
4. If you see "Marital Status MARRIED" → extract "Married"
5. For location, look for address with city name and pincode

Resume text:
{text[:12000]}

Return ONLY the JSON object. DO NOT skip gender, date_of_birth, nationality, or marital_status fields.
"""
    return prompt


async def call_groq_api(prompt, temperature=0.1, max_retries=3):
    """Call Groq API - VERY LOW temperature for exact extraction"""
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
    """Parse AI JSON response"""
    cleaned = re.sub(r'^```json\s*', '', response_text.strip(), re.IGNORECASE | re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned.strip(), re.MULTILINE)
    cleaned = cleaned.strip()
    
    json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
    if json_match:
        cleaned = json_match.group(0)
    
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        try:
            fixed = re.sub(r',(\s*[}\]])', r'\1', cleaned)
            return json.loads(fixed)
        except:
            raise ValueError("Failed to parse AI response as JSON")


async def parse_resume(file):
    """
    HYBRID PARSER - Regex extraction ALWAYS runs and OVERWRITES AI data
    """
    try:
        print(f"\n{'='*70}")
        print(f"PARSING: {file.filename}")
        print('='*70)
        
        # Extract text
        text = await extract_text_from_file(file)
        if not text or len(text.strip()) < 50:
            raise ValueError("Could not extract text from file")
        
        print(f"✓ Extracted {len(text)} characters")
        
        # STEP 1: REGEX EXTRACTION (PRIMARY)
        print("\n🔍 REGEX EXTRACTION:")
        regex_data = extract_personal_info_regex(text)
        for key, value in regex_data.items():
            print(f"  ✓ {key}: {value}")
        
        # STEP 2: AI EXTRACTION
        print("\n🤖 AI EXTRACTION:")
        prompt = create_resume_parse_prompt(text)
        response = await call_groq_api(prompt, temperature=0.1)
        
        data = response.json()
        if "choices" not in data or not data["choices"]:
            raise ValueError("Invalid API response")
        
        ai_text = data["choices"][0]["message"]["content"]
        ai_data = parse_ai_response(ai_text)
        print(f"✓ AI extracted {len(ai_data)} fields")
        
        # STEP 3: MERGE - Regex OVERWRITES AI
        print("\n🔄 MERGING (Regex overwrites AI):")
        final_data = ai_data.copy()
        
        # Ensure all schema fields exist
        schema_fields = [
            "gender", "date_of_birth", "age", "nationality", "marital_status",
            "current_location", "permanent_address", "hometown", "preferred_locations",
            "willing_to_relocate", "work_authorization", "visa_status", "notice_period",
            "availability_date", "current_ctc", "expected_ctc", "current_salary",
            "expected_salary", "summary", "objective", "career_objective", "tenth_marks",
            "twelfth_marks", "graduation_year", "current_year_of_study", 
            "university_roll_number", "student_id", "derived_skills", "internships",
            "achievements", "research", "awards", "volunteer_work",
            "extracurricular_activities", "languages", "interests", "hobbies",
            "references", "linkedin_url", "github_url", "portfolio_url",
            "personal_website", "placement_preferences", "preferred_job_role",
            "preferred_industry", "extra_sections"
        ]
        
        for field in schema_fields:
            if field not in final_data:
                if field in ["preferred_locations", "derived_skills", "internships", "achievements",
                            "research", "awards", "volunteer_work", "extracurricular_activities",
                            "languages", "interests", "hobbies", "references"]:
                    final_data[field] = []
                elif field == "extra_sections":
                    final_data[field] = {}
                else:
                    final_data[field] = None
        
        # OVERWRITE with regex data
        for key, value in regex_data.items():
            final_data[key] = value
            print(f"  ✓ OVERWRITE '{key}' = {value}")
        
        final_data["filename"] = file.filename
        
        print(f"\n{'='*70}")
        print("✅ PARSING COMPLETE")
        print(f"   Personal fields from regex: {len(regex_data)}")
        print(f"   Other fields from AI: {len([k for k in final_data.keys() if k not in regex_data])}")
        print('='*70 + '\n')
        
        return final_data
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        raise ValueError(f"Failed to parse resume: {str(e)}")