from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import httpx
import json
import re
import traceback
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



class CandidateScore:
    """Class to hold candidate with calculated relevance score"""
    def __init__(self, candidate: Dict, score: float, score_breakdown: Dict):
        self.candidate = candidate
        self.score = score
        self.score_breakdown = score_breakdown



def deduplicate_candidates(candidates: List[Dict]) -> List[Dict]:
    """Deduplicate candidates using the same logic as candidates page"""
    unique_candidates = []
    seen_emails = set()
    seen_phones = set()
    seen_names = set()
    seen_ids = set()


    for candidate in candidates:
        parsed = candidate.get("parsed_data", {})
        candidate_id = candidate.get("_id")


        email = parsed.get("email")
        if email:
            email = str(email).strip().lower()
            if email == "no email" or email == "none" or email == "":
                email = None
        else:
            email = None


        phone = parsed.get("phone")
        if phone:
            phone = str(phone).replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            phone = re.sub(r'\D', '', phone)
            if len(phone) < 6:
                phone = None
        else:
            phone = None


        name = parsed.get("name")
        if name:
            name = str(name).strip().lower()
            if name == "unknown candidate" or name == "none" or name == "":
                name = None
        else:
            name = None


        is_duplicate = False


        if candidate_id in seen_ids:
            is_duplicate = True


        if not is_duplicate and email:
            if email in seen_emails:
                is_duplicate = True
            else:
                seen_emails.add(email)


        if not is_duplicate and phone:
            if phone in seen_phones:
                is_duplicate = True
            else:
                seen_phones.add(phone)


        if not is_duplicate and name:
            if name in seen_names:
                is_duplicate = True
            else:
                seen_names.add(name)


        if not is_duplicate:
            seen_ids.add(candidate_id)
            unique_candidates.append(candidate)


    return unique_candidates



def extract_query_intent(query: str) -> Dict[str, Any]:
    """
    Extract structured intent from user query
    Returns: {
        'skills': [...],
        'min_experience': int,
        'companies': [...],
        'education_level': str,
        'top_n': int,
        'query_type': 'ranking'|'filter'|'general'
    }
    """
    query_lower = query.lower()
    intent = {
        'skills': [],
        'min_experience': None,
        'companies': [],
        'education_level': None,
        'top_n': None,
        'query_type': 'general'
    }


    # Extract "top N" requests
    top_n_match = re.search(r'top\s+(\d+)', query_lower)
    if top_n_match:
        intent['top_n'] = int(top_n_match.group(1))
        intent['query_type'] = 'ranking'
    elif 'best' in query_lower or 'top' in query_lower:
        intent['top_n'] = 5  # Default to top 5 for "best" queries
        intent['query_type'] = 'ranking'


    # Extract skills
    common_skills = [
        'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node',
        'nodejs', 'django', 'flask', 'spring', 'dotnet', 'c++', 'c#',
        'ruby', 'php', 'go', 'rust', 'swift', 'kotlin', 'typescript',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'mongodb', 'sql',
        'postgresql', 'mysql', 'redis', 'machine learning', 'ml', 'ai',
        'data science', 'tensorflow', 'pytorch', 'react native', 'flutter',
        'html', 'css', 'express', 'fastapi', 'graphql', 'rest', 'api',
        'git', 'jenkins', 'ci/cd', 'linux', 'unix', 'bash', 'shell'
    ]
    
    for skill in common_skills:
        if skill in query_lower:
            intent['skills'].append(skill)


    # Extract experience requirements
    exp_match = re.search(r'(\d+)\+?\s*years?', query_lower)
    if exp_match:
        intent['min_experience'] = int(exp_match.group(1))


    # Extract company mentions
    companies = ['google', 'microsoft', 'amazon', 'facebook', 'meta', 'apple', 
                 'netflix', 'uber', 'airbnb', 'linkedin', 'twitter', 'tesla']
    for company in companies:
        if company in query_lower:
            intent['companies'].append(company)


    # Extract education level
    if any(term in query_lower for term in ['phd', 'doctorate', 'doctoral']):
        intent['education_level'] = 'phd'
    elif any(term in query_lower for term in ['masters', 'msc', 'm.sc', 'mtech', 'm.tech']):
        intent['education_level'] = 'masters'
    elif any(term in query_lower for term in ['bachelor', 'btech', 'b.tech', 'be', 'b.e']):
        intent['education_level'] = 'bachelors'


    return intent



