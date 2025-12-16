from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import json
import re
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_recruiter
from core.database import db
from core.config import GROQ_API_KEY, GROQ_URL

router = APIRouter()

resume_history_collection = db["resume_history"]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    query: str
    conversation_history: List[ChatMessage] = []

def deduplicate_candidates(candidates: List[Dict]) -> List[Dict]:
    """
    Apply the SAME deduplication logic as the candidates page
    Returns only unique/distinct candidates
    """
    unique_candidates = []
    seen_emails = set()
    seen_phones = set()
    seen_names = set()
    seen_ids = set()

    for candidate in candidates:
        parsed = candidate.get("parsed_data", {})
        candidate_id = candidate.get("_id")

        # 1. Prepare Identifiers
        email = parsed.get("email")
        email = email.strip().lower() if email else None

        # Normalize phone: remove spaces, dashes, parentheses
        phone = parsed.get("phone")
        if phone:
            phone = str(phone).replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            # Remove any non-digit characters
            phone = re.sub(r'\D', '', phone)
            # Only consider phone valid if it has at least 6 digits
            if len(phone) < 6:
                phone = None
        else:
            phone = None

        name = parsed.get("name")
        name = name.strip().lower() if name else None

        is_duplicate = False

        # 2. Check Database ID (Absolute Duplicate)
        if candidate_id in seen_ids:
            is_duplicate = True

        # 3. Check Email (Strongest Identifier)
        if not is_duplicate and email and email != "no email":
            if email in seen_emails:
                is_duplicate = True
            else:
                seen_emails.add(email)

        # 4. Check Phone (Strong Identifier)
        if not is_duplicate and phone:
            if phone in seen_phones:
                is_duplicate = True
            else:
                seen_phones.add(phone)

        # 5. Check Name (Weakest Identifier)
        if not is_duplicate and name and name != "unknown candidate":
            if name in seen_names:
                is_duplicate = True
            else:
                seen_names.add(name)

        # 6. If passed all checks, add to list
        if not is_duplicate:
            seen_ids.add(candidate_id)
            unique_candidates.append(candidate)

    return unique_candidates

async def call_groq_api(prompt: str, temperature: float = 0.7):
    """
    Call Groq API for chatbot responses
    """
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": 1500
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()

def extract_skills_from_query(query: str) -> List[str]:
    """
    Extract skill keywords from the query
    """
    common_skills = [
        'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node',
        'nodejs', 'django', 'flask', 'spring', 'dotnet', 'c++', 'c#',
        'ruby', 'php', 'go', 'rust', 'swift', 'kotlin', 'typescript',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mongodb', 'sql',
        'postgresql', 'mysql', 'redis', 'machine learning', 'ml', 'ai',
        'data science', 'tensorflow', 'pytorch', 'react native', 'flutter'
    ]
    
    query_lower = query.lower()
    found_skills = []
    
    for skill in common_skills:
        if skill in query_lower:
            found_skills.append(skill)
    
    return found_skills

def filter_candidates_by_query(candidates: List[Dict], query: str) -> List[Dict]:
    """
    Pre-filter candidates based on query to reduce token usage
    """
    query_lower = query.lower()
    
    # Extract search criteria
    skills_to_find = extract_skills_from_query(query)
    
    # Check for experience requirements
    experience_match = re.search(r'(\d+)\+?\s*years?', query_lower)
    years_required = int(experience_match.group(1)) if experience_match else None
    
    # Check for company mentions
    company_keywords = []
    for word in ['google', 'microsoft', 'amazon', 'facebook', 'meta', 'apple', 'netflix', 'uber']:
        if word in query_lower:
            company_keywords.append(word)
    
    # Filter candidates
    filtered = []
    
    for candidate in candidates:
        parsed = candidate.get("parsed_data", {})
        
        # Check skills match
        if skills_to_find:
            candidate_skills = [
                s.lower() for s in (parsed.get("skills", []) + parsed.get("derived_skills", []))
            ]
            
            has_skill = any(
                any(skill_keyword in candidate_skill for skill_keyword in skills_to_find)
                for candidate_skill in candidate_skills
            )
            
            if not has_skill:
                continue
        
        # Check experience years
        if years_required:
            experiences = parsed.get("experience", [])
            has_experience = False
            
            for exp in experiences:
                years_str = exp.get("Years", "")
                numbers = re.findall(r'\d+', years_str)
                if numbers:
                    max_years = max(int(n) for n in numbers)
                    if max_years >= years_required:
                        has_experience = True
                        break
            
            if not has_experience:
                continue
        
        # Check company match
        if company_keywords:
            experiences = parsed.get("experience", [])
            has_company = any(
                any(keyword in exp.get("Company", "").lower() for keyword in company_keywords)
                for exp in experiences
            )
            
            if not has_company:
                continue
        
        filtered.append(candidate)
    
    # If no specific filters or all candidates filtered out, return top 20
    if not filtered and not (skills_to_find or years_required or company_keywords):
        return candidates[:20]
    
    return filtered[:20]

