import pytest
from datetime import datetime, timezone, timedelta
from app.models.company import Company
from app.models.opportunity import Opportunity
from tests.conftest import TestSessionLocal

@pytest.mark.asyncio
async def test_unauthorized_access_rejected(client):
    """Verify that unauthorized requests to profile and recommendations return 401."""
    # Profile endpoints
    res_get_profile = await client.get("/api/v1/profile")
    assert res_get_profile.status_code == 401

    res_patch_profile = await client.patch("/api/v1/profile", json={"preferred_name": "Ghost"})
    assert res_patch_profile.status_code == 401

    res_completion = await client.get("/api/v1/profile/completion")
    assert res_completion.status_code == 401

    # Recommendations endpoints
    res_recs = await client.get("/api/v1/recommendations")
    assert res_recs.status_code == 401

    res_gap = await client.get("/api/v1/recommendations/skills-gap")
    assert res_gap.status_code == 401

    res_peer = await client.get("/api/v1/recommendations/experiences")
    assert res_peer.status_code == 401


@pytest.mark.asyncio
async def test_closed_and_expired_opportunities_filtered(client):
    """Verify that closed or expired opportunities are excluded from recommendations."""
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Seed 1 open, 1 closed, 1 past-deadline opportunity directly
    now = datetime.now(timezone.utc)
    past_date = now - timedelta(days=10)
    future_date = now + timedelta(days=30)

    async with TestSessionLocal() as db:
        comp = Company(name="Acme Corp", slug="acme-corp", industry="Technology", headquarters="Kuala Lumpur")
        db.add(comp)
        await db.flush()

        opp_open = Opportunity(
            company_id=comp.id,
            title="Active Software Intern",
            department="Engineering",
            location="Kuala Lumpur",
            work_type="hybrid",
            period="3 - 6 Months",
            status="OPEN",
            deadline=future_date.date(),
            skills="Python, SQL",
            apply_url="https://acme.example/open"
        )
        opp_closed = Opportunity(
            company_id=comp.id,
            title="Closed Hardware Intern",
            department="Hardware",
            location="Kuala Lumpur",
            work_type="onsite",
            period="3 Months",
            status="CLOSED",
            deadline=future_date.date(),
            skills="C++, Rust",
            apply_url="https://acme.example/closed"
        )
        opp_expired = Opportunity(
            company_id=comp.id,
            title="Expired Data Intern",
            department="Data",
            location="Kuala Lumpur",
            work_type="remote",
            period="6 Months",
            status="OPEN",
            deadline=past_date.date(),
            skills="Python, Tableau",
            apply_url="https://acme.example/expired"
        )
        db.add_all([opp_open, opp_closed, opp_expired])
        await db.commit()

    # 3. Query recommendations
    recs_res = await client.get("/api/v1/recommendations", headers=headers)
    assert recs_res.status_code == 200
    data = recs_res.json()
    titles = [item["opportunity"]["title"] for item in data["items"]]

    assert "Active Software Intern" in titles
    assert "Closed Hardware Intern" not in titles
    assert "Expired Data Intern" not in titles


@pytest.mark.asyncio
async def test_recommendation_ranking_deterministic_order(client):
    """Verify that recommendations are returned strictly sorted by match_score descending."""
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Setup profile with distinct skills and target role
    await client.patch(
        "/api/v1/profile",
        json={
            "preferred_name": "Ranking Tester",
            "skills": [
                {"name": "Python", "proficiency": "expert"},
                {"name": "FastAPI", "proficiency": "advanced"}
            ],
            "preferred_roles": ["Backend Developer Intern"],
            "preferred_industries": ["Technology"],
            "preferred_locations": ["Kuala Lumpur"],
            "work_arrangements": ["remote"]
        },
        headers=headers
    )

    # Seed 2 open opportunities with high vs low alignment
    async with TestSessionLocal() as db:
        comp = Company(name="TechScale", slug="techscale", industry="Technology", headquarters="Kuala Lumpur")
        db.add(comp)
        await db.flush()

        high_match = Opportunity(
            company_id=comp.id,
            title="Backend Developer Intern",
            location="Kuala Lumpur",
            work_type="remote",
            period="3 - 6 Months",
            status="OPEN",
            skills="Python, FastAPI",
            apply_url="https://techscale.example/backend"
        )
        low_match = Opportunity(
            company_id=comp.id,
            title="Civil Structural Drafter Intern",
            location="Penang",
            work_type="onsite",
            period="3 Months",
            status="OPEN",
            skills="AutoCAD, Revit",
            apply_url="https://techscale.example/civil"
        )
        db.add_all([high_match, low_match])
        await db.commit()

    recs_res = await client.get("/api/v1/recommendations", headers=headers)
    assert recs_res.status_code == 200
    items = recs_res.json()["items"]
    assert len(items) >= 2

    # Verify descending score sorting
    scores = [item["match_score"] for item in items]
    for i in range(len(scores) - 1):
        assert scores[i] >= scores[i+1], f"Score {scores[i]} must be >= {scores[i+1]}"

    # Verify high match item has higher score than low match
    titles_to_scores = {item["opportunity"]["title"]: item["match_score"] for item in items}
    assert titles_to_scores["Backend Developer Intern"] > titles_to_scores["Civil Structural Drafter Intern"]