def calculate_skill_proficiency_score(candidate: Dict, required_skills: List[str]) -> Dict[str, Any]:
    """
    Calculate skill proficiency based on:
    - Explicit skill mentions
    - Project usage
    - Experience usage
    - Recency and depth
    """
    parsed = candidate.get("parsed_data", {})
    if not parsed:
        return {
            'total_score': 0,
            'skill_breakdown': {},
            'skills_matched': 0,
            'total_skills_required': len(required_skills)
        }
    
    # Get all skills (explicit + derived)
    all_skills = []
    if parsed.get("skills"):
        all_skills.extend([s.lower() for s in parsed.get("skills", [])])
    if parsed.get("derived_skills"):
        all_skills.extend([s.lower() for s in parsed.get("derived_skills", [])])
    
    skill_scores = {}
    total_score = 0
    max_possible_score = len(required_skills) * 100 if required_skills else 100
    
    for req_skill in required_skills:
        skill_score = 0
        evidence = []
        
        # 1. Check if skill is explicitly listed (30 points)
        if any(req_skill in skill for skill in all_skills):
            skill_score += 30
            evidence.append("listed_in_skills")
        
        # 2. Check projects for skill usage (up to 40 points)
        projects = parsed.get("projects", [])
        project_matches = 0
        for project in projects:
            proj_text = json.dumps(project).lower()
            if req_skill in proj_text:
                project_matches += 1
                evidence.append(f"used_in_project: {project.get('Name', 'unnamed')[:30]}")
        
        # More projects = higher proficiency (max 40 points)
        if project_matches > 0:
            skill_score += min(40, project_matches * 10)
        
        # 3. Check experience for skill usage (up to 30 points)
        experiences = parsed.get("experience", [])
        exp_matches = 0
        for exp in experiences:
            exp_text = json.dumps(exp).lower()
            if req_skill in exp_text:
                exp_matches += 1
                evidence.append(f"used_at: {exp.get('Company', 'company')[:20]}")
        
        if exp_matches > 0:
            skill_score += min(30, exp_matches * 10)
        
        skill_scores[req_skill] = {
            'score': skill_score,
            'evidence': evidence[:3]
        }
        total_score += skill_score
    
    # Normalize to 0-100 scale
    normalized_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
    
    return {
        'total_score': min(100, normalized_score),
        'skill_breakdown': skill_scores,
        'skills_matched': sum(1 for s in skill_scores.values() if s['score'] > 0),
        'total_skills_required': len(required_skills)
    }



def parse_experience_years(years_str: str) -> float:
    """
    Safely parse years from experience string
    Handles cases like: "3 months", "2 years", "2019-2021", "1.5 years"
    """
    if not years_str:
        return 0.0
    
    years_str = str(years_str).lower().strip()
    
    # Check for months
    if 'month' in years_str:
        numbers = re.findall(r'(\d+\.?\d*)', years_str)
        if numbers:
            try:
                months = float(numbers[0])
                return months / 12.0  # Convert months to years
            except (ValueError, IndexError):
                pass
    
    # Check for years
    elif 'year' in years_str:
        numbers = re.findall(r'(\d+\.?\d*)', years_str)
        if numbers:
            try:
                return float(numbers[0])
            except (ValueError, IndexError):
                pass
    
    # Check for date ranges like "2019-2021"
    elif re.search(r'\d{4}\s*[-–]\s*\d{4}', years_str):
        numbers = re.findall(r'\d{4}', years_str)
        if len(numbers) >= 2:
            try:
                start_year = int(numbers[0])
                end_year = int(numbers[1])
                years = end_year - start_year
                return max(0, min(years, 20))  # Cap at 20 years for date ranges
            except (ValueError, IndexError):
                pass
    
    # Default: look for any number (but be conservative)
    numbers = re.findall(r'(\d+\.?\d*)', years_str)
    if numbers:
        try:
            # Take the smallest number found (most conservative)
            valid_numbers = [float(n) for n in numbers if float(n) < 50]
            if valid_numbers:
                num = min(valid_numbers)
                # If it's a large number (>10), it's probably a year, not years of experience
                if num > 10 and num < 3000:  # Looks like a year (e.g., 2020)
                    return 0.0
                return min(num, 20)  # Cap at 20 years
        except (ValueError, IndexError):
            pass
    
    return 0.0



