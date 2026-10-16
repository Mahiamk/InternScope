import io
import json
import base64
import logging
import httpx
from typing import Optional, Dict, Any, Tuple
from pypdf import PdfReader
from app.core.config import settings

logger = logging.getLogger(__name__)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using pypdf."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                extracted_pages.append(f"--- Page {i + 1} ---\n{text}")
        return "\n\n".join(extracted_pages).strip()
    except Exception as e:
        logger.warning(f"pypdf extraction failed: {e}")
        return ""

def get_candidate_models(preferred_model: Optional[str] = None) -> list[str]:
    """Return an ordered, deduplicated list of Gemini models to try."""
    raw = [
        preferred_model,
        settings.GEMINI_MODEL,
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
        "gemini-3.6-flash",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite"
    ]
    seen = set()
    result = []
    for m in raw:
        if m and m.strip() and m not in seen:
            seen.add(m)
            result.append(m.strip())
    return result

async def test_gemini_api_key(api_key: str, model_name: Optional[str] = None) -> Tuple[bool, str]:
    """Test if a given Google Gemini API key is valid."""
    if not api_key or not api_key.strip():
        return False, "API key is empty."
    
    clean_key = api_key.strip()
    models = get_candidate_models(model_name)
    last_err = ""

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": "Ping. Respond with OK."}
                ]
            }
        ]
    }

    try:
        timeout_val = min(10.0, float(settings.LLM_TIMEOUT))
        async with httpx.AsyncClient(timeout=timeout_val) as client:
            for model in models:
                url = f"{GEMINI_API_BASE}/{model}:generateContent?key={clean_key}"
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    return True, f"API Key is valid and connected to Gemini ({model})."
                elif resp.status_code in (404, 503):
                    # Deprecated or high traffic spike, try next candidate model
                    err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                    last_err = err_data.get("error", {}).get("message", resp.text)
                    continue
                else:
                    err_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_data.get("error", {}).get("message", resp.text)
                    return False, f"Gemini API Error ({resp.status_code}): {err_msg}"
            return False, f"Gemini API Error: {last_err or 'No responding Gemini model found.'}"
    except httpx.RequestError as e:
        return False, f"Network error connecting to Gemini API: {str(e)}"
    except Exception as e:
        return False, f"Unexpected error: {str(e)}"

