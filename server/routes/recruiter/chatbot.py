from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import httpx
import json
import re
import traceback
from datetime import datetime
from dependencies.auth import get_current_active_user
from dependencies.role_based_auth import require_recruiter
from core.database import db
from core.config import GROQ_API_KEY, GROQ_URL, GROQ_PARSING_MODEL


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


def calculate_total_experience(experiences: List[Dict]) -> Dict[str, Any]:
    """Enhanced experience calculation with better date parsing and validation"""
    if not experiences:
        return {
            'total_years': 0.0,
            'total_months': 0,
            'total_years_display': 'No experience',
            'calculation_method': 'no_data',
            'details': []
        }
    
    total_months = 0
    calculation_details = []
    current_year = datetime.now().year
    
    for exp in experiences:
        years_str = exp.get("Years", "")
        company = exp.get("Company", "Unknown")
        role = exp.get("Role", "Unknown")
        
        if not years_str:
            continue
        
        years_str = str(years_str).strip()
        months_for_this_role = 0
        method = "unknown"
        
        # Method 1: Explicit year ranges (e.g., "2020 - 2023" or "2020-2023")
        date_range_match = re.search(r'(\d{4})\s*[-–to]\s*(\d{4}|present|current)', years_str, re.IGNORECASE)
        if date_range_match:
            start_year = int(date_range_match.group(1))
            end_str = date_range_match.group(2).lower()
            
            if end_str in ['present', 'current']:
                end_year = current_year
            else:
                end_year = int(end_str)
            
            if 1970 <= start_year <= current_year and start_year <= end_year <= current_year + 1:
                years_diff = end_year - start_year
                months_for_this_role = years_diff * 12
                method = f"date_range ({start_year}-{end_year})"
        
        # Method 2: Explicit months
        if months_for_this_role == 0:
            months_match = re.search(r'(\d+)\s*month', years_str, re.IGNORECASE)
            if months_match:
                months_for_this_role = int(months_match.group(1))
                method = "explicit_months"
        
        # Method 3: Explicit years
        if months_for_this_role == 0:
            years_match = re.search(r'(\d+\.?\d*)\s*year', years_str, re.IGNORECASE)
            if years_match:
                years_val = float(years_match.group(1))
                months_for_this_role = int(years_val * 12)
                method = "explicit_years"
        
        # Method 4: Month ranges
        if months_for_this_role == 0:
            month_names = r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*'
            month_range_match = re.search(
                rf'{month_names}\s*(\d{{4}})\s*[-–to]\s*{month_names}\s*(\d{{4}}|present)',
                years_str,
                re.IGNORECASE
            )
            if month_range_match:
                start_year = int(month_range_match.group(2))
                end_str = month_range_match.group(4)
                
                if end_str.lower() in ['present', 'current']:
                    end_year = current_year
                else:
                    end_year = int(end_str)
                
                if 1970 <= start_year <= current_year and start_year <= end_year <= current_year + 1:
                    years_diff = end_year - start_year
                    months_for_this_role = max(1, years_diff * 12)
                    method = f"month_range ({start_year}-{end_year})"
        
        # Method 5: Fallback
        if months_for_this_role == 0:
            numbers = re.findall(r'(\d+\.?\d*)', years_str)
            if numbers:
                for num_str in numbers:
                    num = float(num_str)
                    if 1970 <= num <= 2025:
                        continue
                    if num < 50:
                        if num > 10:
                            months_for_this_role = int(num * 12)
                            method = "fallback_years"
                        else:
                            months_for_this_role = int(num * 12)
                            method = "fallback_conservative"
                        break
        
        months_for_this_role = min(months_for_this_role, 180)
        
        if months_for_this_role > 0:
            total_months += months_for_this_role
            calculation_details.append({
                'company': company,
                'role': role,
                'raw_duration': years_str,
                'calculated_months': months_for_this_role,
                'method': method
            })
    
    total_years = total_months / 12.0
    
    if total_months == 0:
        display = "New Graduate / Intern"
    elif total_months < 12:
        display = f"{total_months} months"
    elif total_months < 24:
        years_part = total_months // 12
        months_part = total_months % 12
        if months_part > 0:
            display = f"{years_part} year {months_part} months"
        else:
            display = f"{years_part} year"
    else:
        years_part = total_months // 12
        months_part = total_months % 12
        if months_part >= 6:
            display = f"{years_part}.{months_part // 6 * 5} years"
        else:
            display = f"{years_part} years"
    
    return {
        'total_years': total_years,
        'total_months': total_months,
        'total_years_display': display,
        'calculation_method': 'multi_method',
        'details': calculation_details
    }