def format_experience_years(years: float) -> str:
    """
    Format experience years for display
    Shows decimal places for less than 1 year, otherwise whole numbers
    """
    if years < 0.1:
        return "New Graduate / Intern"
    
    # If less than 1 year, convert to months
    if years < 1.0:
        months = round(years * 12)
        return f"{months} months"
    
    # For 1+ years, check if there's a significant fractional part (more than 1 month)
    fractional_year = years - int(years)
    if fractional_year > 0.08: # More than roughly 1 month
        return f"{years:.1f} years"
    
    return f"{int(years)} years"



def calculate_experience_score(candidate: Dict, min_experience: Optional[int] = None) -> Dict[str, Any]:
    """
    Calculate experience quality score based on:
    - Total years of experience
    - Number of companies
    - Role seniority
    - Company reputation
    """
    parsed = candidate.get("parsed_data", {})
    experiences = parsed.get("experience", []) if parsed else []
    
    if not experiences:
        return {
            'score': 0, 
            'total_years': 0, 
            'total_years_display': '0 years',
            'details': 'no_experience',
            'company_count': 0,
            'senior_roles': 0,
            'meets_requirement': True if min_experience is None else False,
            'max_years_single_role': 0,
            'max_years_single_role_display': '0 years'
        }
    
    total_years = 0.0
    max_years_single_role = 0.0
    company_count = len(experiences)
    senior_roles = 0
    
    # Keywords for senior roles
    senior_keywords = ['senior', 'lead', 'principal', 'architect', 'manager', 'director', 'head', 'chief']
    
    for exp in experiences:
        # Extract years using safe parser
        years_str = exp.get("Years", "")
        years = parse_experience_years(years_str)
        
        # Cap at reasonable maximum per role (10 years)
        if years > 10:
            years = 10
        
        total_years += years
        if years > max_years_single_role:
            max_years_single_role = years
        
        # Check role seniority
        role = exp.get("Role", "")
        if role:
            role_lower = role.lower()
            if any(keyword in role_lower for keyword in senior_keywords):
                senior_roles += 1
    
    # Debug output
    print(f"Experience parsing - Total years: {total_years:.2f}, Max per role: {max_years_single_role:.2f}")
    
    # Format for display
    total_years_display = format_experience_years(total_years)
    max_years_display = format_experience_years(max_years_single_role)
    
    # Cap total years at 30 for scoring purposes
    capped_years = min(total_years, 30)
    
    # Calculate score - MORE CONSERVATIVE SCORING
    score = 0
    
    # Years of experience (max 40 points)
    if capped_years >= 1:
        score += min(40, capped_years * 5) # 5 points per year
    else:
        # Give points for months (0.1 to 0.9 years)
        score += min(5, capped_years * 6)
    
    # Number of companies (max 15 points)
    if company_count >= 4 and company_count <= 6:
        score += 15  # Good diversity
    elif company_count == 3:
        score += 12
    elif company_count == 2:
        score += 8
    elif company_count == 1:
        score += 4
    else:  # More than 6 companies might indicate job hopping
        score += 5
    
    # Senior roles (max 20 points)
    score += min(20, senior_roles * 8)
    
    # Check if meets minimum experience requirement
    meets_requirement = True
    if min_experience is not None:
        if total_years < min_experience:
            meets_requirement = False
            score *= 0.7
    
    # Cap final score at 75 for experience alone
    final_score = min(75, score)
    
    return {
        'score': final_score,
        'total_years': total_years,
        'total_years_display': total_years_display,
        'company_count': company_count,
        'senior_roles': senior_roles,
        'meets_requirement': meets_requirement,
        'max_years_single_role': max_years_single_role,
        'max_years_single_role_display': max_years_display
    }



