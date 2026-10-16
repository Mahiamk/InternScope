import pytest
from app.services.recommendation import (
    normalize_skill,
    extract_skills_from_text,
    calculate_opportunity_score,
    calculate_experience_relevance,
    generate_learning_suggestion
)
from app.models.profile import StudentProfile
from app.models.opportunity import Opportunity
from app.models.experience import InternshipExperience
from app.models.company import Company

def test_canonical_skill_normalization():
    # Tech synonyms
    assert normalize_skill("react.js") == "React"
    assert normalize_skill("reactjs") == "React"
    assert normalize_skill("postgres") == "PostgreSQL"
    assert normalize_skill("psql") == "PostgreSQL"
    assert normalize_skill("python3") == "Python"
    assert normalize_skill("ml") == "Machine Learning"
    assert normalize_skill("ts") == "TypeScript"
    assert normalize_skill("k8s") == "Kubernetes"

    # Business & Finance
    assert normalize_skill("ms excel") == "Advanced Excel"
    assert normalize_skill("powerbi") == "Power BI"
    assert normalize_skill("sap") == "SAP ERP"

    # Media & Marketing
    assert normalize_skill("seo") == "Search Engine Optimization (SEO)"
    assert normalize_skill("pr") == "Public Relations (PR)"
    assert normalize_skill("adobe photoshop") == "Adobe Photoshop"

    # Politics & Education
    assert normalize_skill("public policy") == "Public Policy Analysis"
    assert normalize_skill("curriculum design") == "Curriculum Design"

def test_extract_skills_from_text():
    raw_text = "Python, React.js; PostgreSQL • Docker / AWS"
    extracted = extract_skills_from_text(raw_text)
    assert "Python" in extracted
    assert "React" in extracted
    assert "PostgreSQL" in extracted
    assert "Docker" in extracted
    assert "AWS" in extracted

def test_opportunity_scoring_with_skill_matches():
    profile = StudentProfile(
        preferred_name="Test Student",
        field_of_study="Computer Science",
        skills=[
            {"name": "Python", "category": "Tech", "proficiency": "expert"},
            {"name": "React", "category": "Tech", "proficiency": "advanced"},
            {"name": "FastAPI", "category": "Tech", "proficiency": "intermediate"},
        ],
        preferred_roles=["Software Engineer Intern", "Backend Developer"],
        preferred_industries=["Technology & Software"],
        preferred_locations=["Kuala Lumpur"],
        work_arrangements=["hybrid"],
        min_allowance=1200.0
    )

    company = Company(
        name="Grab Malaysia",
        slug="grab-malaysia",
        industry="Technology & Software",
        headquarters="Kuala Lumpur"
    )

    opp = Opportunity(
        title="Software Engineer Intern (Backend)",
        department="Engineering",
        location="Kuala Lumpur",
        work_type="hybrid",
        period="3 - 6 Months",
        allowance=1500.0,
        skills="Python, FastAPI, Docker, PostgreSQL",
        status="OPEN",
        apply_url="https://grab.careers/intern"
    )
    opp.company = company

    score_result = calculate_opportunity_score(profile, opp)
    
    # Assert score bounds and fields
    assert 15 <= score_result["match_score"] <= 99
    assert score_result["match_score"] >= 75 # High match

    # Assert breakdown elements
    breakdown = score_result["score_breakdown"]
    assert breakdown["role_score"] == 25.0 # Direct role match
    assert breakdown["industry_score"] == 15.0 # Exact industry match
    assert breakdown["location_score"] == 15.0 # KL + Hybrid
    assert breakdown["allowance_score"] == 10.0 # 1500 >= 1200

    # Assert matched vs missing skills
    assert "Python" in score_result["matched_skills"]
    assert "FastAPI" in score_result["matched_skills"]
    assert "Docker" in score_result["missing_skills"]
    assert "PostgreSQL" in score_result["missing_skills"]

    # Assert explainable reasons
    assert any("Matched 2 of 4 required skills" in r for r in score_result["reasons"])
    assert any("preferred role" in r for r in score_result["reasons"])
    assert any("preferred industry" in r for r in score_result["reasons"])
    assert any("Allowance meets your minimum target" in r for r in score_result["reasons"])

    # Learning suggestion
    assert score_result["learning_suggestion"] is not None
    assert "Docker" in score_result["learning_suggestion"] or "PostgreSQL" in score_result["learning_suggestion"]

def test_opportunity_scoring_empty_profile_graceful_fallback():
    # Student with brand new empty profile
    profile = StudentProfile(
        preferred_name="New Student",
        field_of_study=None,
        skills=[],
        preferred_roles=[],
        preferred_industries=[],
        preferred_locations=[],
        work_arrangements=[]
    )

    opp = Opportunity(
        title="General Business Intern",
        location="Kuala Lumpur",
        work_type="onsite",
        period="3 Months",
        allowance=1000.0,
        skills="Communication, Excel",
        status="OPEN",
        apply_url="https://example.com"
    )

    score_result = calculate_opportunity_score(profile, opp)
    assert 15 <= score_result["match_score"] <= 99
    assert len(score_result["reasons"]) > 0

def test_experience_relevance_scoring():
    profile = StudentProfile(
        preferred_roles=["Data Analyst Intern"],
        preferred_industries=["Fintech & Banking"],
        skills=[{"name": "SQL", "proficiency": "advanced"}]
    )

    company = Company(
        name="Maybank",
        slug="maybank",
        industry="Fintech & Banking",
        headquarters="Kuala Lumpur"
    )

    exp = InternshipExperience(
        position="Data Analyst Intern",
        department="Group Digital",
        location="Kuala Lumpur",
        overall_rating=5,
        mentorship_rating=5,
        responsibilities="Built dashboard reports using SQL and Power BI.",
        status="PUBLISHED"
    )
    exp.company = company

    relevance = calculate_experience_relevance(profile, exp)
    assert relevance["relevance_score"] >= 80
    assert any("target role" in h for h in relevance["highlights"])
    assert any("Fintech & Banking" in h for h in relevance["highlights"])
    assert any("Rated 5/5 stars" in h for h in relevance["highlights"])

@pytest.mark.asyncio
async def test_recommendations_api_flow(client):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Recommendations endpoint with filters
    res = await client.get("/api/v1/recommendations?work_type=hybrid", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    for item in data["items"]:
        assert item["opportunity"]["work_type"] == "hybrid"
        assert 15 <= item["match_score"] <= 99

    # 2. Skill gap endpoint
    gap_res = await client.get("/api/v1/recommendations/skills-gap", headers=headers)
    assert gap_res.status_code == 200
    gap_data = gap_res.json()
    assert "total_evaluated_vacancies" in gap_data
    assert "in_demand_missing_skills" in gap_data
