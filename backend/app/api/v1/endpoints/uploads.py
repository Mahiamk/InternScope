from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.services.storage import (
    process_and_upload_image,
    process_and_upload_document,
    is_s3_configured
)

router = APIRouter()

class UploadResponse(BaseModel):
    url: str
    filename: str
    content_type: str
    size_bytes: int
    storage: Optional[str] = "local"

class StorageStatusResponse(BaseModel):
    s3_enabled: bool
    bucket_name: str
    endpoint_url: Optional[str]
    region: str

@router.get("/status", response_model=StorageStatusResponse)
async def get_storage_status():
    """Return storage status indicating whether S3/Neon object storage is configured."""
    return StorageStatusResponse(
        s3_enabled=is_s3_configured(),
        bucket_name=settings.S3_BUCKET_NAME,
        endpoint_url=settings.AWS_ENDPOINT_URL_S3,
        region=settings.AWS_REGION
    )

@router.post("/image", response_model=UploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image (PNG, JPG, WEBP).
    Strips EXIF metadata for privacy, validates file integrity, and stores in Neon S3.
    """
    # 1. Content-Type check
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format. Allowed: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )

    # 2. File size check
    contents = await file.read()
    if len(contents) > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_IMAGE_SIZE_BYTES / (1024*1024)}MB."
        )

    # 3. Process, sanitize EXIF, and upload
    try:
        result = await process_and_upload_image(
            contents=contents,
            original_filename=file.filename or "image.jpg",
            content_type=file.content_type
        )
        return UploadResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process image: {str(e)}"
        )

@router.post("/document", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Upload a document (PDF, TXT, Markdown).
    Validates file format, checks size, and stores in Neon S3 bucket.
    """
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file selected.")

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in ("pdf", "txt", "md"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported document format. Allowed formats: .pdf, .txt, .md"
        )

    contents = await file.read()
    if len(contents) > settings.MAX_DOCUMENT_SIZE_BYTES:
        max_mb = settings.MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {max_mb}MB."
        )

    try:
        result = await process_and_upload_document(
            contents=contents,
            original_filename=file.filename,
            content_type=file.content_type or "application/pdf"
        )
        return UploadResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )
