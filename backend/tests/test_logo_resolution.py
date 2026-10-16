import pytest
import socket
from datetime import date
from unittest.mock import patch, AsyncMock
from app.models.company import Company
from app.models.experience import InternshipExperience
from app.services.logo_resolver import (
    normalize_and_validate_url,
    validate_hostname_dns_safety,
    SecurityValidationError,
    InvalidUrlError,
    resolve_company_logo
)
from tests.conftest import TestSessionLocal

# -------------------------------------------------------------
# 1. URL Normalization & Validation Unit Tests
# -------------------------------------------------------------

def test_url_normalization_valid_schemes():
    # HTTPS
    domain, url = normalize_and_validate_url("https://petronas.com")
    assert domain == "petronas.com"
    assert url == "https://petronas.com"

    # HTTP upgraded to HTTPS or normalized
    domain, url = normalize_and_validate_url("http://grab.com/careers")
    assert domain == "grab.com"
    assert url == "https://grab.com"

    # Missing scheme auto-prefixed
    domain, url = normalize_and_validate_url("maybank.com.my")
    assert domain == "maybank.com.my"
    assert url == "https://maybank.com.my"

    # Leading www. stripped
    domain, url = normalize_and_validate_url("https://www.intel.com/jobs")
    assert domain == "intel.com"
    assert url == "https://intel.com"

    # Leading www2. stripped
    domain, url = normalize_and_validate_url("www2.cimb.com")
    assert domain == "cimb.com"
    assert url == "https://cimb.com"


def test_url_normalization_invalid_urls():
    # Empty string
    with pytest.raises(InvalidUrlError):
        normalize_and_validate_url("")

    # Spaces only
    with pytest.raises(InvalidUrlError):
        normalize_and_validate_url("   ")

    # Malformed non-domains
    with pytest.raises(InvalidUrlError):
        normalize_and_validate_url("just_a_word")


def test_ssrf_prohibited_schemes():
    # Disallowed protocols
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("ftp://files.example.com")

    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("file:///etc/passwd")

    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("javascript:alert(1)")

    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("data:text/html;base64,PHNjcmlwdD4=")


def test_ssrf_prohibited_ips_and_hostnames():
    # Localhost
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://localhost:8000")

    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://127.0.0.1:8000")

    # Link-local cloud metadata (AWS / GCP / Azure)
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://169.254.169.254/latest/meta-data")

    # Private RFC 1918 Class A
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://10.0.0.1/admin")

    # Private RFC 1918 Class B
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://172.16.0.5")

    # Private RFC 1918 Class C
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://192.168.1.1")

    # IPv6 loopback
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://[::1]")

    # Internal TLDs
    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://service.local")

    with pytest.raises(SecurityValidationError):
        normalize_and_validate_url("http://database.internal")


def test_ssrf_dns_rebinding_simulation():
    # Simulate a domain that resolves to 127.0.0.1 via DNS
    with patch("socket.getaddrinfo") as mock_dns:
        mock_dns.return_value = [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 80))
        ]
        with pytest.raises(SecurityValidationError) as exc:
            validate_hostname_dns_safety("malicious-rebind.com")
        assert "resolves to restricted" in str(exc.value) or "resolves to private" in str(exc.value)


