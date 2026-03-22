import pdfplumber
from docx import Document
import re
import json
import httpx
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_PARSING_MODEL
import io
from datetime import datetime


# ---------------------------------------------------------------------------
# Known Indian cities — used for PDF line-merge fix.
# Keep this in sync with location_utils.CITY_STATE_MAPPING or import from it.
# ---------------------------------------------------------------------------
_KNOWN_CITIES = {
    "bhubaneswar", "cuttack", "rourkela", "berhampur", "sambalpur", "puri",
    "balasore", "baripada", "bhadrak", "jharsuguda", "jeypore", "kendrapara",
    "rayagada", "angul", "koraput", "parlakhemundi", "sundargarh",
    "bangalore", "bengaluru", "mysore", "mysuru", "hubli", "mangalore",
    "belgaum", "gulbarga", "davanagere", "bellary", "bijapur", "shimoga",
    "tumkur", "raichur", "bidar", "hospet", "gadag", "udupi", "hassan",
    "chitradurga", "mandya",
    "chennai", "madras", "coimbatore", "madurai", "tiruchirappalli", "trichy",
    "salem", "tirunelveli", "tiruppur", "erode", "vellore", "thoothukudi",
    "dindigul", "thanjavur", "ranipet", "sivakasi", "karur", "kanchipuram",
    "kumbakonam", "nagercoil", "cuddalore",
    "mumbai", "pune", "nagpur", "thane", "nashik", "aurangabad", "solapur",
    "kolhapur", "amravati", "sangli", "malegaon", "jalgaon", "akola",
    "latur", "ahmednagar", "chandrapur", "parbhani", "ichalkaranji", "jalna",
    "delhi", "new delhi",
    "kolkata", "calcutta", "howrah", "durgapur", "asansol", "siliguri",
    "bardhaman", "kharagpur", "haldia", "krishnanagar", "raiganj", "medinipur",
    "jalpaiguri",
    "ahmedabad", "surat", "vadodara", "rajkot", "bhavnagar", "jamnagar",
    "junagadh", "gandhinagar", "gandhidham", "anand", "navsari", "morbi",
    "surendranagar", "bharuch", "vapi",
    "hyderabad", "warangal", "nizamabad", "karimnagar", "ramagundam",
    "khammam", "mahbubnagar", "nalgonda", "adilabad", "suryapet",
    "siddipet", "miryalaguda",
    "visakhapatnam", "vijayawada", "guntur", "nellore", "kurnool", "tirupati",
    "kadapa", "kakinada", "rajahmundry", "anantapur", "eluru", "ongole",
    "vizianagaram", "machilipatnam",
    "lucknow", "kanpur", "ghaziabad", "agra", "meerut", "varanasi",
    "prayagraj", "allahabad", "bareilly", "aligarh", "moradabad",
    "saharanpur", "gorakhpur", "noida", "firozabad", "jhansi",
    "muzaffarnagar", "mathura", "rampur",
    "jaipur", "jodhpur", "kota", "bikaner", "udaipur", "ajmer", "bhilwara",
    "alwar", "bharatpur", "pali", "sikar", "tonk",
    "indore", "bhopal", "jabalpur", "gwalior", "ujjain", "sagar", "dewas",
    "satna", "ratlam", "rewa", "katni", "singrauli",
    "ludhiana", "amritsar", "jalandhar", "patiala", "bathinda", "mohali",
    "pathankot", "hoshiarpur", "batala", "moga", "abohar", "malerkotla",
    "khanna",
    "faridabad", "gurgaon", "gurugram", "panipat", "ambala", "yamunanagar",
    "rohtak", "hisar", "karnal", "sonipat", "panchkula", "bhiwani", "sirsa",
    "thiruvananthapuram", "trivandrum", "kochi", "cochin", "kozhikode",
    "calicut", "kollam", "thrissur", "kannur", "alappuzha", "kottayam",
    "palakkad", "malappuram",
    "patna", "gaya", "bhagalpur", "muzaffarpur", "purnia", "darbhanga",
    "begusarai", "katihar", "munger",
    "ranchi", "jamshedpur", "dhanbad", "bokaro", "deoghar", "hazaribagh",
    "giridih",
    "raipur", "bhilai", "bilaspur", "korba", "durg", "raigarh",
    "rajnandgaon",
    "guwahati", "silchar", "dibrugarh", "jorhat", "nagaon", "tinsukia",
    "tezpur",
    "dehradun", "haridwar", "roorkee", "haldwani", "rudrapur", "kashipur",
    "rishikesh",
    "shimla", "mandi", "solan", "nahan", "palampur", "sundernagar",
    "srinagar", "jammu", "anantnag", "baramulla", "udhampur",
    "panaji", "margao", "mapusa", "ponda",
    "puducherry", "pondicherry", "karaikal",
    "chandigarh",
    # two-word cities
    "navi mumbai", "new delhi", "sri ganganagar", "vasco da gama",
    "bihar sharif", "english bazar",
}


