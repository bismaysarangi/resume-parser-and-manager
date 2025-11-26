import pdfplumber
from docx import Document
import re
import json
import httpx
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_PARSING_MODEL


async def extract_text_from_file(file):
    """
    Extract text from uploaded file (PDF, DOCX, TXT)
    """
    text = ""

    if file.filename.endswith(".pdf"):
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
    elif file.filename.endswith(".docx"):
        doc = Document(file.file)
        text = "\n".join([p.text for p in doc.paragraphs])
    elif file.filename.endswith(".txt"):
        text = (await file.read()).decode("utf-8")
    else:
        raise ValueError("Unsupported file type. Please upload PDF, DOCX, or TXT.")

    # Clean up whitespace
    text = re.sub(r"[ \t]+", " ", text)
    return text


def create_resume_parse_prompt(text):
    """
    Create prompt for resume parsing with enhanced skill extraction
    """
    prompt = f"""
    Extract structured resume data from the following text and return strict JSON only:
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

    IMPORTANT INSTRUCTIONS:
    1. "skills": Extract skills explicitly mentioned in the skills section
    2. "derived_skills": Extract additional technical skills, tools, frameworks, and technologies mentioned in the Experience and Projects sections that are NOT already in the skills list. Look for:
       - Programming languages (Python, Java, JavaScript, etc.)
       - Frameworks (React, Django, Spring Boot, etc.)
       - Databases (MySQL, MongoDB, PostgreSQL, etc.)
       - Tools (Git, Docker, Kubernetes, AWS, etc.)
       - Technologies and platforms mentioned in project descriptions and work experience
    3. Do NOT duplicate skills between "skills" and "derived_skills"
    4. Be thorough in extracting derived_skills from project descriptions and experience details

    Resume text:
    {text[:6000]}
    """
    return prompt


async def call_groq_api(prompt, temperature=0.7):
    """
    Generic function to call Groq API
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_PARSING_MODEL,  # Use parsing model from config
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
    # Remove ```json ... ``` if present
    cleaned = re.sub(r"^```json\s*|\s*```$", "", response_text.strip(), flags=re.DOTALL)
    return json.loads(cleaned)


async def parse_resume(file):
    """
    Main function to parse resume
    """
    try:
        # Extract text
        text = await extract_text_from_file(file)

        # Create prompt
        prompt = create_resume_parse_prompt(text)

        # Call Groq API
        response = await call_groq_api(prompt)
        data = response.json()

        # Check if response has choices (handle API errors)
        if "choices" not in data:
            error_msg = data.get("error", {}).get("message", "Unknown API error")
            raise Exception(f"API error: {error_msg}")

        # Parse response
        ai_text = data["choices"][0]["message"]["content"]
        parsed = parse_ai_response(ai_text)

        # Ensure derived_skills exists
        if "derived_skills" not in parsed:
            parsed["derived_skills"] = []

        return {"filename": file.filename, **parsed}

    except ValueError as e:
        raise ValueError(str(e))
    except httpx.HTTPStatusError as e:
        raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
    except KeyError as e:
        raise Exception(f"Invalid API response format: missing {str(e)}")
    except Exception as e:
        raise Exception(f"Failed to parse resume: {str(e)}")