def extract_query_intent(query: str) -> Dict[str, Any]:
    """
    ENHANCED: Extract structured intent with better generalization and fuzzy matching
    """
    query_lower = query.lower()
    intent = {
        'skills': [],
        'min_experience': None,
        'max_experience': None,
        'companies': [],
        'education_level': None,
        'top_n': None,
        'query_type': 'general',
        'company_filter': False,
        'requires_calculation': False,
        'is_compound': False,
        'requires_unavailable_data': False,
        'unavailable_reason': None,
        'search_terms': [],  # NEW: Generic search terms
        'is_conversational': False,  # NEW: Detect casual queries
        'needs_listing': False,  # NEW: User wants a list
        'needs_comparison': False,  # NEW: Comparing candidates
        'needs_summary': False  # NEW: Summary/overview requested
    }

    # Detect unavailable data queries
    unavailable_queries = [
        ('gender', ['female', 'male', 'woman', 'women', 'man', 'men', 'gender']),
        ('location', ['location', 'city', 'state', 'country', 'local', 'nearby', 'remote']),
        ('salary', ['salary', 'compensation', 'pay', 'wage', 'ctc', 'package']),
        ('availability', ['available', 'availability', 'start date', 'notice period']),
        ('visa', ['visa', 'work permit', 'authorization', 'citizenship']),
        ('age', ['age', 'years old', 'born in'])
    ]
    
    for data_type, keywords in unavailable_queries:
        if any(keyword in query_lower for keyword in keywords):
            intent['requires_unavailable_data'] = True
            intent['unavailable_reason'] = data_type
            return intent

    # Detect conversational/casual queries
    conversational_patterns = [
        r'^(hi|hello|hey|greetings)',
        r'(how are you|what\'s up|wassup)',
        r'(thanks|thank you|appreciate)',
        r'^(help|assist|support)',
        r'(can you|could you|would you)',
        r'(tell me about|explain|what is|what are)'
    ]
    
    for pattern in conversational_patterns:
        if re.search(pattern, query_lower):
            intent['is_conversational'] = True
            break

    # Detect query intent types
    if any(word in query_lower for word in ['list', 'show', 'display', 'give me all']):
        intent['needs_listing'] = True
    
    if any(word in query_lower for word in ['compare', 'difference', 'versus', 'vs', 'between']):
        intent['needs_comparison'] = True
    
    if any(word in query_lower for word in ['summary', 'overview', 'breakdown', 'statistics', 'stats']):
        intent['needs_summary'] = True

    # Detect compound questions
    compound_indicators = [' and ', ' with ', ' who ', ' that have ', ' having ', ' as well as ']
    if any(indicator in query_lower for indicator in compound_indicators):
        intent['is_compound'] = True

    # Extract "top N" requests with better patterns
    top_n_patterns = [
        r'top\s+(\d+)',
        r'best\s+(\d+)',
        r'(\d+)\s+best',
        r'(\d+)\s+top',
        r'give\s+me\s+(\d+)',
        r'show\s+me\s+(\d+)',
        r'find\s+(\d+)'
    ]
    
    for pattern in top_n_patterns:
        match = re.search(pattern, query_lower)
        if match:
            intent['top_n'] = int(match.group(1))
            intent['query_type'] = 'ranking'
            break
    
    if not intent['top_n'] and any(word in query_lower for word in ['best', 'top', 'strongest', 'most qualified']):
        intent['top_n'] = 5
        intent['query_type'] = 'ranking'

    # ENHANCED: Expanded skill detection with synonyms and variations
    skill_database = {
        'python': ['python', 'py', 'django', 'flask', 'fastapi', 'pandas', 'numpy'],
        'javascript': ['javascript', 'js', 'ecmascript', 'es6', 'es2015'],
        'typescript': ['typescript', 'ts'],
        'java': ['java', 'jvm', 'spring boot', 'spring'],
        'react': ['react', 'reactjs', 'react.js', 'react native'],
        'angular': ['angular', 'angularjs', 'angular.js'],
        'vue': ['vue', 'vuejs', 'vue.js', 'nuxt'],
        'node': ['node', 'nodejs', 'node.js', 'express', 'expressjs'],
        'dotnet': ['dotnet', '.net', 'c#', 'csharp', 'asp.net'],
        'c++': ['c++', 'cpp', 'cplusplus'],
        'ruby': ['ruby', 'rails', 'ruby on rails'],
        'php': ['php', 'laravel', 'symfony', 'wordpress'],
        'go': ['go', 'golang'],
        'rust': ['rust'],
        'swift': ['swift', 'ios'],
        'kotlin': ['kotlin', 'android'],
        'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudformation'],
        'azure': ['azure', 'microsoft azure'],
        'gcp': ['gcp', 'google cloud', 'google cloud platform'],
        'docker': ['docker', 'containerization', 'containers'],
        'kubernetes': ['kubernetes', 'k8s', 'container orchestration'],
        'sql': ['sql', 'database', 'rdbms'],
        'postgresql': ['postgresql', 'postgres'],
        'mysql': ['mysql'],
        'mongodb': ['mongodb', 'mongo', 'nosql'],
        'redis': ['redis', 'cache', 'caching'],
        'machine learning': ['machine learning', 'ml', 'deep learning', 'neural network'],
        'ai': ['ai', 'artificial intelligence', 'nlp', 'computer vision'],
        'data science': ['data science', 'data analysis', 'analytics'],
        'tensorflow': ['tensorflow', 'tf'],
        'pytorch': ['pytorch', 'torch'],
        'flutter': ['flutter', 'dart'],
        'html': ['html', 'html5'],
        'css': ['css', 'css3', 'sass', 'scss', 'tailwind'],
        'graphql': ['graphql', 'gql'],
        'rest': ['rest', 'restful', 'rest api'],
        'api': ['api', 'apis'],
        'git': ['git', 'github', 'gitlab', 'version control'],
        'jenkins': ['jenkins', 'ci/cd', 'continuous integration'],
        'linux': ['linux', 'unix', 'ubuntu', 'centos'],
        'devops': ['devops', 'sre', 'site reliability'],
        'testing': ['testing', 'test', 'unit test', 'integration test', 'qa', 'quality assurance'],
        'agile': ['agile', 'scrum', 'kanban', 'sprint'],
        'ui/ux': ['ui', 'ux', 'user interface', 'user experience', 'design'],
        'frontend': ['frontend', 'front-end', 'front end'],
        'backend': ['backend', 'back-end', 'back end'],
        'fullstack': ['fullstack', 'full-stack', 'full stack'],
        'microservices': ['microservices', 'microservice architecture'],
        'blockchain': ['blockchain', 'crypto', 'web3', 'ethereum', 'solidity']
    }
    
    # Match skills with fuzzy matching
    for main_skill, variations in skill_database.items():
        for variation in variations:
            if variation in query_lower:
                if main_skill not in intent['skills']:
                    intent['skills'].append(main_skill)
                break

    # Enhanced role-based skill mapping
    role_skill_mapping = {
        'web developer': ['javascript', 'html', 'css', 'react', 'node'],
        'web development': ['javascript', 'html', 'css', 'react', 'node'],
        'full stack': ['javascript', 'react', 'node', 'python', 'sql'],
        'fullstack': ['javascript', 'react', 'node', 'python', 'sql'],
        'frontend developer': ['javascript', 'react', 'html', 'css', 'typescript'],
        'front end': ['javascript', 'react', 'html', 'css', 'typescript'],
        'backend developer': ['python', 'java', 'node', 'sql', 'api'],
        'back end': ['python', 'java', 'node', 'sql', 'api'],
        'mobile developer': ['react', 'flutter', 'swift', 'kotlin'],
        'ios developer': ['swift', 'ios'],
        'android developer': ['kotlin', 'java', 'android'],
        'data scientist': ['python', 'machine learning', 'tensorflow', 'sql'],
        'data engineer': ['python', 'sql', 'spark', 'data science'],
        'devops engineer': ['docker', 'kubernetes', 'aws', 'jenkins', 'linux'],
        'ml engineer': ['python', 'machine learning', 'tensorflow', 'pytorch'],
        'ai engineer': ['python', 'ai', 'machine learning', 'tensorflow'],
        'software engineer': ['python', 'java', 'javascript'],
        'qa engineer': ['testing', 'automation', 'selenium'],
        'ui/ux designer': ['ui/ux', 'design', 'figma']
    }
    
    for role, skills in role_skill_mapping.items():
        if role in query_lower:
            for skill in skills:
                if skill not in intent['skills']:
                    intent['skills'].append(skill)
            if intent['query_type'] == 'general':
                intent['query_type'] = 'ranking'
            break

    # Extract general search terms (words that aren't stop words)
    stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
                  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
                  'could', 'should', 'may', 'might', 'must', 'can', 'who', 'what',
                  'where', 'when', 'why', 'how', 'which', 'this', 'that', 'these',
                  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
                  'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their',
                  'find', 'show', 'give', 'tell', 'list', 'get'}
    
    words = re.findall(r'\b\w+\b', query_lower)
    intent['search_terms'] = [word for word in words if word not in stop_words and len(word) > 2]

    # Enhanced experience extraction with better patterns
    exp_patterns = [
        (r'(\d+)\s*[-to]+\s*(\d+)\s*years?', 'range'),
        (r'(\d+)\+?\s*years?', 'minimum'),
        (r'at least\s+(\d+)\s*years?', 'minimum'),
        (r'more than\s+(\d+)\s*years?', 'minimum'),
        (r'over\s+(\d+)\s*years?', 'minimum'),
        (r'(less than|under|below)\s+(\d+)\s*years?', 'maximum'),
        (r'(\d+)\s*to\s*(\d+)\s*yrs?', 'range'),
        (r'between\s+(\d+)\s*and\s*(\d+)\s*years?', 'range')
    ]
    
    for pattern, exp_type in exp_patterns:
        match = re.search(pattern, query_lower)
        if match:
            if exp_type == 'range':
                intent['min_experience'] = int(match.group(1))
                intent['max_experience'] = int(match.group(2))
            elif exp_type == 'minimum':
                intent['min_experience'] = int(match.group(1))
            elif exp_type == 'maximum':
                intent['max_experience'] = int(match.group(2))
            intent['requires_calculation'] = True
            break

    # Detect company filter queries
    company_keywords = ['company', 'companies', 'intern', 'internship', 'full-time', 'full time',
                       'position', 'worked at', 'experience at', 'employed', 'employer']
    if any(keyword in query_lower for keyword in company_keywords):
        intent['company_filter'] = True
        intent['query_type'] = 'ranking'
        if not intent['top_n']:
            intent['top_n'] = 10

    # Expanded company list
    companies = ['google', 'microsoft', 'amazon', 'facebook', 'meta', 'apple',
                 'netflix', 'uber', 'airbnb', 'linkedin', 'twitter', 'x corp', 'tesla',
                 'ibm', 'oracle', 'salesforce', 'adobe', 'intel', 'nvidia', 'amd',
                 'samsung', 'dell', 'cisco', 'vmware', 'sap', 'accenture',
                 'deloitte', 'wipro', 'tcs', 'infosys', 'cognizant', 'hcl', 'capgemini',
                 'goldman sachs', 'morgan stanley', 'jp morgan', 'jpmorgan', 'mckinsey',
                 'bain', 'bcg', 'stripe', 'spotify', 'slack', 'atlassian', 'zoom',
                 'shopify', 'square', 'paypal', 'ebay', 'booking', 'expedia']
    
    for company in companies:
        if company in query_lower:
            intent['companies'].append(company)

    # Extract education level
    education_keywords = {
        'phd': ['phd', 'ph.d', 'doctorate', 'doctoral'],
        'masters': ['masters', 'master', 'msc', 'm.sc', 'mtech', 'm.tech', 'mba', 'm.b.a'],
        'bachelors': ['bachelor', 'bachelors', 'btech', 'b.tech', 'be', 'b.e', 'bsc', 'b.sc']
    }
    
    for level, keywords in education_keywords.items():
        if any(keyword in query_lower for keyword in keywords):
            intent['education_level'] = level
            break

    return intent