def calculate_education_score(candidate: Dict, required_level: Optional[str] = None) -> Dict[str, Any]:
    """
    Calculate education score
    """
    parsed = candidate.get("parsed_data", {})
    education = parsed.get("education", []) if parsed else []
    
    if not education:
        return {
            'score': 0, 
            'highest_degree': None, 
            'meets_requirement': True if required_level is None else False
        }
    
    # Determine highest degree
    degree_hierarchy = {
        'phd': 100,
        'doctorate': 100,
        'doctoral': 100,
        'masters': 75,
        'msc': 75,
        'm.sc': 75,
        'mtech': 75,
        'm.tech': 75,
        'mba': 75,
        'bachelor': 50,
        'btech': 50,
        'b.tech': 50,
        'be': 50,
        'b.e': 50,
        'bsc': 50,
        'diploma': 25
    }
    
    highest_score = 0
    highest_degree = None
    
    for edu in education:
        degree = edu.get("Degree", "")
        if degree:
            degree_lower = degree.lower()
            for key, value in degree_hierarchy.items():
                if key in degree_lower:
                    if value > highest_score:
                        highest_score = value
                        highest_degree = key
                    break
    
    # Check if meets requirement
    meets_requirement = True
    if required_level is not None:
        required_score = degree_hierarchy.get(required_level, 0)
        if highest_score < required_score:
            meets_requirement = False
            highest_score *= 0.7
    
    return {
        'score': highest_score,
        'highest_degree': highest_degree,
        'meets_requirement': meets_requirement
    }



def calculate_project_quality_score(candidate: Dict, required_skills: List[str]) -> Dict[str, Any]:
    """
    Calculate project quality based on relevance and complexity
    """
    parsed = candidate.get("parsed_data", {})
    projects = parsed.get("projects", []) if parsed else []
    
    if not projects:
        return {
            'score': 0, 
            'project_count': 0, 
            'relevant_projects': 0
        }
    
    relevant_projects = 0
    total_score = 0
    
    for project in projects:
        project_text = json.dumps(project).lower()
        project_score = 0
        
        # Check if project uses required skills
        skills_used = 0
        if required_skills:
            skills_used = sum(1 for skill in required_skills if skill in project_text)
        if skills_used > 0:
            relevant_projects += 1
            project_score = min(80, skills_used * 20)
        
        # Check project description length (complexity indicator)
        description = project.get("Description", "")
        if len(description) > 200:
            project_score += 15
        elif len(description) > 100:
            project_score += 10
        elif len(description) > 50:
            project_score += 5
        
        total_score += project_score
    
    # Average project score
    avg_score = total_score / len(projects) if projects else 0
    
    return {
        'score': min(100, avg_score),
        'project_count': len(projects),
        'relevant_projects': relevant_projects
    }