def _fix_pdf_line_merges(text: str) -> str:
    """
    pdfplumber sometimes joins the last token of one line with the first
    token of the next line when there is no whitespace separator in the
    PDF stream.  The classic case in resumes:

        "Bismay Sarangi\\nBhubaneswar, Odisha"
        → extracted as →
        "Bismay Sarangi Bhubaneswar, Odisha"

    Strategy: scan every token.  When a token (or token-pair) matches a
    known city name AND the preceding token looks like a proper-noun
    (starts with an uppercase letter, no digits, not already separated by
    a newline), insert a newline before the city token so the rest of the
    pipeline sees the correct structure.
    """
    # Work token by token; preserve existing newlines as sentinel tokens
    tokens = re.split(r'(\n)', text)           # keep '\n' as its own element
    out = []
    i = 0
    while i < len(tokens):
        tok = tokens[i]

        # Try two-word city first (current + next non-newline token)
        two_word = None
        if i + 1 < len(tokens):
            next_tok = tokens[i + 1]
            if next_tok != '\n':
                two_word = f"{tok} {next_tok}".lower().strip()

        if two_word and two_word in _KNOWN_CITIES:
            # Check that the token immediately before is a proper-noun word
            prev = out[-1] if out else ''
            if prev and prev != '\n' and prev[0].isupper() and prev.isalpha():
                out.append('\n')
            out.append(tok)
            out.append(' ')
            out.append(tokens[i + 1])
            i += 2
            continue

        single = tok.lower().strip()
        if single in _KNOWN_CITIES:
            prev = out[-1] if out else ''
            if prev and prev != '\n' and prev[0].isupper() and prev.isalpha():
                out.append('\n')

        out.append(tok)
        i += 1

    return ''.join(out)


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

    # Fix PDF line-merge artifacts BEFORE any regex or whitespace normalisation.
    # e.g. "Sarangi Bhubaneswar, Odisha" → "Sarangi\nBhubaneswar, Odisha"
    text = _fix_pdf_line_merges(text)

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
            dob_str = match.group(1).strip().replace('-', '/').replace('.', '/')
            info['date_of_birth'] = dob_str
            try:
                parts = dob_str.split('/')
                if len(parts) == 3:
                    day, month, year = int(parts[0]), int(parts[1]), int(parts[2])
                    if year < 100:
                        year += 1900 if year > 50 else 2000
                    info['age'] = datetime.now().year - year
            except Exception:
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
    # Patterns ordered from most-specific (labelled) to least-specific (bare city).
    # The bare-city pattern only captures the known city word(s), nothing before it,
    # thanks to the negative lookbehind + word-boundary anchors.
    location_patterns = [
        # Explicit label + city + pincode
        r"(?:Address|Location|City)\s*[:\-]?\s*([A-Za-z\s]+?)\s*[-,]?\s*(\d{6})\b",
        # City + known Indian state
        r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*(Karnataka|Tamil Nadu|Maharashtra|Delhi|"
        r"Telangana|West Bengal|Gujarat|Rajasthan|Punjab|Haryana|Uttar Pradesh|Madhya Pradesh|"
        r"Kerala|Andhra Pradesh|Odisha|Chhattisgarh)\b",
        # Explicit city/location label
        r"(?:City|Location|Based in|Residing in)\s*[:\-]?\s*([A-Za-z][A-Za-z\s]{2,20}?)(?:\s*[\n,;]|$)",
        # Bare known city — negative lookbehind prevents grabbing a preceding word
        r"(?<![A-Za-z])(Bangalore|Bengaluru|Chennai|Mumbai|Delhi|Hyderabad|Kolkata|Pune|"
        r"Ahmedabad|Jaipur|Lucknow|Kanpur|Nagpur|Visakhapatnam|Bhopal|Patna|Ludhiana|Agra|"
        r"Nashik|Vadodara|Coimbatore|Madurai|Mysore|Bhubaneswar)(?![A-Za-z])",
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
  "current_location": "ONLY the city + state, e.g. 'Bhubaneswar, Odisha' or 'Bangalore, Karnataka'. Do NOT include the candidate's name, street address, building name, locality name, or any word that appears before the actual city name. If the raw text looks like 'Sarangi Bhubaneswar, Odisha', the correct value is 'Bhubaneswar, Odisha'.",

  "permanent_address": "full address or null",
  "hometown": "hometown or null",
  "preferred_locations": ["city1", "city2"],
  "willing_to_relocate": true,

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

  "skills": ["skill1", "skill2"],
  "derived_skills": [],

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

  "interests": ["interest1", "interest2"],
  "hobbies": ["hobby1", "hobby2"],

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
7. current_location must be ONLY "City, State" — never include a person's name or any word preceding the city

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
                import asyncio as _a
                await _a.sleep(2 ** attempt)
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
        except Exception:
            print(f"JSON Parse Error: {e}")
            print(f"Error at position {e.pos}: {cleaned[max(0, e.pos-50):e.pos+50]}")
            raise ValueError(f"Failed to parse AI response as JSON: {e}")


def normalize_list_fields(data):
    """
    FIX: Convert string arrays to dict arrays for Pydantic validation
    """
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
                    if item.lower() not in ['not mentioned', 'not available', 'none', 'n/a', 'nil']:
                        normalized.append(converter(item))
                elif isinstance(item, dict):
                    normalized.append(item)
            data[field] = normalized

    return data


def _clean_location(location: str) -> str:
    """
    Last-resort cleaner: if the location still contains a word before a
    known city name (e.g. "Sarangi Bhubaneswar, Odisha"), strip everything
    up to and including the non-city prefix word(s).

    Works by sliding a window over the tokens and returning the substring
    starting at the first token that is a known city.
    """
    if not location:
        return location

    # Split into "city part" and optional "state part" at the first comma
    comma_idx = location.find(',')
    if comma_idx != -1:
        city_part = location[:comma_idx].strip()
        state_part = location[comma_idx:]          # includes the comma
    else:
        city_part = location.strip()
        state_part = ""

    tokens = city_part.split()

    # Try longest match first (handles two-word cities like "Navi Mumbai")
    for length in range(min(len(tokens), 3), 0, -1):
        for start in range(len(tokens) - length + 1):
            candidate = ' '.join(tokens[start:start + length])
            if candidate.lower() in _KNOWN_CITIES:
                return candidate.title() + state_part

    # No known city found — return unchanged
    return location


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

        # ------------------------------------------------------------------
        # POST-PROCESS: strip any surname/locality prefix from current_location
        # e.g. "Sarangi Bhubaneswar, Odisha" → "Bhubaneswar, Odisha"
        # ------------------------------------------------------------------
        if final_data.get('current_location'):
            original_loc = final_data['current_location']
            cleaned_loc = _clean_location(original_loc)
            if cleaned_loc != original_loc:
                print(f"  ✓ Location cleaned: '{original_loc}' → '{cleaned_loc}'")
            final_data['current_location'] = cleaned_loc

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

        list_fields = [
            'education', 'skills', 'experience', 'projects', 'internships',
            'achievements', 'publications', 'research', 'certifications',
            'awards', 'volunteer_work', 'extracurricular_activities',
            'languages', 'interests', 'hobbies', 'references',
            'derived_skills', 'preferred_locations'
        ]
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