def calculate_skill_proficiency_score(candidate: Dict, required_skills: List[str]) -> Dict[str, Any]:
    """Calculate skill proficiency based on evidence and usage"""
    parsed = candidate.get("parsed_data", {})
    if not parsed:
        return {
            'total_score': 0,
            'skill_breakdown': {},
            'skills_matched': 0,
            'total_skills_required': len(required_skills)
        }
    
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
        
        # Check explicit listing
        if any(req_skill in skill for skill in all_skills):
            skill_score += 30
            evidence.append("listed_in_skills")
        
        # Check project usage
        projects = parsed.get("projects", [])
        project_matches = 0
        for project in projects:
            proj_text = json.dumps(project).lower()
            if req_skill in proj_text:
                project_matches += 1
                evidence.append(f"used_in_project: {project.get('Name', 'unnamed')[:30]}")
        
        if project_matches > 0:
            skill_score += min(40, project_matches * 10)
        
        # Check experience usage
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
    
    normalized_score = (total_score / max_possible_score * 100) if max_possible_score > 0 else 0
    
    skills_matched = sum(1 for s in skill_scores.values() if s['score'] > 0)
    if skills_matched > 0 and len(required_skills) > 3:
        match_ratio = skills_matched / len(required_skills)
        if match_ratio >= 0.5:
            normalized_score = max(normalized_score, 50 * match_ratio)
    
    return {
        'total_score': min(100, normalized_score),
        'skill_breakdown': skill_scores,
        'skills_matched': skills_matched,
        'total_skills_required': len(required_skills)
    }