def format_candidate_data_compact(candidates: List[Dict]) -> str:
    """
    Format candidate data in a compact way to reduce tokens
    """
    formatted_candidates = []
    
    for idx, candidate in enumerate(candidates, 1):
        parsed = candidate.get("parsed_data", {})
        
        candidate_info = {
            "id": idx,
            "name": parsed.get("name", "Unknown"),
            "email": parsed.get("email", "N/A"),
            "skills": (parsed.get("skills", []) + parsed.get("derived_skills", []))[:10],
        }
        
        experiences = parsed.get("experience", [])
        if experiences:
            candidate_info["experience"] = [
                {
                    "role": exp.get("Role", "N/A"),
                    "company": exp.get("Company", "N/A"),
                    "years": exp.get("Years", "N/A")
                }
                for exp in experiences[:2]
            ]
        
        education = parsed.get("education", [])
        if education:
            candidate_info["education"] = [
                {
                    "degree": edu.get("Degree", "N/A"),
                    "university": edu.get("University", "N/A")
                }
                for edu in education[:1]
            ]
        
        formatted_candidates.append(candidate_info)
    
    return json.dumps(formatted_candidates, indent=1)

def create_chatbot_prompt(query: str, candidates_data: str, total_shown: int, total_in_db: int) -> str:
    """
    Create a compact prompt for the chatbot
    """
    prompt = f"""You are an AI recruiter assistant. Answer based on this candidate data.

CANDIDATES (showing {total_shown} distinct candidates of {total_in_db} total):
{candidates_data}

QUERY: "{query}"

RULES:
1. Answer ONLY from the data above
2. If info missing, say "I don't have that information"
3. List candidates with: Name, Email, Key Skills, Latest Role
4. Be concise and specific
5. Format with numbered lists

Answer now:"""
    
    return prompt

