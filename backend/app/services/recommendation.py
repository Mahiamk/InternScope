import re
from typing import List, Dict, Any, Optional, Set, Tuple
from app.models.profile import StudentProfile
from app.models.opportunity import Opportunity
from app.models.experience import InternshipExperience

# Comprehensive canonical dictionary of skill synonyms across Tech, Business, Finance, Media, Marketing, Politics, Education
CANONICAL_SKILL_MAP = {
    # Programming Languages
    "python": "Python",
    "python3": "Python",
    "py": "Python",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "golang": "Go",
    "go": "Go",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "php": "PHP",
    "ruby": "Ruby",
    "rust": "Rust",
    "swift": "Swift",
    "kotlin": "Kotlin",
    "r": "R Programming",

    # Frameworks & Libraries
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "angularjs": "Angular",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "node": "Node.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "spring": "Spring Boot",
    "spring boot": "Spring Boot",
    "laravel": "Laravel",
    "tailwind": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "bootstrap": "Bootstrap",

    # Databases & Storage
    "sql": "SQL",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "psql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "oracle": "Oracle DB",

    # Cloud, DevOps & Tools
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "azure": "Microsoft Azure",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "ci/cd": "CI/CD Pipelines",
    "linux": "Linux",
    "graphql": "GraphQL",
    "rest": "RESTful APIs",
    "rest api": "RESTful APIs",
    "restful": "RESTful APIs",

    # Data Science & AI/ML
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "ai": "Artificial Intelligence",
    "deep learning": "Deep Learning",
    "nlp": "Natural Language Processing (NLP)",
    "computer vision": "Computer Vision",
    "data analysis": "Data Analysis",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scikit-learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",

    # Business, Analytics & Management
    "excel": "Advanced Excel",
    "ms excel": "Advanced Excel",
    "microsoft excel": "Advanced Excel",
    "advanced excel": "Advanced Excel",
    "spreadsheets": "Advanced Excel",
    "financial modeling": "Financial Modeling",
    "financial analysis": "Financial Analysis",
    "power bi": "Power BI",
    "powerbi": "Power BI",
    "tableau": "Tableau",
    "sap": "SAP ERP",
    "sap erp": "SAP ERP",
    "erp": "ERP Systems",
    "accounting": "Accounting",
    "audit": "Auditing",
    "auditing": "Auditing",
    "valuation": "Business Valuation",
    "taxation": "Taxation",
    "corporate finance": "Corporate Finance",
    "business strategy": "Business Strategy",
    "risk management": "Risk Management",
    "project management": "Project Management",
    "agile": "Agile / Scrum",
    "scrum": "Agile / Scrum",
    "market research": "Market Research",

    # Media, Marketing & Communications
    "seo": "Search Engine Optimization (SEO)",
    "sem": "Search Engine Marketing (SEM)",
    "copywriting": "Copywriting",
    "content creation": "Content Creation",
    "content strategy": "Content Strategy",
    "social media": "Social Media Marketing",
    "social media marketing": "Social Media Marketing",
    "canva": "Canva",
    "photoshop": "Adobe Photoshop",
    "adobe photoshop": "Adobe Photoshop",
    "illustrator": "Adobe Illustrator",
    "adobe premiere": "Adobe Premiere Pro",
    "premiere pro": "Adobe Premiere Pro",
    "video editing": "Video Editing",
    "public relations": "Public Relations (PR)",
    "pr": "Public Relations (PR)",
    "journalism": "Journalism & Reporting",
    "media production": "Media Production",
    "brand strategy": "Brand Strategy",
    "google analytics": "Google Analytics",

    # Education & Politics / Public Policy
    "curriculum development": "Curriculum Design",
    "curriculum design": "Curriculum Design",
    "lesson planning": "Lesson Planning",
    "classroom management": "Classroom Management",
    "pedagogy": "Pedagogical Methods",
    "public policy": "Public Policy Analysis",
    "policy analysis": "Public Policy Analysis",
    "policy research": "Public Policy Analysis",
    "advocacy": "Community Advocacy",
    "qualitative research": "Qualitative Research",
    "stakeholder management": "Stakeholder Management"
}

def normalize_skill(skill_name: str) -> str:
    cleaned = skill_name.strip().lower()
    return CANONICAL_SKILL_MAP.get(cleaned, skill_name.strip())

def extract_skills_from_text(text: Optional[str]) -> List[str]:
    if not text:
        return []
    # Tokenize by common delimiters
    tokens = [s.strip() for s in re.split(r"[,;\n•/|]+", text) if s.strip()]
    normalized = []
    seen = set()
    for token in tokens:
        norm = normalize_skill(token)
        if norm.lower() not in seen:
            seen.add(norm.lower())
            normalized.append(norm)
    return normalized