def calculate_experience_score(candidate: Dict, intent: Dict) -> Dict[str, Any]:
    """Enhanced experience scoring with accurate calculation"""
    parsed = candidate.get("parsed_data", {})
    experiences = parsed.get("experience", []) if parsed else []
    
    if not experiences:
        return {
            'score': 0,
            'total_years': 0.0,
            'total_months': 0,
            'total_years_display': 'No experience',
            'details': 'no_experience',
            'company_count': 0,
            'senior_roles': 0,
            'meets_min_requirement': True if intent.get('min_experience') is None else False,
            'meets_max_requirement': True if intent.get('max_experience') is None else True,
            'calculation_details': []
        }
    
    exp_calc = calculate_total_experience(experiences)
    total_years = exp_calc['total_years']
    total_months = exp_calc['total_months']
    
    company_count = len(experiences)
    senior_roles = 0
    
    senior_keywords = ['senior', 'lead', 'principal', 'architect', 'manager', 'director', 'head', 'chief']
    
    for exp in experiences:
        role = exp.get("Role", "")
        if role:
            role_lower = role.lower()
            if any(keyword in role_lower for keyword in senior_keywords):
                senior_roles += 1
    
    score = 0
    
    if total_years >= 1:
        score += min(40, total_years * 5)
    else:
        score += min(5, total_years * 6)
    
    if company_count >= 4 and company_count <= 6:
        score += 15
    elif company_count == 3:
        score += 12
    elif company_count == 2:
        score += 8
    elif company_count == 1:
        score += 4
    else:
        score += 5
    
    score += min(20, senior_roles * 8)
    
    meets_min_requirement = True
    meets_max_requirement = True
    
    if intent.get('min_experience') is not None:
        if total_years < intent['min_experience']:
            meets_min_requirement = False
            score *= 0.5
    
    if intent.get('max_experience') is not None:
        if total_years > intent['max_experience']:
            meets_max_requirement = False
            score *= 0.7
    
    final_score = min(75, score)
    
    return {
        'score': final_score,
        'total_years': total_years,
        'total_months': total_months,
        'total_years_display': exp_calc['total_years_display'],
        'company_count': company_count,
        'senior_roles': senior_roles,
        'meets_min_requirement': meets_min_requirement,
        'meets_max_requirement': meets_max_requirement,
        'calculation_details': exp_calc['details']
    }