def rank_candidates(candidates: List[Dict], intent: Dict[str, Any]) -> List[CandidateScore]:
    """
    Rank candidates based on query intent using weighted scoring
    """
    scored_candidates = []
    
    for candidate in candidates:
        try:
            # Calculate individual scores
            skill_analysis = calculate_skill_proficiency_score(candidate, intent.get('skills', [])) 
            experience_analysis = calculate_experience_score(candidate, intent.get('min_experience'))
            education_analysis = calculate_education_score(candidate, intent.get('education_level'))
            project_analysis = calculate_project_quality_score(candidate, intent.get('skills', []))
            
            # Weight the scores based on query type
            if intent.get('query_type') == 'ranking' and intent.get('skills'):
                # Skill-based queries: prioritize skills and projects
                weights = {
                    'skills': 0.45,
                    'projects': 0.30,
                    'experience': 0.15,
                    'education': 0.10
                }
            else:
                # General queries: balanced approach
                weights = {
                    'skills': 0.35,
                    'experience': 0.25,
                    'projects': 0.25,
                    'education': 0.15
                }
            
            # Calculate weighted total score
            total_score = (
                skill_analysis['total_score'] * weights['skills'] +
                experience_analysis['score'] * weights['experience'] +
                education_analysis['score'] * weights['education'] +
                project_analysis['score'] * weights['projects']
            )
            
            # Penalize if doesn't meet hard requirements
            if intent.get('min_experience') is not None and not experience_analysis['meets_requirement']:
                total_score *= 0.7
            
            if intent.get('education_level') is not None and not education_analysis['meets_requirement']:
                total_score *= 0.8
            
            # Create score breakdown for transparency
            score_breakdown = {
                'skill_score': round(skill_analysis['total_score'], 1),
                'skill_details': skill_analysis,
                'experience_score': round(experience_analysis['score'], 1),
                'experience_details': experience_analysis,
                'education_score': round(education_analysis['score'], 1),
                'project_score': round(project_analysis['score'], 1),
                'weights_used': weights
            }
            
            scored_candidates.append(CandidateScore(candidate, total_score, score_breakdown))
        except Exception as e:
            print(f"Error scoring candidate: {e}")
            # Give minimum score to problematic candidates
            scored_candidates.append(CandidateScore(candidate, 0, {
                'skill_score': 0,
                'skill_details': {'total_score': 0},
                'experience_score': 0,
                'experience_details': {'score': 0},
                'education_score': 0,
                'project_score': 0,
                'weights_used': {}
            }))
    
    # Sort by score (highest first)
    scored_candidates.sort(key=lambda x: x.score, reverse=True)
    
    return scored_candidates



def format_ranked_candidates(ranked_candidates: List[CandidateScore], top_n: Optional[int] = None) -> str:
    """
    Format ranked candidates for LLM with scoring details
    """
    if top_n:
        ranked_candidates = ranked_candidates[:top_n]
    
    formatted = []
    
    for idx, scored_candidate in enumerate(ranked_candidates, 1):
        candidate = scored_candidate.candidate
        parsed = candidate.get("parsed_data", {})
        
        candidate_info = {
            "rank": idx,
            "overall_score": round(scored_candidate.score, 1),
            "name": parsed.get("name", "Unknown") if parsed else "Unknown",
            "email": parsed.get("email", "N/A") if parsed else "N/A",
            "skills": (parsed.get("skills", []) + parsed.get("derived_skills", []))[:8] if parsed else [],
            "score_breakdown": {
                "skill_proficiency": scored_candidate.score_breakdown.get('skill_score', 0),
                "experience_quality": scored_candidate.score_breakdown.get('experience_score', 0),
                "project_relevance": scored_candidate.score_breakdown.get('project_score', 0),
                "education": scored_candidate.score_breakdown.get('education_score', 0)
            }
        }
        
        # Add experience with proper formatting
        experiences = parsed.get("experience", []) if parsed else []
        if experiences:
            exp_details = scored_candidate.score_breakdown.get('experience_details', {})
            # Use the display version with proper decimal formatting
            total_years_display = exp_details.get('total_years_display', '0 years')
            candidate_info["experience_summary"] = {
                "total_years": total_years_display,  # Use formatted string
                "latest_role": experiences[0].get("Role", "N/A"),
                "latest_company": experiences[0].get("Company", "N/A")
            }
        
        # Add relevant projects
        skill_details = scored_candidate.score_breakdown.get('skill_details', {})
        if skill_details.get('skill_breakdown'):
            skills_with_evidence = []
            for skill, details in skill_details['skill_breakdown'].items():
                if details.get('score', 0) > 0:
                    skills_with_evidence.append({
                        "skill": skill,
                        "proficiency_score": round(details.get('score', 0), 1),
                        "evidence": details.get('evidence', [])[:2]
                    })
            if skills_with_evidence:
                candidate_info["skill_evidence"] = skills_with_evidence
        
        formatted.append(candidate_info)
    
    return json.dumps(formatted, indent=2)



