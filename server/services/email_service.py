import httpx
import json
import re
from typing import Dict, Any
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_CHATBOT_MODEL

async def generate_email_content(recruiter_name: str, candidate_name: str, job_title: str = None, company: str = None) -> Dict[str, str]:
    """
    Generate personalized email content using AI
    """
    prompt = f"""
    Generate a professional recruitment email with the following details:
    - Recruiter Name: {recruiter_name}
    - Candidate Name: {candidate_name}
    - Job Title: {job_title or "relevant position"}
    - Company: {company or "our company"}

    CRITICAL: Return ONLY a valid JSON object with NO markdown, NO explanations, NO extra text.

    Return this EXACT structure:
    {{
      "subject": "email subject line",
      "body": "full email body text with proper formatting"
    }}

    The email should be professional, warm, and engaging. Include placeholders for any missing information.
    """

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": GROQ_CHATBOT_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 1000
    }

    try:
        print(f"🤖 Generating email with Groq using model: {GROQ_CHATBOT_MODEL}")
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(GROQ_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            ai_text = data["choices"][0]["message"]["content"]
            print(f"✅ Groq response received")
            
            # Clean and parse JSON
            json_match = re.search(r'\{.*\}', ai_text, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)
                email_data = json.loads(cleaned)
                return email_data
            else:
                print(f"⚠️ Could not parse JSON from response, using fallback")
                # Fallback email template
                return {
                    "subject": f"Exciting Opportunity at {company or 'our company'}",
                    "body": f"Dear {candidate_name},\n\nI came across your profile and was impressed by your experience. We have an exciting opportunity at {company or 'our company'} that I believe would be a great fit for your skills.\n\nWould you be available for a brief call to discuss this further?\n\nBest regards,\n{recruiter_name}"
                }
    except Exception as e:
        print(f"❌ Error generating email: {str(e)}")
        # Return default template on error
        return {
            "subject": f"Opportunity at {company or 'our company'}",
            "body": f"Dear {candidate_name},\n\nI hope this email finds you well. I came across your profile and would like to discuss potential opportunities at {company or 'our company'} that match your experience.\n\nPlease let me know if you'd be interested in a conversation.\n\nBest regards,\n{recruiter_name}"
        }


def create_email_message(recruiter_email: str, candidate_email: str, subject: str, body: str) -> str:
    """
    Create a mailto link with pre-filled content
    """
    import urllib.parse
    
    # Encode the subject and body for URL
    encoded_subject = urllib.parse.quote(subject)
    encoded_body = urllib.parse.quote(body)
    
    # Create mailto link
    mailto_link = f"mailto:{candidate_email}?subject={encoded_subject}&body={encoded_body}"
    
    print(f"📧 Created mailto link: {mailto_link[:100]}...")
    
    return mailto_link


async def prepare_email_for_candidate(recruiter_name: str, recruiter_email: str, candidate: Dict[str, Any], job_context: str = None) -> Dict[str, Any]:
    """
    Prepare complete email data for a candidate
    """
    print(f"📧 Preparing email for candidate...")
    
    candidate_name = candidate.get('parsed_data', {}).get('name', 'Candidate')
    candidate_email = candidate.get('parsed_data', {}).get('email')
    
    if not candidate_email:
        print(f"❌ Candidate email not available")
        return {"error": "Candidate email not available"}
    
    print(f"✅ Candidate: {candidate_name} <{candidate_email}>")
    
    # Extract job title from context if available
    job_title = None
    company = None
    
    if job_context:
        # Simple extraction - can be enhanced
        words = job_context.split()
        if len(words) > 3:
            job_title = " ".join(words[:3]) + "..."
    
    # Generate email content
    email_content = await generate_email_content(
        recruiter_name=recruiter_name,
        candidate_name=candidate_name,
        job_title=job_title,
        company=company
    )
    
    # Create mailto link
    mailto_link = create_email_message(
        recruiter_email=recruiter_email,
        candidate_email=candidate_email,
        subject=email_content['subject'],
        body=email_content['body']
    )
    
    return {
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "subject": email_content['subject'],
        "body": email_content['body'],
        "mailto_link": mailto_link
    }