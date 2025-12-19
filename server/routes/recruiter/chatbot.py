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
        'query_type': 'ranking'|'filter'|'general',
        'company_filter': bool
    }
    """
    query_lower = query.lower()
    intent = {
        'skills': [],
        'min_experience': None,
        'companies': [],
        'education_level': None,
        'top_n': None,
        'query_type': 'general',
        'company_filter': False
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
    
    # Handle generic role-based queries (web developer, full stack, etc.)
    role_skill_mapping = {
        'web developer': ['javascript', 'html', 'css', 'react', 'node', 'nodejs'],
        'web development': ['javascript', 'html', 'css', 'react', 'node', 'nodejs'],
        'full stack': ['javascript', 'react', 'node', 'nodejs', 'python', 'sql'],
        'frontend': ['javascript', 'react', 'html', 'css', 'typescript'],
        'backend': ['python', 'java', 'nodejs', 'sql', 'api'],
        'mobile developer': ['react native', 'flutter', 'swift', 'kotlin'],
        'data scientist': ['python', 'machine learning', 'tensorflow', 'sql'],
        'devops': ['docker', 'kubernetes', 'aws', 'jenkins', 'linux'],
        'ml engineer': ['python', 'machine learning', 'tensorflow', 'pytorch']
    }
    
    # Check if query matches any generic role
    for role, skills in role_skill_mapping.items():
        if role in query_lower:
            # Add these skills if not already present
            for skill in skills:
                if skill not in intent['skills']:
                    intent['skills'].append(skill)
            # Mark as ranking query if not already
            if intent['query_type'] == 'general':
                intent['query_type'] = 'ranking'
            break


    # Extract experience requirements
    exp_match = re.search(r'(\d+)\+?\s*years?', query_lower)
    if exp_match:
        intent['min_experience'] = int(exp_match.group(1))


    # Detect company filter queries
    company_keywords = ['company', 'companies', 'intern', 'internship', 'full-time', 'full time', 
                       'position', 'worked at', 'experience at', 'employed']
    if any(keyword in query_lower for keyword in company_keywords):
        intent['company_filter'] = True
        intent['query_type'] = 'ranking'
        if not intent['top_n']:
            intent['top_n'] = 10  # Show more for company queries


    # Extract specific company mentions
    companies = ['google', 'microsoft', 'amazon', 'facebook', 'meta', 'apple', 
                 'netflix', 'uber', 'airbnb', 'linkedin', 'twitter', 'tesla',
                 'ibm', 'oracle', 'salesforce', 'adobe', 'intel', 'nvidia',
                 'samsung', 'dell', 'cisco', 'vmware', 'sap', 'accenture',
                 'deloitte', 'wipro', 'tcs', 'infosys', 'cognizant', 'hcl']
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
    
    # If candidate has SOME relevant skills (even if not all), give them credit
    # This helps with generic queries like "web developer"
    skills_matched = sum(1 for s in skill_scores.values() if s['score'] > 0)
    if skills_matched > 0 and len(required_skills) > 3:
        # For queries with many skills (like "web developer" = 6 skills)
        # Having 50%+ of skills should give decent score
        match_ratio = skills_matched / len(required_skills)
        if match_ratio >= 0.5:  # Has at least half the skills
            # Boost the score proportionally
            normalized_score = max(normalized_score, 50 * match_ratio)
    
    return {
        'total_score': min(100, normalized_score),
        'skill_breakdown': skill_scores,
        'skills_matched': skills_matched,
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
        'masters': 70,
        'msc': 70,
        'm.sc': 70,
        'mtech': 75,
        'm.tech': 75,
        'mba': 75,
        'bachelor': 50,
        'btech': 70,
        'b.tech': 70,
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



def calculate_company_score(candidate: Dict, intent: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate company quality score based on:
    - Working at top companies
    - Full-time positions vs internships
    - Company reputation
    """
    parsed = candidate.get("parsed_data", {})
    experiences = parsed.get("experience", []) if parsed else []
    
    if not experiences:
        return {
            'score': 0,
            'top_companies': [],
            'has_fulltime': False,
            'has_internship': False,
            'company_count': 0
        }
    
    # Expanded list of top companies
    top_companies = [
        'google', 'microsoft', 'amazon', 'facebook', 'meta', 'apple', 
        'netflix', 'uber', 'airbnb', 'linkedin', 'twitter', 'tesla',
        'ibm', 'oracle', 'salesforce', 'adobe', 'intel', 'nvidia',
        'samsung', 'dell', 'cisco', 'vmware', 'sap', 'accenture',
        'deloitte', 'wipro', 'tcs', 'infosys', 'cognizant', 'hcl',
        'goldman sachs', 'morgan stanley', 'jp morgan', 'mckinsey',
        'bain', 'bcg', 'stripe', 'spotify', 'slack', 'atlassian'
    ]
    
    found_top_companies = []
    has_fulltime = False
    has_internship = False
    score = 0
    
    for exp in experiences:
        company = exp.get("Company", "")
        role = exp.get("Role", "")
        
        if company:
            company_lower = company.lower()
            # Check if any top company name is in the company field
            for top_co in top_companies:
                if top_co in company_lower:
                    found_top_companies.append(company)
                    score += 25  # 25 points per top company
                    break
        
        if role:
            role_lower = role.lower()
            # Check for full-time indicators
            if any(term in role_lower for term in ['full-time', 'full time', 'engineer', 'developer', 
                                                     'manager', 'lead', 'senior', 'architect']):
                has_fulltime = True
            
            # Check for internship
            if 'intern' in role_lower:
                has_internship = True
    
    # Bonus for having both internship and full-time
    if has_fulltime and has_internship:
        score += 20
    elif has_fulltime:
        score += 15
    elif has_internship:
        score += 10
    
    # Cap score at 100
    score = min(100, score)
    
    return {
        'score': score,
        'top_companies': found_top_companies,
        'has_fulltime': has_fulltime,
        'has_internship': has_internship,
        'company_count': len(found_top_companies)
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
            company_analysis = calculate_company_score(candidate, intent)
            
            # Weight the scores based on query type
            if intent.get('company_filter'):
                # Company-focused queries: prioritize company experience
                weights = {
                    'company': 0.50,
                    'experience': 0.25,
                    'skills': 0.15,
                    'projects': 0.05,
                    'education': 0.05
                }
            elif intent.get('query_type') == 'ranking' and intent.get('skills'):
                # Skill-based queries: prioritize skills and projects
                weights = {
                    'skills': 0.45,
                    'projects': 0.30,
                    'experience': 0.15,
                    'education': 0.05,
                    'company': 0.05
                }
            else:
                # General queries: balanced approach
                weights = {
                    'skills': 0.30,
                    'experience': 0.25,
                    'projects': 0.20,
                    'company': 0.15,
                    'education': 0.10
                }
            
            # Calculate weighted total score
            total_score = (
                skill_analysis['total_score'] * weights['skills'] +
                experience_analysis['score'] * weights['experience'] +
                education_analysis['score'] * weights['education'] +
                project_analysis['score'] * weights['projects'] +
                company_analysis['score'] * weights.get('company', 0)
            )
            
            # Penalize if doesn't meet hard requirements
            if intent.get('min_experience') is not None and not experience_analysis['meets_requirement']:
                total_score *= 0.7
            
            if intent.get('education_level') is not None and not education_analysis['meets_requirement']:
                total_score *= 0.8
            
            # For company filter queries, heavily penalize candidates without top company experience
            if intent.get('company_filter') and company_analysis['company_count'] == 0:
                total_score *= 0.3
            
            # Create score breakdown for transparency
            score_breakdown = {
                'skill_score': round(skill_analysis['total_score'], 1),
                'skill_details': skill_analysis,
                'experience_score': round(experience_analysis['score'], 1),
                'experience_details': experience_analysis,
                'education_score': round(education_analysis['score'], 1),
                'project_score': round(project_analysis['score'], 1),
                'company_score': round(company_analysis['score'], 1),
                'company_details': company_analysis,
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
                'company_score': 0,
                'company_details': {'score': 0},
                'weights_used': {}
            }))
    
    # Sort by score (highest first)
    scored_candidates.sort(key=lambda x: x.score, reverse=True)
    
    return scored_candidates



