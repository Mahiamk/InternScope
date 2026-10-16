import pytest

@pytest.mark.asyncio
async def test_profile_endpoints(client):
    # 1. Login as test student
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get profile (should auto-create default profile)
    get_resp = await client.get("/api/v1/profile", headers=headers)
    assert get_resp.status_code == 200
    pdata = get_resp.json()
    assert "completion" in pdata
    assert "skills" in pdata

    # 3. Update profile with full onboarding data
    update_payload = {
        "preferred_name": "Alex Tan",
        "field_of_study": "Computer Science",
        "grad_year": 2027,
        "skills": [
            {"name": "Python", "category": "Programming Languages", "proficiency": "advanced"},
            {"name": "React", "category": "Frameworks", "proficiency": "intermediate"},
            {"name": "SQL", "category": "Databases", "proficiency": "advanced"}
        ],
        "preferred_roles": ["Backend Developer", "Software Engineer"],
        "preferred_industries": ["Technology", "Fintech"],
        "preferred_locations": ["Kuala Lumpur", "Cyberjaya"],
        "work_arrangements": ["hybrid", "remote"],
        "min_allowance": 1200.0,
        "bio": "Passionate 3rd year CS student looking for 2026 industrial training."
    }
    patch_resp = await client.patch("/api/v1/profile", json=update_payload, headers=headers)
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()
    assert updated_data["preferred_name"] == "Alex Tan"
    assert len(updated_data["skills"]) == 3
    assert updated_data["completion"]["percentage"] >= 80
    assert updated_data["is_completed"] is True

    # 4. Check completion endpoint directly
    comp_resp = await client.get("/api/v1/profile/completion", headers=headers)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert comp_data["is_completed"] is True
    assert "Target Roles" in comp_data["completed_fields"]

@pytest.mark.asyncio
async def test_recommendations_endpoints(client):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Personalized recommendations for opportunities
    recs_resp = await client.get("/api/v1/recommendations?limit=5", headers=headers)
    assert recs_resp.status_code == 200
    recs_data = recs_resp.json()
    assert "items" in recs_data
    assert "total" in recs_data
    if recs_data["total"] > 0:
        first = recs_data["items"][0]
        assert "match_score" in first
        assert "reasons" in first
        assert "score_breakdown" in first

    # 2. Recommended peer experiences
    exp_recs = await client.get("/api/v1/recommendations/experiences?limit=3", headers=headers)
    assert exp_recs.status_code == 200
    exp_list = exp_recs.json()
    assert isinstance(exp_list, list)

    # 3. Overall Skill Gap Analysis
    gap_resp = await client.get("/api/v1/recommendations/skills-gap", headers=headers)
    assert gap_resp.status_code == 200
    gap_data = gap_resp.json()
    assert "in_demand_missing_skills" in gap_data
    assert "student_skills_count" in gap_data
