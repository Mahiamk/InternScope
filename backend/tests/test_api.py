import pytest

@pytest.mark.asyncio
async def test_root_endpoint(client):
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "InternScope API"
    assert data["status"] == "operational"

@pytest.mark.asyncio
async def test_auth_login_and_me(client):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    me_resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["email"] == "teststudent@aiu.edu.my"

@pytest.mark.asyncio
async def test_create_and_query_experience(client):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]

    exp_payload = {
        "company_name": "Test Company Tech",
        "position": "Junior Python Intern",
        "department": "Engineering",
        "location": "Cyberjaya, Malaysia",
        "work_type": "hybrid",
        "allowance": 1400.0,
        "currency": "MYR",
        "allowance_period": "monthly",
        "is_allowance_disclosed": True,
        "responsibilities": "Writing async tests and backend REST endpoints.",
        "projects": "Shipped an automated test runner.",
        "overall_rating": 5,
        "anonymous_display": False,
        "status": "PUBLISHED",
        "technology_names": ["Python", "FastAPI"]
    }

    create_resp = await client.post(
        "/api/v1/experiences",
        json=exp_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_resp.status_code == 201
    created_data = create_resp.json()
    assert created_data["position"] == "Junior Python Intern"
    assert created_data["allowance"] == 1400.0
    exp_id = created_data["id"]

    list_resp = await client.get("/api/v1/experiences?search=Junior Python")
    assert list_resp.status_code == 200
    feed = list_resp.json()
    assert feed["total"] >= 1
    assert any(item["id"] == exp_id for item in feed["items"])

    # Test /experiences/me
    my_resp = await client.get(
        "/api/v1/experiences/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert my_resp.status_code == 200
    my_exps = my_resp.json()
    assert any(item["id"] == exp_id for item in my_exps)

@pytest.mark.asyncio
async def test_private_application_tracker(client):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]

    app_payload = {
        "company_name": "Google Malaysia",
        "position": "Software Engineering Intern",
        "status": "APPLIED",
        "notes": "Submitted resume via referral. Awaiting screening."
    }
    create_resp = await client.post(
        "/api/v1/applications",
        json=app_payload,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert create_resp.status_code == 201
    app_id = create_resp.json()["id"]

    list_resp = await client.get(
        "/api/v1/applications",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) >= 1
    assert items[0]["company_name"] == "Google Malaysia"

    update_resp = await client.put(
        f"/api/v1/applications/{app_id}",
        json={"status": "INTERVIEWING"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "INTERVIEWING"

@pytest.mark.asyncio
async def test_bookmark_toggle_and_stats(client):
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]

    # Toggle bookmark
    bm_resp = await client.post(
        "/api/v1/bookmarks/toggle",
        json={"target_type": "COMPANY", "target_id": "test-comp-id"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bm_resp.status_code == 200
    assert bm_resp.json()["bookmarked"] is True

    # Untoggle
    bm_untoggle = await client.post(
        "/api/v1/bookmarks/toggle",
        json={"target_type": "COMPANY", "target_id": "test-comp-id"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert bm_untoggle.status_code == 200
    assert bm_untoggle.json()["bookmarked"] is False

    # Stats summary
    stats_resp = await client.get("/api/v1/stats/summary")
    assert stats_resp.status_code == 200
    s_data = stats_resp.json()
    assert "total_experiences" in s_data
    assert "currency" in s_data