def format_ranked_candidates(ranked_candidates: List[CandidateScore], top_n: Optional[int] = None) -> str:
    """
    Format ranked candidates for LLM WITHOUT exposing scores
    Only include meaningful information for natural conversation
    """
    if top_n:
        ranked_candidates = ranked_candidates[:top_n]
    
    formatted = []
    
    for idx, scored_candidate in enumerate(ranked_candidates, 1):
        candidate = scored_candidate.candidate
        parsed = candidate.get("parsed_data", {})
        
        candidate_info = {
            "rank": idx,  # Keep rank but hide score
            "name": parsed.get("name", "Unknown") if parsed else "Unknown",
            "email": parsed.get("email", "N/A") if parsed else "N/A",
            "skills": (parsed.get("skills", []) + parsed.get("derived_skills", []))[:10] if parsed else [],
        }
        
        # Add experience details
        experiences = parsed.get("experience", []) if parsed else []
        if experiences:
            exp_details = scored_candidate.score_breakdown.get('experience_details', {})
            company_details = scored_candidate.score_breakdown.get('company_details', {})
            
            total_years_display = exp_details.get('total_years_display', '0 years')
            candidate_info["experience"] = {
                "total_years": total_years_display,
                "roles": [
                    {
                        "role": exp.get("Role", "N/A"),
                        "company": exp.get("Company", "N/A"),
                        "duration": exp.get("Years", "N/A")
                    }
                    for exp in experiences[:3]  # Show top 3 roles
                ],
                "notable_companies": company_details.get('top_companies', []),
                "has_fulltime": company_details.get('has_fulltime', False),
                "has_internship": company_details.get('has_internship', False)
            }
        
        # Add education
        education = parsed.get("education", []) if parsed else []
        if education:
            candidate_info["education"] = [
                {
                    "degree": edu.get("Degree", "N/A"),
                    "institution": edu.get("Institution", "N/A"),
                    "year": edu.get("Year", "N/A")
                }
                for edu in education[:2]  # Show top 2
            ]
        
        # Add relevant projects (without scores)
        projects = parsed.get("projects", []) if parsed else []
        if projects:
            candidate_info["projects"] = [
                {
                    "name": proj.get("Name", "Unnamed Project"),
                    "description": proj.get("Description", "")[:150] + "..." if len(proj.get("Description", "")) > 150 else proj.get("Description", "")
                }
                for proj in projects[:3]  # Show top 3 projects
            ]
        
        # Add skill evidence WITHOUT scores - just which skills were demonstrated
        skill_details = scored_candidate.score_breakdown.get('skill_details', {})
        if skill_details.get('skill_breakdown'):
            demonstrated_skills = []
            for skill, details in skill_details['skill_breakdown'].items():
                if details.get('score', 0) > 0:
                    evidence = details.get('evidence', [])
                    if evidence:
                        demonstrated_skills.append({
                            "skill": skill,
                            "evidence": evidence[:2]  # Show where skill was used
                        })
            if demonstrated_skills:
                candidate_info["skill_evidence"] = demonstrated_skills
        
        formatted.append(candidate_info)
    
    return json.dumps(formatted, indent=2)


