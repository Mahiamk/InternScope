import pytest
from httpx import AsyncClient
from unittest.mock import patch, MagicMock

@pytest.mark.asyncio
async def test_cv_status_endpoint(client: AsyncClient):
    """Test the CV service status endpoint."""
    response = await client.get("/api/v1/cv/status")
    assert response.status_code == 200
    data = response.json()
    assert "has_server_key" in data
    assert "model" in data

@pytest.mark.asyncio
async def test_cv_analyze_validation_error(client: AsyncClient):
    """Test that short resume text triggers 400."""
    response = await client.post("/api/v1/cv/analyze", json={
        "resume_text": "Too short",
        "target_role": "Software Engineer"
    })
    assert response.status_code == 400
    assert "Resume text is too short" in response.json()["detail"]

@pytest.mark.asyncio
async def test_cv_analyze_missing_api_key(client: AsyncClient):
    """Test that missing API key when server has no key raises 400."""
    with patch("app.services.cv_analyser.settings.GEMINI_API_KEY", ""):
        response = await client.post("/api/v1/cv/analyze", json={
            "resume_text": "Experienced software engineering student with skills in Python, FastAPI, React, and PostgreSQL. Developed capstone food delivery web platform.",
            "target_role": "Software Engineering Intern"
        })
        assert response.status_code == 400
        assert "Gemini API key is not configured" in response.json()["detail"]

@pytest.mark.asyncio
async def test_cv_analyze_with_mocked_gemini(client: AsyncClient):
    """Test successful CV analysis with mocked Gemini response."""
    mock_gemini_payload = {
        "overall_score": 85,
        "score_tier": "Competitive",
        "target_role": "Software Engineering Intern",
        "summary": "Strong technical foundation with good project experience.",
        "breakdown": {
            "impact_metrics": 80,
            "ats_readability": 90,
            "structure_conciseness": 85,
            "keywords_alignment": 85
        },
        "strengths": [
            "Demonstrated practical full-stack project experience."
        ],
        "improvements": [
            "Add quantifiable business metrics to internship accomplishments."
        ],
        "recommendations": [
            {
                "title": "Use XYZ Formula",
                "description": "Structure project bullets with metrics.",
                "priority": "HIGH"
            }
        ],
        "bullet_rewrites": [
            {
                "original": "Worked on backend APIs",
                "improved": "Architected 10+ REST endpoints in FastAPI reducing latency by 20%",
                "rationale": "Includes quantifiable metrics and strong action verbs"
            }
        ],
        "keywords": {
            "detected": ["Python", "FastAPI", "React"],
            "recommended": ["Docker", "CI/CD", "PostgreSQL"]
        }
    }

    from unittest.mock import AsyncMock
    with patch("app.api.v1.endpoints.cv.analyze_cv_with_gemini", new=AsyncMock(return_value=mock_gemini_payload)):
        response = await client.post("/api/v1/cv/analyze", json={
            "resume_text": "Tariq Mansoor\nComputer Science student with strong knowledge in Python, FastAPI, React. Completed an internship building APIs and frontend components.",
            "target_role": "Software Engineering Intern",
            "api_key": "fake_test_key"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["overall_score"] == 85
        assert data["score_tier"] == "Competitive"
        assert len(data["bullet_rewrites"]) == 1
        assert data["breakdown"]["ats_readability"] == 90
