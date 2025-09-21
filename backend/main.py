from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
from docx import Document
import re
import httpx
import json

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Groq/OpenAI API key
GROQ_API_KEY = "groq"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    text = ""

    # Step 1: Extract text from uploaded file
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
        return {"error": "Unsupported file type. Please upload PDF, DOCX, or TXT."}

    text = re.sub(r"[ \t]+", " ", text)

    # Step 2: Create prompt for AI
    prompt = f"""
    Extract structured resume data from the following text and return strict JSON only:
    {{
      "name": "",
      "email": "",
      "phone": "",
      "education": [{{"degree": "", "university": "", "college": "", "years": ""}}],
      "skills": [],
      "experience": [{{"company": "", "role": "", "years": ""}}],
      "projects": [{{"name": "", "description": "", "tech_stack": "", "date": ""}}],
      "tenth_marks": "",
      "twelfth_marks": ""
    }}

    Resume text:
    {text[:6000]}
    """

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "openai/gpt-oss-20b",
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(GROQ_URL, headers=headers, json=payload)

    try:
        data = response.json()
        # Groq API returns the AI response in: data['choices'][0]['message']['content']
        ai_text = data["choices"][0]["message"]["content"]

        # Remove ```json ... ``` if present
        ai_text = re.sub(r"^```json\s*|\s*```$", "", ai_text.strip(), flags=re.DOTALL)

        parsed = json.loads(ai_text)
        return {"filename": file.filename, **parsed}

    except Exception as e:
        return {
            "error": "Failed to parse AI response",
            "details": str(e),
            "raw_response": response.text,
        }
