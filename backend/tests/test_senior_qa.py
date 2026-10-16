import pytest
from app.models.company import Company
from app.models.experience import InternshipExperience
from app.models.user import User
from app.core.security import get_password_hash

@pytest.mark.asyncio
async def test_ask_a_senior_complete_lifecycle(client):
    # 1. Login as teststudent
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    assert login_resp.status_code == 200
    student_token = login_resp.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 2. Register/Login as an alumnus / senior who previously interned at Grab
    reg_senior = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "grab_senior@aiu.edu.my",
            "password": "Password123!",
            "full_name": "Senior Alex",
            "program": "Computer Science",
            "grad_year": 2024
        }
    )
    assert reg_senior.status_code in [200, 201]

    login_senior = await client.post(
        "/api/v1/auth/login",
        json={"email": "grab_senior@aiu.edu.my", "password": "Password123!"}
    )
    senior_token = login_senior.json()["access_token"]
    senior_headers = {"Authorization": f"Bearer {senior_token}"}

    # 3. Create a test company (Grab)
    company_resp = await client.post(
        "/api/v1/companies",
        json={
            "name": "Grab Test Inc",
            "industry": "Ride-Hailing & Fintech",
            "headquarters": "Petaling Jaya, Selangor",
            "domain": "grab-test.com",
            "website": "https://www.grab-test.com"
        },
        headers=student_headers
    )
    assert company_resp.status_code in [200, 201]
    company_id = company_resp.json()["id"]

    # 4. Senior publishes an internship experience at Grab to earn verified senior status
    exp_resp = await client.post(
        "/api/v1/experiences",
        json={
            "company_name": "Grab Test Inc",
            "company_website": "https://www.grab-test.com",
            "position": "Backend Engineering Intern",
            "department": "Transport Tech",
            "location": "Petaling Jaya",
            "work_type": "hybrid",
            "allowance": 1500.0,
            "currency": "MYR",
            "allowance_period": "monthly",
            "is_allowance_disclosed": True,
            "responsibilities": "Building dispatch APIs",
            "projects": "Driver queue",
            "overall_rating": 5,
            "status": "PUBLISHED"
        },
        headers=senior_headers
    )
    assert exp_resp.status_code in [200, 201]

    # 5. Junior student asks a question about interviews
    q_payload = {
        "company_id": company_id,
        "title": "What coding questions does Grab ask during the live round?",
        "content": "Can any previous Grab interns share how hard the algorithm questions were and if system design is covered?",
        "category": "INTERVIEWS",
        "is_anonymous": False,
        "is_private": False
    }
    q_resp = await client.post(
        "/api/v1/senior-qa/questions",
        json=q_payload,
        headers=student_headers
    )
    assert q_resp.status_code == 201
    q_data = q_resp.json()
    assert q_data["title"] == q_payload["title"]
    assert q_data["status"] == "OPEN"
    question_id = q_data["id"]

    # 6. Verify listing endpoint includes this question
    list_resp = await client.get("/api/v1/senior-qa/questions?category=INTERVIEWS")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert any(q["id"] == question_id for q in list_data["items"])

    # 7. Senior answers the question
    ans_payload = {
        "content": "Focus on data structures like hash tables and trees. They ask practical questions rather than trick DP questions. Be ready to explain tradeoffs!",
        "is_anonymous": False
    }
    ans_resp = await client.post(
        f"/api/v1/senior-qa/questions/{question_id}/answers",
        json=ans_payload,
        headers=senior_headers
    )
    assert ans_resp.status_code == 201
    ans_data = ans_resp.json()
    assert ans_data["is_verified_intern"] is True  # Verified alumni detection!
    assert "Backend Engineering Intern" in (ans_data["internship_role"] or "")
    answer_id = ans_data["id"]

    # 8. Mark helpful answer
    helpful_resp = await client.post(
        f"/api/v1/senior-qa/answers/{answer_id}/helpful",
        headers=student_headers
    )
    assert helpful_resp.status_code == 200
    assert helpful_resp.json()["helpful_count"] == 1
    assert helpful_resp.json()["has_voted_helpful"] is True

    # 9. Student asks a follow-up
    fu_payload = {
        "content": "Did they require writing code in Go or is Python allowed?",
        "is_anonymous": False
    }
    fu_resp = await client.post(
        f"/api/v1/senior-qa/answers/{answer_id}/follow-ups",
        json=fu_payload,
        headers=student_headers
    )
    assert fu_resp.status_code == 201
    fu_data = fu_resp.json()
    assert fu_data["content"] == fu_payload["content"]

    # 10. Fetch complete question thread and verify question is now ANSWERED with follow-up
    detail_resp = await client.get(
        f"/api/v1/senior-qa/questions/{question_id}",
        headers=student_headers
    )
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["status"] == "ANSWERED"
    assert len(detail["answers"]) == 1
    assert detail["answers"][0]["helpful_count"] == 1
    assert detail["answers"][0]["has_voted_helpful"] is True
    assert len(detail["answers"][0]["follow_ups"]) == 1
    assert detail["answers"][0]["follow_ups"][0]["content"] == fu_payload["content"]

@pytest.mark.asyncio
async def test_ask_a_senior_anonymous_and_private_privacy(client):
    # Student login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    student_token = login_resp.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Third-party student (not author, not intern at company)
    reg_other = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "other_student@aiu.edu.my",
            "password": "Password123!",
            "full_name": "Other Peer",
            "program": "Accounting",
            "grad_year": 2026
        }
    )
    assert reg_other.status_code in [200, 201]
    login_other = await client.post(
        "/api/v1/auth/login",
        json={"email": "other_student@aiu.edu.my", "password": "Password123!"}
    )
    other_token = login_other.json()["access_token"]
    other_headers = {"Authorization": f"Bearer {other_token}"}

    # Create company
    c_resp = await client.post(
        "/api/v1/companies",
        json={
            "name": "Secret Corp Private",
            "industry": "Consulting",
            "headquarters": "Kuala Lumpur",
            "domain": "secret-corp.com"
        },
        headers=student_headers
    )
    company_id = c_resp.json()["id"]

    # 1. Ask Anonymous + Private Question
    private_q_resp = await client.post(
        "/api/v1/senior-qa/questions",
        json={
            "company_id": company_id,
            "title": "Strictly confidential allowance question",
            "content": "Can someone share off-record if the allowance is strictly non-negotiable?",
            "category": "CULTURE_BENEFITS",
            "is_anonymous": True,
            "is_private": True
        },
        headers=student_headers
    )
    assert private_q_resp.status_code == 201
    q_id = private_q_resp.json()["id"]

    # 2. Author can see their own question
    author_view = await client.get(f"/api/v1/senior-qa/questions/{q_id}", headers=student_headers)
    assert author_view.status_code == 200
    assert author_view.json()["is_author"] is True

    # 3. Other unauthorized student cannot see it in public listing or direct endpoint
    other_list = await client.get("/api/v1/senior-qa/questions", headers=other_headers)
    assert other_list.status_code == 200
    assert not any(q["id"] == q_id for q in other_list.json()["items"])

    other_direct = await client.get(f"/api/v1/senior-qa/questions/{q_id}", headers=other_headers)
    assert other_direct.status_code == 403  # Forbidden!