# -------------------------------------------------------------
# 2. Logo Resolution API Tests (POST /api/v1/companies/resolve-logo)
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_resolve_logo_existing_company_with_logo(client):
    """If database already has a company with a logo for this domain, reuse it immediately."""
    async with TestSessionLocal() as db:
        comp = Company(
            name="AirAsia MOVE",
            slug="airasia-move",
            domain="airasia.com",
            website="https://www.airasia.com",
            logo_url="https://static.internscope.my/logos/airasia.png",
            industry="Aviation & Travel",
            headquarters="Sepang, Malaysia",
            is_verified=True
        )
        db.add(comp)
        await db.commit()

    resp = await client.post(
        "/api/v1/companies/resolve-logo",
        json={"website_url": "https://airasia.com/my/en"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "resolved"
    assert data["source"] == "existing_company"
    assert data["logo_url"] == "https://static.internscope.my/logos/airasia.png"
    assert data["normalized_domain"] == "airasia.com"
    assert data["matched_company"]["name"] == "AirAsia MOVE"


@pytest.mark.asyncio
async def test_resolve_logo_provider_fetch_and_favicon_fallback(client):
    """Test resolution when no existing record exists."""
    # Test valid corporate domain (Clearbit or Google Favicon fallback)
    resp = await client.post(
        "/api/v1/companies/resolve-logo",
        json={"website_url": "github.com"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("resolved", "fallback")
    assert data["normalized_domain"] == "github.com"
    assert data["logo_url"] is not None
    assert "github.com" in data["logo_url"]


@pytest.mark.asyncio
async def test_resolve_logo_ssrf_rejection_via_endpoint(client):
    """Ensure endpoint rejects local and private IP addresses with invalid_url status."""
    resp = await client.post(
        "/api/v1/companies/resolve-logo",
        json={"website_url": "http://127.0.0.1:8000/secret"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "invalid_url"
    assert "strictly prohibited" in data["message"] or "restricted" in data["message"]


@pytest.mark.asyncio
async def test_create_company_prevents_duplicate_domains(client):
    """Ensure POST /api/v1/companies prevents duplicate company records for the same domain."""
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create first company
    comp_a = {
        "name": "Fintech Alpha",
        "industry": "Fintech",
        "headquarters": "Kuala Lumpur",
        "website": "https://fintechalpha.com",
    }
    res_a = await client.post("/api/v1/companies", json=comp_a, headers=headers)
    assert res_a.status_code == 201

    # 2. Attempt creating second company with same domain
    comp_b = {
        "name": "Alpha Fintech Branch",
        "industry": "Fintech",
        "headquarters": "Penang",
        "website": "https://www.fintechalpha.com/my",
    }
    res_b = await client.post("/api/v1/companies", json=comp_b, headers=headers)
    assert res_b.status_code == 400
    assert "already exists for domain" in res_b.json()["detail"]


# -------------------------------------------------------------
# 3. Experience Creation & Editing with Logo Persistence
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_and_edit_experience_with_logo_detection(client):
    """
    End-to-end:
    1. Student submits experience with company_website and company_logo_url.
    2. Company record is created or updated with the normalized domain, website, and logo.
    3. Student edits experience with an updated company website.
    4. Company record reflects the updated company information.
    """
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create experience with website and logo
    exp_payload = {
        "company_name": "Maxis Broadband",
        "company_website": "https://www.maxis.com.my",
        "company_logo_url": "https://logo.clearbit.com/maxis.com.my",
        "position": "Network Engineering Intern",
        "department": "Telecommunications",
        "location": "Kuala Lumpur",
        "work_type": "hybrid",
        "responsibilities": "Managed fiber backhaul tests and cellular deployment logs.",
        "overall_rating": 5,
        "status": "PUBLISHED"
    }

    create_res = await client.post("/api/v1/experiences", json=exp_payload, headers=headers)
    assert create_res.status_code == 201
    exp_data = create_res.json()
    exp_id = exp_data["id"]

    assert exp_data["company"]["name"] == "Maxis Broadband"
    assert exp_data["company"]["logo_url"] == "https://logo.clearbit.com/maxis.com.my"
    assert exp_data["company"]["domain"] == "maxis.com.my"

    # 2. Check that company in database has the persisted logo
    company_id = exp_data["company"]["id"]
    async with TestSessionLocal() as db:
        c = await db.get(Company, company_id)
        assert c.domain == "maxis.com.my"
        assert c.logo_url == "https://logo.clearbit.com/maxis.com.my"

    # 3. Create a SECOND experience for the same company by website only
    exp2_payload = {
        "company_name": "Maxis Berhad",
        "company_website": "maxis.com.my/careers",
        "position": "Data Analyst Intern",
        "location": "Kuala Lumpur",
        "work_type": "onsite",
        "responsibilities": "Analyzed churn rates and cellular traffic datasets.",
        "overall_rating": 4,
        "status": "PUBLISHED"
    }
    create2_res = await client.post("/api/v1/experiences", json=exp2_payload, headers=headers)
    assert create2_res.status_code == 201
    exp2_data = create2_res.json()

    # Crucial: Must reuse existing company record!
    assert exp2_data["company"]["id"] == company_id
    assert exp2_data["company"]["logo_url"] == "https://logo.clearbit.com/maxis.com.my"

    # 4. Edit the first experience
    update_payload = {
        "position": "Lead Network Engineering Intern",
        "company_logo_url": "https://static.internscope.my/logos/maxis-custom.png"
    }
    update_res = await client.put(f"/api/v1/experiences/{exp_id}", json=update_payload, headers=headers)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["position"] == "Lead Network Engineering Intern"
    assert updated_data["company"]["logo_url"] == "https://static.internscope.my/logos/maxis-custom.png"