def calculate_education_score(candidate: Dict, required_level: Optional[str] = None) -> Dict[str, Any]:
    """Calculate education score"""
    parsed = candidate.get("parsed_data", {})
    education = parsed.get("education", []) if parsed else []
    
    if not education:
        return {
            'score': 0,
            'highest_degree': None,
            'meets_requirement': True if required_level is None else False
        }
    
    degree_hierarchy = {
        'phd': 100, 'doctorate': 100, 'doctoral': 100,
        'masters': 70, 'msc': 70, 'm.sc': 70, 'mtech': 75, 'm.tech': 75, 'mba': 75,
        'bachelor': 50, 'btech': 70, 'b.tech': 70, 'be': 50, 'b.e': 50, 'bsc': 50,
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
    """Calculate project quality"""
    parsed = candidate.get("parsed_data", {})
    projects = parsed.get("projects", []) if parsed else []
    
    if not projects:
        return {'score': 0, 'project_count': 0, 'relevant_projects': 0}
    
    relevant_projects = 0
    total_score = 0
    
    for project in projects:
        project_text = json.dumps(project).lower()
        project_score = 0
        
        skills_used = 0
        if required_skills:
            skills_used = sum(1 for skill in required_skills if skill in project_text)
        if skills_used > 0:
            relevant_projects += 1
            project_score = min(80, skills_used * 20)
        
        description = project.get("Description", "")
        if len(description) > 200:
            project_score += 15
        elif len(description) > 100:
            project_score += 10
        elif len(description) > 50:
            project_score += 5
        
        total_score += project_score
    
    avg_score = total_score / len(projects) if projects else 0
    
    return {
        'score': min(100, avg_score),
        'project_count': len(projects),
        'relevant_projects': relevant_projects
    }


def calculate_company_score(candidate: Dict, intent: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate company quality score"""
    parsed = candidate.get("parsed_data", {})
    experiences = parsed.get("experience", []) if parsed else []
    
    if not experiences:
        return {
            'score': 0, 'top_companies': [], 'has_fulltime': False,
            'has_internship': False, 'company_count': 0
        }
    
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
            for top_co in top_companies:
                if top_co in company_lower:
                    found_top_companies.append(company)
                    score += 25
                    break
        
        if role:
            role_lower = role.lower()
            if any(term in role_lower for term in ['full-time', 'full time', 'engineer',
                                                     'developer', 'manager', 'lead',
                                                     'senior', 'architect']):
                has_fulltime = True
            
            if 'intern' in role_lower:
                has_internship = True
    
    if has_fulltime and has_internship:
        score += 20
    elif has_fulltime:
        score += 15
    elif has_internship:
        score += 10
    
    score = min(100, score)
    
    return {
        'score': score,
        'top_companies': found_top_companies,
        'has_fulltime': has_fulltime,
        'has_internship': has_internship,
        'company_count': len(found_top_companies)
    }


def rank_candidates(candidates: List[Dict], intent: Dict[str, Any]) -> List[CandidateScore]:
    """Rank candidates based on query intent"""
    scored_candidates = []
    
    for candidate in candidates:
        try:
            skill_analysis = calculate_skill_proficiency_score(candidate, intent.get('skills', []))
            experience_analysis = calculate_experience_score(candidate, intent)
            education_analysis = calculate_education_score(candidate, intent.get('education_level'))
            project_analysis = calculate_project_quality_score(candidate, intent.get('skills', []))
            company_analysis = calculate_company_score(candidate, intent)
            
            if intent.get('company_filter'):
                weights = {
                    'company': 0.50, 'experience': 0.25, 'skills': 0.15,
                    'projects': 0.05, 'education': 0.05
                }
            elif intent.get('query_type') == 'ranking' and intent.get('skills'):
                weights = {
                    'skills': 0.45, 'projects': 0.30, 'experience': 0.15,
                    'education': 0.05, 'company': 0.05
                }
            else:
                weights = {
                    'skills': 0.30, 'experience': 0.25, 'projects': 0.20,
                    'company': 0.15, 'education': 0.10
                }
            
            total_score = (
                skill_analysis['total_score'] * weights['skills'] +
                experience_analysis['score'] * weights['experience'] +
                education_analysis['score'] * weights['education'] +
                project_analysis['score'] * weights['projects'] +
                company_analysis['score'] * weights.get('company', 0)
            )
            
            if not experience_analysis['meets_min_requirement']:
                total_score *= 0.5
            
            if not experience_analysis['meets_max_requirement']:
                total_score *= 0.7
            
            if intent.get('education_level') is not None and not education_analysis['meets_requirement']:
                total_score *= 0.8
            
            if intent.get('company_filter') and company_analysis['company_count'] == 0:
                total_score *= 0.3
            
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
            scored_candidates.append(CandidateScore(candidate, 0, {
                'skill_score': 0, 'skill_details': {'total_score': 0},
                'experience_score': 0, 'experience_details': {'score': 0},
                'education_score': 0, 'project_score': 0,
                'company_score': 0, 'company_details': {'score': 0},
                'weights_used': {}
            }))
    
    scored_candidates.sort(key=lambda x: x.score, reverse=True)
    return scored_candidates


def format_ranked_candidates(ranked_candidates: List[CandidateScore], top_n: Optional[int] = None) -> str:
    """Format candidates for LLM without exposing scores"""
    if top_n:
        ranked_candidates = ranked_candidates[:top_n]
    
    formatted = []
    
    for idx, scored_candidate in enumerate(ranked_candidates, 1):
        candidate = scored_candidate.candidate
        parsed = candidate.get("parsed_data", {})
        
        candidate_info = {
            "rank": idx,
            "name": parsed.get("name", "Unknown") if parsed else "Unknown",
            "email": parsed.get("email", "N/A") if parsed else "N/A",
            "skills": (parsed.get("skills", []) + parsed.get("derived_skills", []))[:10] if parsed else [],
        }
        
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
                    for exp in experiences[:3]
                ],
                "notable_companies": company_details.get('top_companies', []),
                "has_fulltime": company_details.get('has_fulltime', False),
                "has_internship": company_details.get('has_internship', False)
            }
        
        education = parsed.get("education", []) if parsed else []
        if education:
            candidate_info["education"] = [
                {
                    "degree": edu.get("Degree", "N/A"),
                    "institution": edu.get("Institution", "N/A"),
                    "year": edu.get("Year", "N/A")
                }
                for edu in education[:2]
            ]
        
        projects = parsed.get("projects", []) if parsed else []
        if projects:
            candidate_info["projects"] = [
                {
                    "name": proj.get("Name", "Unnamed Project"),
                    "description": proj.get("Description", "")[:150] + "..." if len(proj.get("Description", "")) > 150 else proj.get("Description", "")
                }
                for proj in projects[:3]
            ]
        
        skill_details = scored_candidate.score_breakdown.get('skill_details', {})
        if skill_details.get('skill_breakdown'):
            demonstrated_skills = []
            for skill, details in skill_details['skill_breakdown'].items():
                if details.get('score', 0) > 0:
                    evidence = details.get('evidence', [])
                    if evidence:
                        demonstrated_skills.append({
                            "skill": skill,
                            "evidence": evidence[:2]
                        })
            if demonstrated_skills:
                candidate_info["skill_evidence"] = demonstrated_skills
        
        formatted.append(candidate_info)
    
    return json.dumps(formatted, indent=2)


def create_enhanced_prompt(query: str, ranked_data: str, intent: Dict, total_shown: int, total_unique: int, conversation_history: List[ChatMessage] = []) -> str:
    """
    ENHANCED: Create smarter prompt that handles conversational context
    """
    ranking_context = ""
    if intent.get('query_type') == 'ranking':
        if intent.get('company_filter'):
            ranking_context = """
These candidates are ranked based on their company experience, role progression, and career quality.
Pay attention to candidates at notable companies or with significant positions.
"""
        else:
            ranking_context = """
These candidates are ranked based on overall fit, considering:
- Relevant skills and practical application
- Professional experience and growth
- Project work and demonstrations
- Educational background
- Company experience
"""
    
    # Build conversation context
    conversation_context = ""
    if conversation_history:
        recent_history = conversation_history[-4:]  # Last 4 messages
        conversation_context = "\n\nCONVERSATION HISTORY:\n"
        for msg in recent_history:
            conversation_context += f"{msg.role.upper()}: {msg.content}\n"
        conversation_context += "\nUse this context to provide more relevant and personalized responses.\n"
    
    # Detect query type and provide specific guidance
    response_guidance = ""
    if intent.get('is_conversational'):
        response_guidance = """
CONVERSATIONAL QUERY DETECTED:
- Respond naturally and helpfully
- If it's a greeting, greet back and offer assistance
- If asking for help, explain capabilities
- Keep response friendly and concise
"""
    elif intent.get('needs_comparison'):
        response_guidance = """
COMPARISON REQUESTED:
- Compare candidates side-by-side
- Highlight key differences in skills, experience, background
- Use natural language, avoid rigid formatting
- Be specific about what makes each candidate unique
"""
    elif intent.get('needs_summary'):
        response_guidance = """
SUMMARY/OVERVIEW REQUESTED:
- Provide high-level insights about the candidate pool
- Include key statistics (skill distribution, experience levels)
- Identify notable patterns or standouts
- Keep it concise but informative
"""
    elif intent.get('needs_listing'):
        response_guidance = """
LIST REQUESTED:
- Present candidates clearly
- Include relevant details for each
- Keep descriptions brief unless detail requested
- Use natural formatting
"""
    
    prompt = f"""You are an experienced technical recruiter with deep knowledge of the tech industry.

{ranking_context}

CANDIDATE DATA (Top {total_shown} of {total_unique} unique candidates):
{ranked_data}
{conversation_context}

USER QUERY: "{query}"

{response_guidance}

CORE INSTRUCTIONS:

1. EXPERIENCE CALCULATION:
   - The "total_years" field contains accurate calculated experience
   - NEVER apologize or say you cannot calculate - it's already done
   - Present experience information naturally and confidently
   - Use the "total_years_display" field for human-readable format

2. RESPONSE STYLE:
   - Adapt your format to the question type
   - Be conversational and natural
   - Avoid robotic templates unless clearly appropriate
   - NO numerical scores or rankings in your response
   - Focus on qualitative insights

3. SKILL MATCHING:
   - When discussing skills, reference the "skill_evidence" field
   - Explain WHERE and HOW skills were used
   - Don't just list skills - provide context

4. CONVERSATIONAL QUERIES:
   - Handle greetings naturally
   - Explain capabilities when asked for help
   - Answer meta-questions about your functionality

5. AMBIGUOUS QUERIES:
   - Make reasonable interpretations
   - Provide useful results even for vague queries
   - Offer to refine search if results aren't helpful

WHAT TO AVOID:
- Don't expose numerical scores (e.g., "87.5/100")
- Don't say "I cannot calculate experience"
- Don't use rigid bullet-point templates unnecessarily
- Don't be overly formal for casual questions
- Don't apologize excessively

RESPONSE EXAMPLES:

Casual: "Hey, who's good at Python?"
Good: "I found several strong Python developers. Sarah has been using Python extensively for 5 years, including building ML platforms at Google. John specializes in Python backend work with 6 years of experience. Would you like more details on either?"

Specific: "Find developers with 5+ years and React experience"
Good: "I found 3 candidates meeting your criteria. Sarah has 8 years of experience with strong React skills demonstrated across multiple projects at Google and Microsoft. John has 6.5 years, focusing on React-based frontend applications. Maria brings 7 years with React expertise in cloud-native applications."

Conversational: "Can you help me find someone?"
Good: "Of course! I can help you find candidates from your database. You can search by skills (like Python or React), years of experience, education level, or companies they've worked at. What kind of candidate are you looking for?"

Now respond to: "{query}"
"""
    
    return prompt


@router.post("/chatbot", dependencies=[Depends(require_recruiter)])
async def chatbot_query(
    request: ChatRequest,
    current_user: dict = Depends(get_current_active_user)
):
    """
    ENHANCED: Chatbot with better query understanding and conversational ability
    """
    try:
        print(f"Received query: {request.query}")
        
        # Handle empty queries
        if not request.query or not request.query.strip():
            return {
                "response": "I didn't receive a question. How can I help you find candidates?",
                "candidates_analyzed": 0,
                "candidates_shown": 0
            }
        
        # Fetch candidates
        all_candidates = list(resume_history_collection.find(
            {"recruiter_email": current_user.email}
        ).sort("parsed_at", -1))
        
        if not all_candidates:
            return {
                "response": "You don't have any candidates in your database yet. Please upload some resumes first to get started.",
                "candidates_analyzed": 0,
                "candidates_shown": 0
            }
        
        # Convert and deduplicate
        for candidate in all_candidates:
            candidate["_id"] = str(candidate["_id"])
        
        unique_candidates = deduplicate_candidates(all_candidates)
        
        if not unique_candidates:
            return {
                "response": "No distinct candidates found in your database.",
                "candidates_analyzed": 0,
                "candidates_shown": 0
            }
        
        print(f"Total: {len(all_candidates)}, Unique: {len(unique_candidates)}")
        
        # Extract intent
        intent = extract_query_intent(request.query)
        print(f"Query intent: {intent}")
        
        # Handle unavailable data queries
        if intent.get('requires_unavailable_data'):
            data_type = intent.get('unavailable_reason', 'this information')
            response_map = {
                'gender': "I don't have access to gender information in candidate resumes. Our system focuses on professional qualifications including skills, experience, education, and projects. Would you like me to help you search candidates based on their technical skills or experience instead?",
                'location': "I don't have location information for candidates. However, I can help you find candidates based on their skills, experience, companies they've worked at, or education. What criteria would you like to search by?",
                'salary': "Salary information is not included in the resume data. I can help you find qualified candidates based on their experience level, skills, and background, which you can use to determine appropriate compensation ranges.",
                'availability': "I don't have availability or start date information. I can help you identify strong candidates based on their qualifications, and you can discuss availability during the interview process.",
                'visa': "Visa status information is not available in our system. I can help you find qualified candidates based on their skills and experience.",
                'age': "Age information is not collected in our system. I focus on professional qualifications like skills, experience, education, and projects. How else can I help you find the right candidates?"
            }
            return {
                "response": response_map.get(data_type, f"I don't have access to {data_type} information. I can help you search based on skills, experience, education, projects, and companies. What would you like to search for?"),
                "candidates_analyzed": len(unique_candidates),
                "candidates_shown": 0
            }
        
        # Rank candidates
        ranked_candidates = rank_candidates(unique_candidates, intent)
        
        # Determine how many to show
        top_n = intent.get('top_n') or 5
        
        # Filter low scores
        if len(ranked_candidates) > top_n:
            ranked_candidates = [c for c in ranked_candidates if c.score > 10][:top_n]
        
        if not ranked_candidates:
            return {
                "response": f"I analyzed {len(unique_candidates)} candidates, but none closely matched your criteria for '{request.query}'. Try broadening your search or rephrase your question.",
                "candidates_analyzed": len(unique_candidates),
                "candidates_shown": 0
            }
        
        # Format for LLM
        ranked_data = format_ranked_candidates(ranked_candidates, top_n)
        
        # Create enhanced prompt with conversation history
        prompt = create_enhanced_prompt(
            request.query,
            ranked_data,
            intent,
            min(top_n, len(ranked_candidates)),
            len(unique_candidates),
            request.conversation_history
        )
        
        print(f"Sending top {min(top_n, len(ranked_candidates))} candidates to LLM")
        
        # Call Groq with higher temperature for natural responses
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
            "response": "I apologize, but I encountered an error while processing your query. Please try rephrasing your question or check if you have candidates in your database.",
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
        "model": GROQ_PARSING_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": temperature,
        "max_tokens": 2000
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()


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