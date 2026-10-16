from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import Optional
from app.schemas.cv import CVAnalysisResponse, CVAnalysisRequest
from app.services.cv_analyser import analyze_cv_with_gemini, extract_text_from_pdf_bytes, test_gemini_api_key
from app.core.dependencies import get_optional_current_user
from app.models.user import User
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter()

class TestKeyRequest(BaseModel):
    api_key: str

class TestKeyResponse(BaseModel):
    valid: bool
    message: str

class CVStatusResponse(BaseModel):
    has_server_key: bool
    model: str

@router.get("/status", response_model=CVStatusResponse)
async def get_cv_service_status():
    """Check if server has default Gemini API key configured."""
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    return CVStatusResponse(
        has_server_key=has_key,
        model=settings.GEMINI_MODEL or "gemini-1.5-flash"
    )

@router.post("/test-key", response_model=TestKeyResponse)
async def test_key(payload: TestKeyRequest):
    """Test a candidate Google Gemini API key."""
    valid, message = await test_gemini_api_key(payload.api_key)
    return TestKeyResponse(valid=valid, message=message)

@router.post("/analyze", response_model=CVAnalysisResponse)
async def analyze_cv_json(
    payload: CVAnalysisRequest,
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Analyze CV from raw text or markdown."""
    if not payload.resume_text or len(payload.resume_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text is too short. Please provide at least 50 characters of your CV or resume content."
        )

    try:
        result = await analyze_cv_with_gemini(
            cv_content=payload.resume_text,
            target_role=payload.target_role or "Software Engineering Intern",
            target_industry=payload.target_industry or "Technology",
            custom_api_key=payload.api_key
        )
        return CVAnalysisResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/analyze-file", response_model=CVAnalysisResponse)
async def analyze_cv_file(
    file: UploadFile = File(...),
    target_role: str = Form("Software Engineering Intern"),
    target_industry: str = Form("Technology"),
    api_key: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Analyze CV from uploaded PDF or text file."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file uploaded.")

    content_bytes = await file.read()
    if len(content_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds 10MB limit.")

    extracted_text = ""
    pdf_bytes_for_gemini = None

    if file.filename.lower().endswith(".pdf"):
        extracted_text = extract_text_from_pdf_bytes(content_bytes)
        pdf_bytes_for_gemini = content_bytes
        if not extracted_text:
            extracted_text = "PDF document attached as binary data."
    elif file.filename.lower().endswith((".txt", ".md")):
        try:
            extracted_text = content_bytes.decode("utf-8", errors="ignore")
        except Exception:
            extracted_text = ""
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF (.pdf) or text (.txt, .md) file."
        )

    if not extracted_text and not pdf_bytes_for_gemini:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract text from the uploaded file."
        )

    try:
        result = await analyze_cv_with_gemini(
            cv_content=extracted_text,
            target_role=target_role,
            target_industry=target_industry,
            custom_api_key=api_key,
            pdf_bytes=pdf_bytes_for_gemini
        )
        return CVAnalysisResponse(**result)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