def create_enhanced_prompt(query: str, ranked_data: str, intent: Dict, total_shown: int, total_unique: int) -> str:
    """
    Create enhanced prompt that lets AI determine its own format
    WITHOUT exposing internal scoring
    """
    ranking_context = ""
    if intent.get('query_type') == 'ranking':
        if intent.get('company_filter'):
            ranking_context = """
These candidates are ranked based on their company experience, role progression, and overall career quality.
Pay special attention to candidates who have worked at notable companies or held significant positions.
"""
        else:
            ranking_context = """
These candidates are ranked based on their overall fit for the query, considering:
- Relevant skills and how they've been applied
- Professional experience and career progression
- Project work and practical demonstrations
- Educational background
- Company experience and reputation
"""
    
    prompt = f"""You are an experienced technical recruiter helping to find the best candidates.

{ranking_context}

CANDIDATE DATA (Top {total_shown} of {total_unique} candidates):
{ranked_data}

USER QUERY: "{query}"

INSTRUCTIONS:
1. Answer the user's query naturally and conversationally
2. DO NOT reveal any numerical scores, rankings, or internal metrics
3. DO NOT use rigid formatting templates - adapt your response style to the question
4. Determine the best way to present information based on what the user is asking
5. Focus on qualitative insights about candidates rather than quantitative scores
6. Use natural language to describe why certain candidates stand out
7. If showing multiple candidates, present them in the order provided but don't mention "rank 1", "rank 2" etc.
8. Be concise unless the user asks for detailed information

IMPORTANT - Response Style Guidelines:
- For "who" questions: Present candidates with brief highlights
- For "tell me about" questions: Provide detailed insights
- For "how many" questions: Give counts and summaries
- For "best/top" questions: Explain what makes candidates strong without numbers
- For comparison questions: Compare qualitatively, not with scores
- For specific skill questions: Focus on evidence and experience

WHAT NOT TO DO:
- Don't use phrases like "Overall Score: 87.5/100"
- Don't say "Skill Proficiency: 90.2/100"
- Don't mention "ranked by score" or "ranking system"
- Don't use bullet-point templates unless it truly fits the query
- Don't reveal that candidates are numerically scored

Examples of good responses:

Query: "Who are the best Python developers?"
Good: "I found several strong Python developers. Sarah Johnson has extensive Python experience across multiple projects including a machine learning platform at Google. She's also used Python in her work at Microsoft. John Smith has demonstrated Python skills through several full-stack applications and has 5 years of backend development experience."

Query: "Tell me about candidates with AWS experience"
Good: "I found 3 candidates with notable AWS experience. Maria Garcia has been working with AWS for the past 3 years in her role as a Cloud Engineer at Amazon, where she architected several microservices solutions. Tom Wilson has AWS certifications and has deployed production applications on AWS infrastructure..."

Query: "Do we have any candidates from Google?"
Good: "Yes, we have 2 candidates with Google experience. Sarah Johnson worked as a Software Engineer at Google for 2 years, focusing on backend infrastructure. Additionally, Alex Chen completed a software engineering internship at Google last summer."

Now respond to: "{query}"
"""
    
    return prompt