@router.post("/chatbot", dependencies=[Depends(require_recruiter)])
async def chatbot_query(
    request: ChatRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Process chatbot queries about candidates (RECRUITER ONLY)
    Uses SAME deduplication logic as candidates page
    """
    try:
        # Fetch all candidates for this recruiter
        all_candidates = list(resume_history_collection.find(
            {"recruiter_email": current_user.email}
        ).sort("parsed_at", -1))
        
        if not all_candidates:
            return {
                "response": "You don't have any candidates in your database yet. Please upload some resumes first."
            }
        
        # Convert ObjectId to string for all candidates
        for candidate in all_candidates:
            candidate["_id"] = str(candidate["_id"])
        
        # APPLY DEDUPLICATION - Same as candidates page
        unique_candidates = deduplicate_candidates(all_candidates)
        
        print(f"Total candidates in DB: {len(all_candidates)}")
        print(f"Unique/Distinct candidates: {len(unique_candidates)}")
        
        if not unique_candidates:
            return {
                "response": "No distinct candidates found in your database."
            }
        
        # Pre-filter unique candidates based on query
        filtered_candidates = filter_candidates_by_query(unique_candidates, request.query)
        
        if not filtered_candidates:
            return {
                "response": f"I searched through all {len(unique_candidates)} distinct candidates in your database, but I couldn't find anyone matching your criteria. Try adjusting your search terms or ask about different skills."
            }
        
        # Format candidate data in compact format
        candidates_data = format_candidate_data_compact(filtered_candidates)
        
        # Create compact prompt
        prompt = create_chatbot_prompt(
            request.query,
            candidates_data,
            len(filtered_candidates),
            len(unique_candidates)
        )
        
        # Estimate token count
        estimated_tokens = len(prompt) // 4
        print(f"Estimated tokens: {estimated_tokens}")
        
        # If still too large, reduce further
        if estimated_tokens > 8000:
            filtered_candidates = filtered_candidates[:10]
            candidates_data = format_candidate_data_compact(filtered_candidates)
            prompt = create_chatbot_prompt(
                request.query,
                candidates_data,
                len(filtered_candidates),
                len(unique_candidates)
            )
        
        # Call Groq API
        response = await call_groq_api(prompt, temperature=0.7)
        
        # Extract response
        if "choices" in response and len(response["choices"]) > 0:
            ai_response = response["choices"][0]["message"]["content"]
            
            return {
                "response": ai_response,
                "candidates_searched": len(filtered_candidates),
                "total_distinct": len(unique_candidates),
                "total_in_database": len(all_candidates)
            }
        else:
            raise Exception("Invalid API response")
            
    except httpx.HTTPStatusError as e:
        error_text = e.response.text
        
        # Handle token limit errors gracefully with fallback
        if "rate_limit_exceeded" in error_text or "Request too large" in error_text:
            query_lower = request.query.lower()
            
            all_candidates = list(resume_history_collection.find(
                {"recruiter_email": current_user.email}
            ).sort("parsed_at", -1))
            
            # Apply deduplication
            for candidate in all_candidates:
                candidate["_id"] = str(candidate["_id"])
            
            unique_candidates = deduplicate_candidates(all_candidates)
            filtered = filter_candidates_by_query(unique_candidates, request.query)
            
            if not filtered:
                return {
                    "response": f"I don't have that information in the current candidate database. No candidates match your criteria."
                }
            
            # Format response manually
            response_text = f"I found {len(filtered)} distinct candidate(s) matching your criteria:\n\n"
            
            for idx, candidate in enumerate(filtered[:5], 1):
                parsed = candidate.get("parsed_data", {})
                name = parsed.get("name", "Unknown")
                email = parsed.get("email", "N/A")
                skills_list = (parsed.get("skills", []) + parsed.get("derived_skills", []))[:5]
                
                response_text += f"{idx}. {name}\n"
                response_text += f"   Email: {email}\n"
                if skills_list:
                    response_text += f"   Skills: {', '.join(skills_list)}\n"
                
                experiences = parsed.get("experience", [])
                if experiences:
                    exp = experiences[0]
                    response_text += f"   Latest: {exp.get('Role', 'N/A')} at {exp.get('Company', 'N/A')}\n"
                
                response_text += "\n"
            
            return {
                "response": response_text.strip(),
                "candidates_searched": len(filtered),
                "total_distinct": len(unique_candidates),
                "fallback_used": True
            }
        
        raise HTTPException(
            status_code=500,
            detail=f"Groq API error: {e.response.status_code} - {error_text}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process chatbot query: {str(e)}"
        )

@router.get("/chatbot/stats", dependencies=[Depends(require_recruiter)])
async def get_chatbot_stats(current_user: dict = Depends(get_current_active_user)):
    """
    Get statistics for the chatbot dashboard
    Returns stats for DISTINCT/UNIQUE candidates only
    """
    try:
        # Get all candidates
        all_candidates = list(resume_history_collection.find(
            {"recruiter_email": current_user.email}
        ))
        
        # Convert ObjectId to string
        for candidate in all_candidates:
            candidate["_id"] = str(candidate["_id"])
        
        # Apply deduplication
        unique_candidates = deduplicate_candidates(all_candidates)
        
        # Calculate unique skills from distinct candidates only
        all_skills = set()
        for candidate in unique_candidates:
            parsed = candidate.get("parsed_data", {})
            skills = parsed.get("skills", []) + parsed.get("derived_skills", [])
            all_skills.update(skills)
        
        return {
            "total_candidates": len(unique_candidates),
            "unique_skills": len(all_skills),
            "top_skills": list(all_skills)[:20] if all_skills else [],
            "total_in_database": len(all_candidates)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch stats: {str(e)}"
        )