def create_enhanced_prompt(query: str, ranked_data: str, intent: Dict, total_shown: int, total_unique: int) -> str:
    """
    Create enhanced prompt with ranking information
    """
    ranking_note = ""
    if intent.get('query_type') == 'ranking':
        ranking_note = f"""
IMPORTANT: These candidates are RANKED by overall fit score (0-100) based on:
- Skill Proficiency: How well they demonstrate the required skills
- Experience Quality: Years, seniority, and company diversity
- Project Relevance: Projects using the required technologies
- Education Level: Highest degree attained

The ranking considers ALL aspects of their profile, not just presence of skills.
"""
    
    # Updated prompt with specific instructions about experience formatting
    prompt = f"""You are an AI recruiter assistant with advanced candidate ranking capabilities.

{ranking_note}

RANKED CANDIDATES (Top {total_shown} of {total_unique} distinct candidates):
{ranked_data}

ORIGINAL QUERY: "{query}"

IMPORTANT FORMATTING RULES:
1. DO NOT use markdown formatting like **bold**, *italic*, or # headers
2. DO NOT use asterisks or special characters for emphasis
3. Use plain text with clear numbering and bullet points
4. For experience: Use the exact "total_years" value provided in the data
5. Format like this example:

1. John Doe (Overall Score: 87.5/100)
   - Email: john@email.com
   - Key Strengths: 
     * Skill Proficiency: 90.2/100 (Python used in 3 projects)
     * Experience: 6 years including Senior Developer at Google
     * Projects: Built e-commerce platform using React & Node.js
   - Top Skills: Python, React, AWS, Node.js
   - Total Experience: 6 years

2. Jane Smith (Overall Score: 82.3/100)
   - Email: jane@email.com
   - Key Strengths:
     * Project Relevance: 85/100 (2 ML projects with TensorFlow)
     * Experience: 4 years at Microsoft
   - Top Skills: Python, Machine Learning, TensorFlow, SQL

3. Recent Graduate Example (Overall Score: 65.8/100)
   - Email: recent@email.com
   - Key Strengths:
     * Skill Proficiency: 75/100 (Strong academic projects in Python)
     * Education: Bachelor's in Computer Science
   - Top Skills: Python, Java, SQL, HTML/CSS
   - Total Experience: 0.3 years (approximately 4 months)

SPECIAL INSTRUCTIONS FOR EXPERIENCE:
- If "total_years" is less than 1 (e.g., "0.3 years"), show it exactly as provided
- For fractional years, mention approximate months in parentheses
- Example: "0.3 years (approximately 4 months)"
- DO NOT round fractional experience to "0 years"

INSTRUCTIONS:
1. Present candidates in EXACT RANKED ORDER provided (by overall_score)
2. For each candidate, explain WHY they are ranked at their position using score_breakdown
3. Highlight specific evidence from skill_evidence (projects, experience)
4. Mention overall_score and key metrics (use exact "total_years" value from data)
5. Keep explanations concise and data-driven
6. Use the format shown above - plain text with numbers and bullet points

Now, provide the ranked candidates for the query: "{query}"
"""
    
    return prompt



async def call_groq_api(prompt: str, temperature: float = 0.7):
    """Call Groq API"""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }


    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": 2000
    }


    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()