@router.post("/chatbot", dependencies=[Depends(require_recruiter)])
async def chatbot_query(
    request: ChatRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Enhanced chatbot with intelligent ranking system
    AI determines response format naturally
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
                "candidates_shown": 0
            }
        
        # Convert ObjectId and deduplicate
        for candidate in all_candidates:
            candidate["_id"] = str(candidate["_id"])
        
        unique_candidates = deduplicate_candidates(all_candidates)
        
        if not unique_candidates:
            return {
                "response": "No distinct candidates found in your database.",
                "candidates_analyzed": 0,
                "candidates_shown": 0
            }
        
        print(f"Total candidates: {len(all_candidates)}, Unique: {len(unique_candidates)}")
        
        # Extract query intent
        intent = extract_query_intent(request.query)
        print(f"Query intent: {intent}")
        
        # Rank candidates based on intent
        ranked_candidates = rank_candidates(unique_candidates, intent)
        
        # Determine how many to show
        top_n = intent.get('top_n', 5)
        
        # Filter out candidates with very low scores (internal only)
        if len(ranked_candidates) > top_n:
            ranked_candidates = [c for c in ranked_candidates if c.score > 10][:top_n]
        
        if not ranked_candidates:
            return {
                "response": f"I analyzed {len(unique_candidates)} candidates, but none matched your criteria for '{request.query}'. Try broadening your search criteria.",
                "candidates_analyzed": len(unique_candidates),
                "candidates_shown": 0
            }
        
        # Format for LLM WITHOUT scores
        ranked_data = format_ranked_candidates(ranked_candidates, top_n)
        
        # Create enhanced prompt that encourages natural formatting
        prompt = create_enhanced_prompt(
            request.query,
            ranked_data,
            intent,
            min(top_n, len(ranked_candidates)),
            len(unique_candidates)
        )
        
        print(f"Sending top {min(top_n, len(ranked_candidates))} candidates to LLM")
        
        # Call Groq API with slightly higher temperature for more natural responses
        response = await call_groq_api(prompt, temperature=0.8)
        
        if "choices" in response and len(response["choices"]) > 0:
            ai_response = response["choices"][0]["message"]["content"]
            
            return {
                "response": ai_response,
                "candidates_analyzed": len(unique_candidates),
                "candidates_shown": min(top_n, len(ranked_candidates))
            }
        else:
            raise Exception("Invalid API response")
            
    except Exception as e:
        print(f"Error in chatbot: {str(e)}")
        print(traceback.format_exc())
        
        return {
            "response": f"I apologize, but I encountered an error while processing your query. Please try a different question or check if you have candidates in your database.",
            "candidates_analyzed": 0,
            "candidates_shown": 0
        }


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
        
        # Filter out candidates with very low scores (lowered threshold)
        if len(ranked_candidates) > top_n:
            ranked_candidates = [c for c in ranked_candidates if c.score > 10][:top_n]
        
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