def generate_learning_suggestion(missing_skills: List[str], target_role: str) -> Optional[str]:
    """Generates a concise, actionable suggestion for closing the skill gap."""
    if not missing_skills:
        return None
    top_missing = missing_skills[:2]
    if len(top_missing) == 1:
        return f"Build a practical demo project highlighting {top_missing[0]} to become a standout candidate for {target_role}."
    return f"Strengthen your candidacy for {target_role} by practicing with {' and '.join(top_missing)}."

def calculate_opportunity_score(
    profile: StudentProfile,
    opportunity: Opportunity
) -> Dict[str, Any]:
    """
    Computes an explainable, deterministic match score (0-100) between a student profile and an active vacancy.
    Breakdown:
      - Technical / domain skills: 35%
      - Target role alignment: 25%
      - Industry alignment: 15%
      - Location & work arrangement: 15%
      - Duration & minimum allowance: 10%
    """
    reasons: List[str] = []
    breakdown: Dict[str, float] = {
        "skills_score": 0.0,
        "role_score": 0.0,
        "industry_score": 0.0,
        "location_score": 0.0,
        "allowance_score": 0.0
    }

    # Extract student skills
    student_skills_raw = profile.skills or []
    student_skill_map: Dict[str, str] = {} # norm.lower() -> proficiency
    for s in student_skills_raw:
        if isinstance(s, dict):
            name = s.get("name", "")
            prof = s.get("proficiency", "intermediate")
        else:
            name = str(s)
            prof = "intermediate"
        norm = normalize_skill(name)
        student_skill_map[norm.lower()] = prof

    # Extract opportunity required skills
    opp_skills_list = extract_skills_from_text(opportunity.skills)
    if not opp_skills_list and opportunity.requirements:
        opp_skills_list = extract_skills_from_text(opportunity.requirements[:200])

    matched_skills: List[str] = []
    missing_skills: List[str] = []

    # 1. Technical / Domain Skills (35% weight)
    if opp_skills_list:
        weighted_matches = 0.0
        for opp_s in opp_skills_list:
            opp_norm_lower = opp_s.lower()
            found = False
            for s_key, prof in student_skill_map.items():
                if s_key == opp_norm_lower or s_key in opp_norm_lower or opp_norm_lower in s_key:
                    found = True
                    # Factor in proficiency level
                    if prof == "expert":
                        multiplier = 1.0
                    elif prof == "advanced":
                        multiplier = 0.95
                    elif prof == "intermediate":
                        multiplier = 0.85
                    elif prof == "beginner":
                        multiplier = 0.70
                    else:
                        multiplier = 0.85
                    weighted_matches += multiplier
                    matched_skills.append(opp_s)
                    break
            if not found:
                missing_skills.append(opp_s)

        match_ratio = min(1.0, weighted_matches / max(1, len(opp_skills_list)))
        skills_points = round(match_ratio * 35.0, 1)
        breakdown["skills_score"] = skills_points

        if matched_skills:
            pct_matched = int(round((len(matched_skills) / len(opp_skills_list)) * 100))
            reasons.append(
                f"Matched {len(matched_skills)} of {len(opp_skills_list)} required skills ({pct_matched}%): {', '.join(matched_skills[:4])}."
            )
        else:
            reasons.append(
                f"Opportunity requires skills to learn: {', '.join(missing_skills[:3])}."
            )
    else:
        # Opportunity has flexible or unspecified requirements
        if student_skill_map:
            breakdown["skills_score"] = 24.0
            reasons.append("Role welcomes applicants with broad foundational skills.")
        else:
            breakdown["skills_score"] = 18.0
            reasons.append("Add skills to your profile to unlock precise skill matching.")

    # 2. Target Role Alignment (25% weight)
    user_roles = [r.lower() for r in (profile.preferred_roles or [])]
    opp_title = opportunity.title.lower()
    opp_dept = (opportunity.department or "").lower()

    role_points = 0.0
    matched_role_name = None

    if user_roles:
        for u_role in user_roles:
            # Exact or substring match
            if u_role in opp_title or u_role in opp_dept:
                role_points = 25.0
                matched_role_name = u_role.title()
                break
            # Partial token overlap (e.g. "Software" or "Engineer" or "Frontend")
            u_words = [w for w in re.split(r"[\s/]+", u_role) if len(w) > 3]
            for w in u_words:
                if w in opp_title or w in opp_dept:
                    role_points = max(role_points, 18.0)
                    matched_role_name = u_role.title()
                    break

        if role_points == 0.0 and profile.field_of_study:
            # Check field of study relevance
            fos = profile.field_of_study.lower()
            if any(f in opp_title or f in opp_dept for f in fos.split() if len(f) > 3):
                role_points = 12.0
                reasons.append(f"Position aligns with your field of study: {profile.field_of_study}")

        breakdown["role_score"] = role_points
        if matched_role_name:
            reasons.append(f"Direct alignment with your preferred role: {matched_role_name}.")
    else:
        # Default baseline if student hasn't specified roles yet
        breakdown["role_score"] = 12.0
        reasons.append("General opportunity matching university degree programs.")

    # 3. Industry Alignment (15% weight)
    company_ind = (opportunity.company.industry if opportunity.company else "").lower()
    preferred_inds = [i.lower() for i in (profile.preferred_industries or [])]

    industry_points = 0.0
    if preferred_inds and company_ind:
        for p_ind in preferred_inds:
            if p_ind in company_ind or company_ind in p_ind:
                industry_points = 15.0
                reasons.append(f"Company matches your preferred industry: {opportunity.company.industry}.")
                break
        if industry_points == 0.0:
            industry_points = 6.0 # Cross-sector exposure
    else:
        industry_points = 10.0 # Standard baseline
    breakdown["industry_score"] = industry_points

    # 4. Location & Work Arrangement (15% weight)
    loc_points = 0.0
    preferred_locs = [l.lower() for l in (profile.preferred_locations or [])]
    opp_loc = opportunity.location.lower()
    opp_work = opportunity.work_type.lower()
    preferred_modes = [m.lower() for m in (profile.work_arrangements or [])]

    # Geographic Location (10 max)
    if preferred_locs:
        if "remote" in opp_loc or opp_work == "remote" or any("remote" in l for l in preferred_locs):
            loc_points += 10.0
            reasons.append("Remote-friendly arrangement matching your location preferences.")
        elif any(p_loc in opp_loc or opp_loc in p_loc for p_loc in preferred_locs):
            loc_points += 10.0
            reasons.append(f"Located in your preferred area: {opportunity.location}.")
        elif "kuala lumpur" in opp_loc and any(l in ["selangor", "petaling jaya", "klang valley"] for l in preferred_locs):
            loc_points += 8.0
            reasons.append(f"Located within Klang Valley metro radius ({opportunity.location}).")
        else:
            loc_points += 3.0
    else:
        loc_points += 7.0

    # Work Arrangement / Mode (5 max)
    if preferred_modes:
        if opp_work in preferred_modes or any(m in opp_work for m in preferred_modes):
            loc_points += 5.0
        else:
            loc_points += 2.0
    else:
        loc_points += 4.0

    breakdown["location_score"] = round(min(15.0, loc_points), 1)

    # 5. Allowance & Availability (10% weight)
    allowance_points = 4.0
    if opportunity.allowance is not None and opportunity.allowance > 0:
        if profile.min_allowance is not None and profile.min_allowance > 0:
            if opportunity.allowance >= profile.min_allowance:
                allowance_points = 10.0
                reasons.append(
                    f"Allowance meets your minimum target: RM {int(opportunity.allowance):,}/mo (Target: RM {int(profile.min_allowance):,}/mo)."
                )
            elif opportunity.allowance >= (profile.min_allowance * 0.8):
                allowance_points = 7.0
            else:
                allowance_points = 3.0
        else:
            allowance_points = 8.0
            if opportunity.allowance >= 1200:
                reasons.append(f"Competitive compensation: RM {int(opportunity.allowance):,}/month.")
    else:
        allowance_points = 5.0

    breakdown["allowance_score"] = round(min(10.0, allowance_points), 1)

    # Total score calculation with bounds enforcement (15 to 99)
    total_score = sum(breakdown.values())
    total_score = min(99.0, max(15.0, round(total_score, 1)))

    learning_suggestion = generate_learning_suggestion(missing_skills, opportunity.title)

    return {
        "match_score": int(round(total_score)),
        "score_breakdown": breakdown,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "learning_suggestion": learning_suggestion,
        "reasons": reasons[:5]
    }

def calculate_experience_relevance(
    profile: StudentProfile,
    experience: InternshipExperience
) -> Dict[str, Any]:
    """
    Ranks peer internship review reports based on alignment with the student's
    career goals and skills.
    """
    relevance_score = 40.0
    highlights: List[str] = []

    user_roles = [r.lower() for r in (profile.preferred_roles or [])]
    pos_lower = experience.position.lower()

    if any(r in pos_lower or pos_lower in r for r in user_roles):
        relevance_score += 25.0
        highlights.append(f"Senior interned in your target role ({experience.position})")

    if profile.preferred_industries and experience.company:
        comp_ind = experience.company.industry.lower()
        if any(i.lower() in comp_ind for i in profile.preferred_industries):
            relevance_score += 15.0
            highlights.append(f"Industry: {experience.company.industry}")

    if experience.overall_rating >= 4:
        relevance_score += 10.0
        highlights.append(f"Rated {experience.overall_rating}/5 stars by alumni")

    if experience.mentorship_rating and experience.mentorship_rating >= 4:
        highlights.append(f"Mentorship rated {experience.mentorship_rating}/5 stars")

    return {
        "relevance_score": min(98, int(round(relevance_score))),
        "highlights": highlights[:3]
    }
