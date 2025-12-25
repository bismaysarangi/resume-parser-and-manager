import pdfplumber
from docx import Document
import re
import json
import httpx
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_PARSING_MODEL
import io


async def extract_text_from_file(file):
    """
    Extract text from uploaded file (PDF, DOCX, TXT)
    """
    text = ""

    # Read file content once
    file_content = await file.read()
    
    # Reset file pointer for potential re-reads
    await file.seek(0)

    if file.filename.endswith(".pdf"):
        # Use BytesIO to create file-like object from bytes
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
    elif file.filename.endswith(".docx"):
        # Use BytesIO for docx as well
        doc = Document(io.BytesIO(file_content))
        text = "\n".join([p.text for p in doc.paragraphs])
    elif file.filename.endswith(".txt"):
        text = file_content.decode("utf-8")
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


async def call_groq_api(prompt, temperature=0.7, max_retries=3):
    """
    Call Groq API with retry logic and rate limit handling
    """
    import asyncio
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_PARSING_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature
    }

    last_error = None
    
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(GROQ_URL, headers=headers, json=payload)
                response.raise_for_status()
                return response
                
        except httpx.HTTPStatusError as e:
            last_error = f"HTTP {e.response.status_code}: {e.response.text}"
            print(f"API error (attempt {attempt + 1}/{max_retries}): {last_error}")
            
            # Handle rate limit (429) specifically
            if e.response.status_code == 429:
                if "rate_limit_exceeded" in e.response.text:
                    # Extract wait time from error message if possible
                    import re
                    wait_match = re.search(r'Please try again in (\d+)m(\d+)', e.response.text)
                    if wait_match:
                        minutes = int(wait_match.group(1))
                        seconds = int(wait_match.group(2).split('.')[0])
                        wait_seconds = minutes * 60 + seconds
                        raise Exception(f"GROQ API rate limit exceeded. Please try again in {minutes}m {seconds}s. Consider switching to a smaller model (llama-3.1-8b-instant) or upgrading your plan.")
                    else:
                        raise Exception("GROQ API rate limit exceeded. Please wait a few minutes or switch to a smaller model (llama-3.1-8b-instant).")
            
            # Don't retry on other client errors (4xx)
            if 400 <= e.response.status_code < 500:
                raise Exception(f"API request failed: {last_error}")
            
            # Retry on 5xx errors
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                continue
            raise Exception(f"API request failed after {max_retries} attempts: {last_error}")
            
        except Exception as e:
            last_error = str(e)
            print(f"Unexpected error (attempt {attempt + 1}/{max_retries}): {last_error}")
            if attempt < max_retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise Exception(f"Failed after {max_retries} attempts: {last_error}")


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
        print(f"Starting to parse resume: {file.filename}")
        
        # Extract text
        text = await extract_text_from_file(file)
        
        if not text or len(text.strip()) < 50:
            raise ValueError("Extracted text is too short or empty. Please check if the file contains readable text.")

        print(f"Extracted {len(text)} characters from resume")

        # Create prompt
        prompt = create_resume_parse_prompt(text)

        # Call Groq API with retry
        response = await call_groq_api(prompt)
        data = response.json()

        # Check if response has choices
        if "choices" not in data or not data["choices"]:
            error_msg = data.get("error", {}).get("message", "Unknown API error")
            print(f"API Error: {json.dumps(data, indent=2)}")
            raise Exception(f"API error: {error_msg}")

        # Parse response
        ai_text = data["choices"][0]["message"]["content"]
        parsed = parse_ai_response(ai_text)

        # Ensure all required fields exist
        if "derived_skills" not in parsed:
            parsed["derived_skills"] = []
        
        # Validate critical fields
        if not parsed.get("name"):
            parsed["name"] = "Unknown Candidate"
        if not parsed.get("email"):
            parsed["email"] = "No email"
        if not parsed.get("phone"):
            parsed["phone"] = "No phone"

        print(f"✓ Successfully parsed resume: {file.filename}")
        return {"filename": file.filename, **parsed}

    except ValueError as e:
        print(f"ValueError parsing {file.filename}: {str(e)}")
        raise ValueError(str(e))
    except json.JSONDecodeError as e:
        print(f"JSON decode error for {file.filename}: {str(e)}")
        raise Exception(f"Failed to parse AI response as JSON: {str(e)}")
    except httpx.HTTPStatusError as e:
        print(f"HTTP error for {file.filename}: {e.response.status_code}")
        raise Exception(f"API request failed: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"Error parsing {file.filename}: {str(e)}")
        raise Exception(f"Failed to parse resume: {str(e)}")