@pytest.mark.asyncio
async def test_end_to_end_student_lifecycle(client):
    """
    End-to-End User Journey:
    1. Register new student
    2. Check initial profile completion (< 50%)
    3. Complete full onboarding profile
    4. Verify 100% completion
    5. Fetch personalized recommendations with explainability
    6. Run target opportunity skill gap comparison
    """
    # 1. Register new student
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "e2e_student@aiu.edu.my",
            "password": "SecurePassword123!",
            "full_name": "Farah Nabilah",
            "role": "student"
        }
    )
    assert reg_res.status_code == 201
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check initial profile (empty/default)
    init_prof = await client.get("/api/v1/profile", headers=headers)
    assert init_prof.status_code == 200
    assert init_prof.json()["completion"]["percentage"] < 50
    assert init_prof.json()["is_completed"] is False

    # 3. Complete onboarding
    onboard_payload = {
        "preferred_name": "Farah",
        "field_of_study": "Data Science & Artificial Intelligence",
        "current_year": 3,
        "grad_year": 2027,
        "training_start_date": "2026-07-01",
        "preferred_roles": ["Data Analyst Intern", "Machine Learning Intern"],
        "preferred_industries": ["Technology", "Fintech & Banking"],
        "preferred_locations": ["Kuala Lumpur", "Cyberjaya"],
        "work_arrangements": ["hybrid", "remote"],
        "min_allowance": 1200.0,
        "skills": [
            {"name": "Python", "category": "Programming Languages", "proficiency": "advanced"},
            {"name": "SQL", "category": "Databases", "proficiency": "advanced"},
            {"name": "Power BI", "category": "Analytics", "proficiency": "intermediate"},
            {"name": "Pandas", "category": "Libraries", "proficiency": "advanced"}
        ],
        "bio": "Passionate 3rd year Data Science student aiming for Fintech analytics training.",
        "github_url": "https://github.com/farahnabilah",
        "linkedin_url": "https://linkedin.com/in/farahnabilah",
        "portfolio_url": "https://farah.dev"
    }
    patch_res = await client.patch("/api/v1/profile", json=onboard_payload, headers=headers)
    assert patch_res.status_code == 200
    profile_data = patch_res.json()

    # 4. Verify 100% completion
    assert profile_data["is_completed"] is True
    assert profile_data["completion"]["percentage"] == 100
    assert len(profile_data["completion"]["missing_fields"]) == 0

    # 5. Seed a matching data opportunity
    async with TestSessionLocal() as db:
        comp = Company(name="Bank Negara Fintech Hub", slug="bnm-fintech", industry="Fintech & Banking", headquarters="Kuala Lumpur")
        db.add(comp)
        await db.flush()

        opp = Opportunity(
            company_id=comp.id,
            title="Data Analyst Intern",
            department="Analytics",
            location="Kuala Lumpur",
            work_type="hybrid",
            period="3 - 6 Months",
            allowance=1500.0,
            skills="Python, SQL, Power BI, Docker",
            status="OPEN",
            apply_url="https://bnm.example/intern"
        )
        db.add(opp)
        await db.commit()
        opp_id = opp.id

    # 6. Fetch recommendations
    recs_res = await client.get("/api/v1/recommendations", headers=headers)
    assert recs_res.status_code == 200
    recs_json = recs_res.json()
    assert recs_json["total"] >= 1
    top_opp = recs_json["items"][0]
    assert top_opp["match_score"] >= 80
    assert "Python" in top_opp["matched_skills"]
    assert "Docker" in top_opp["missing_skills"]
    assert len(top_opp["reasons"]) >= 3
    assert top_opp["score_breakdown"]["role_score"] == 25.0

    # 7. Query skill gap specifically for this target vacancy
    gap_res = await client.get(f"/api/v1/recommendations/skills-gap?opportunity_id={opp_id}", headers=headers)
    assert gap_res.status_code == 200
    gap_json = gap_res.json()
    assert gap_json["opportunity_title"] == "Data Analyst Intern"
    assert "Docker" in gap_json["missing_skills"]
    assert "Python" in gap_json["matched_skills"]