async def analyze_cv_with_gemini(
    cv_content: str,
    target_role: str = "Software Engineering Intern",
    target_industry: str = "Technology",
    custom_api_key: Optional[str] = None,
    pdf_bytes: Optional[bytes] = None
) -> Dict[str, Any]:
    """
    Analyze CV using Google Gemini API.
    Returns structured analysis, rating (0-100), breakdown, strengths, improvements,
    actionable tips, and bullet point rewrites.
    """
    api_key = (custom_api_key or "").strip() or (settings.GEMINI_API_KEY or "").strip()
    if not api_key:
        raise ValueError(
            "Gemini API key is not configured. Please ensure GEMINI_API_KEY is set in backend .env."
        )

    prompt_instruction = f"""
You are an Elite Executive Technical Recruiter, ATS Specialist, and Career Coach who evaluates candidate resumes for competitive internships and graduate roles across leading global employers (e.g. Grab, Shopee, Google, Maybank, Petronas, Intel).

TARGET INTERNSHIP ROLE: {target_role}
TARGET INDUSTRY: {target_industry}

EVALUATION METHODOLOGY:
1. Overall Rating (0-100):
   - 90-100: Exceptional / Tier 1 (Immediate Interview Candidate)
   - 75-89: Competitive (High potential, minor enhancements needed)
   - 60-74: Needs Polish (Missing metrics, passive verbs, or keyword gaps)
   - Below 60: Critical Revisions Required (Vague descriptions, poor formatting)

2. Breakdown Dimensions (0-100 each):
   - impact_metrics: Use of quantifiable results (%, numbers, business impact, XYZ / STAR formulas).
   - ats_readability: Standard clear headings, simple chronology, machine-parsable syntax.
   - structure_conciseness: Page real estate efficiency, action verbs, no fluff, clean hierarchy.
   - keywords_alignment: Presence of essential hard skills, domain tools, and methodologies for {target_role}.

3. Specific Bullet Rewrites:
   - Identify 2 to 4 actual bullet points or descriptions from the CV that are weak, vague, or task-oriented.
   - Provide an improved version using the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".
   - Explain why the rewrite is stronger.

4. ATS Keywords:
   - detected: Tech stack / skills found in the candidate's CV.
   - recommended: High-demand missing keywords that recruiters search for {target_role}.

YOU MUST RESPOND ONLY WITH VALID JSON matching this exact structure:
{{
  "overall_score": 82,
  "score_tier": "Competitive",
  "target_role": "{target_role}",
  "summary": "2-3 sentences executive summary of the CV.",
  "breakdown": {{
    "impact_metrics": 75,
    "ats_readability": 88,
    "structure_conciseness": 82,
    "keywords_alignment": 80
  }},
  "strengths": [
    "Specific strength 1 with examples from CV",
    "Specific strength 2"
  ],
  "improvements": [
    "Specific weakness or red flag 1",
    "Specific weakness 2"
  ],
  "recommendations": [
    {{
      "title": "Action title",
      "description": "Specific, actionable step the student should take.",
      "priority": "HIGH"
    }},
    {{
      "title": "Action title",
      "description": "Specific action.",
      "priority": "MEDIUM"
    }}
  ],
  "bullet_rewrites": [
    {{
      "original": "Weak quote from candidate CV",
      "improved": "High-impact rewritten version with action verbs and metrics",
      "rationale": "Why this change captures recruiter attention"
    }}
  ],
  "keywords": {{
    "detected": ["Skill1", "Skill2"],
    "recommended": ["MissingSkill1", "MissingSkill2"]
  }}
}}
"""

    parts = []
    if pdf_bytes and len(pdf_bytes) < 4 * 1024 * 1024:
        b64_pdf = base64.b64encode(pdf_bytes).decode("utf-8")
        parts.append({
            "inlineData": {
                "mimeType": "application/pdf",
                "data": b64_pdf
            }
        })
        parts.append({
            "text": f"{prompt_instruction}\n\nCandidate resume document is attached above."
        })
    else:
        parts.append({
            "text": f"{prompt_instruction}\n\n=== CANDIDATE CV TEXT ===\n{cv_content}"
        })

    payload = {
        "contents": [
            {
                "parts": parts
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    models_to_try = get_candidate_models()
    last_error_msg = ""
    used_model = models_to_try[0] if models_to_try else settings.GEMINI_MODEL

    async with httpx.AsyncClient(timeout=float(settings.LLM_TIMEOUT)) as client:
        response = None
        for model in models_to_try:
            used_model = model
            url = f"{GEMINI_API_BASE}/{model}:generateContent?key={api_key}"
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    response = resp
                    break
                elif resp.status_code in (404, 503):
                    # Model not found / unavailable, try next fallback model
                    err_text = resp.text
                    try:
                        err_text = resp.json().get("error", {}).get("message", resp.text)
                    except Exception:
                        pass
                    last_error_msg = f"Model {model}: {err_text}"
                    logger.warning(f"Gemini {model} returned {resp.status_code}, trying fallback candidate: {last_error_msg}")
                    continue
                else:
                    err_msg = resp.text
                    try:
                        err_msg = resp.json().get("error", {}).get("message", resp.text)
                    except Exception:
                        pass
                    raise RuntimeError(f"Gemini API returned error ({resp.status_code}): {err_msg}")
            except httpx.RequestError as exc:
                last_error_msg = f"Request error on {model}: {str(exc)}"
                continue

        if response is None or response.status_code != 200:
            raise RuntimeError(f"Gemini API request failed across models: {last_error_msg}")

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini API did not return any candidates.")

        text_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        if not text_content:
            raise RuntimeError("Gemini API returned empty text content.")

        cleaned_text = text_content.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        elif cleaned_text.startswith("```"):
            cleaned_text = cleaned_text[3:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()

        try:
            parsed_result = json.loads(cleaned_text)
            parsed_result["model_used"] = used_model
            return parsed_result
        except json.JSONDecodeError as jde:
            logger.error(f"Failed to parse Gemini response as JSON: {jde}. Raw: {text_content[:300]}")
            raise RuntimeError(f"Failed to parse Gemini response as JSON: {str(jde)}")