@router.post("/chatbot", dependencies=[Depends(require_recruiter)])
async def chatbot_query(
    request: ChatRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Enhanced chatbot with intelligent ranking system
    """
    try:
        print(f"Received query: {request.query}")
        
        # Fetch all candidates
        all_candidates = list(resume_history_collection.find(
            {"recruiter_email": current_user.email}
        ).sort("parsed_at", -1))
        
        if not all_candidates:
            return {
                "response": "You don't have any candidates in your database yet. Please upload some resumes first.",
                "candidates_analyzed": 0,
                "candidates_shown": 0,
                "ranking_applied": False,
                "intent_detected": {}
            }
        
        # Convert ObjectId and deduplicate
        for candidate in all_candidates:
            candidate["_id"] = str(candidate["_id"])
        
        unique_candidates = deduplicate_candidates(all_candidates)
        
        if not unique_candidates:
            return {
                "response": "No distinct candidates found in your database.",
                "candidates_analyzed": 0,
                "candidates_shown": 0,
                "ranking_applied": False,
                "intent_detected": {}
            }
        
        print(f"Total candidates: {len(all_candidates)}, Unique: {len(unique_candidates)}")
        
        # Extract query intent
        intent = extract_query_intent(request.query)
        print(f"Query intent: {intent}")
        
        # Rank candidates based on intent
        ranked_candidates = rank_candidates(unique_candidates, intent)
        
        # Debug: Print first few candidates' experience details
        print(f"\n--- Experience Debug Info ---")
        for i, scored_candidate in enumerate(ranked_candidates[:3]):
            exp_details = scored_candidate.score_breakdown.get('experience_details', {})
            total_years = exp_details.get('total_years', 0)
            total_years_display = exp_details.get('total_years_display', '0 years')
            print(f"Candidate {i+1}: total_years={total_years:.2f}, "
                  f"display='{total_years_display}', "
                  f"experience_score={exp_details.get('score', 0)}")
        print("--- End Debug ---\n")
        
        # Determine how many to show
        top_n = intent.get('top_n', 5)  # Default to top 5 for ranking queries
        
        # Filter out candidates with very low scores
        if len(ranked_candidates) > top_n:
            ranked_candidates = [c for c in ranked_candidates if c.score > 20][:top_n]
        
        if not ranked_candidates:
            return {
                "response": f"I analyzed {len(unique_candidates)} candidates, but none matched your criteria for '{request.query}'. Try broadening your search criteria.",
                "candidates_analyzed": len(unique_candidates),
                "candidates_shown": 0,
                "ranking_applied": True,
                "intent_detected": intent
            }
        
        # Format for LLM
        ranked_data = format_ranked_candidates(ranked_candidates, top_n)
        
        # Create enhanced prompt
        prompt = create_enhanced_prompt(
            request.query,
            ranked_data,
            intent,
            min(top_n, len(ranked_candidates)),
            len(unique_candidates)
        )
        
        print(f"Sending top {min(top_n, len(ranked_candidates))} ranked candidates to LLM")
        
        # Call Groq API
        response = await call_groq_api(prompt, temperature=0.7)
        
        if "choices" in response and len(response["choices"]) > 0:
            ai_response = response["choices"][0]["message"]["content"]
            
            # Clean up response - remove markdown formatting
            ai_response = re.sub(r'\*\*(.*?)\*\*', r'\1', ai_response)
            ai_response = re.sub(r'\*(.*?)\*', r'\1', ai_response)
            ai_response = re.sub(r'#+\s*', '', ai_response)
            
            return {
                "response": ai_response,
                "candidates_analyzed": len(unique_candidates),
                "candidates_shown": min(top_n, len(ranked_candidates)),
                "ranking_applied": True,
                "intent_detected": intent
            }
        else:
            raise Exception("Invalid API response")
            
    except Exception as e:
        print(f"Error in chatbot: {str(e)}")
        print(traceback.format_exc())
        
        # Return a more informative error
        return {
            "response": f"I apologize, but I encountered an error while processing your query. Please try a different question or check if you have candidates in your database.",
            "candidates_analyzed": 0,
            "candidates_shown": 0,
            "ranking_applied": False,
            "intent_detected": {}
        }



@router.get("/chatbot/stats", dependencies=[Depends(require_recruiter)])
async def get_chatbot_stats(current_user: dict = Depends(get_current_active_user)):
    """Get chatbot statistics"""
    try:
        all_candidates = list(resume_history_collection.find(
            {"recruiter_email": current_user.email}
        ))
        
        for candidate in all_candidates:
            candidate["_id"] = str(candidate["_id"])
        
        unique_candidates = deduplicate_candidates(all_candidates)
        
        all_skills = set()
        for candidate in unique_candidates:
            parsed = candidate.get("parsed_data", {})
            if parsed:
                skills = parsed.get("skills", []) + parsed.get("derived_skills", [])
                all_skills.update([s.lower() for s in skills if s])
        
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