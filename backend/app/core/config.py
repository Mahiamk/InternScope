import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "InternScope API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database URL: uses SQLite for effortless local dev & test, or PostgreSQL in production
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./internscope.db")
    
    # JWT & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "internscope-super-secret-production-key-change-in-prod-xyz123")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ]
    
    # Upload settings
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
    MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    MAX_DOCUMENT_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    ALLOWED_DOCUMENT_TYPES: List[str] = ["application/pdf", "text/plain", "text/markdown"]

    # S3 / Neon Object Storage settings
    AWS_ENDPOINT_URL_S3: Optional[str] = os.getenv("AWS_ENDPOINT_URL_S3", None)
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID", None)
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY", None)
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "uploads")
    
    # Logo Resolution settings
    LOGO_PROVIDER: str = os.getenv("LOGO_PROVIDER", "clearbit")  # clearbit, google_favicon, direct
    LOGO_PROVIDER_API_KEY: Optional[str] = os.getenv("LOGO_PROVIDER_API_KEY", None)
    LOGO_REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("LOGO_REQUEST_TIMEOUT_SECONDS", "3.0"))
    MAX_LOGO_SIZE_BYTES: int = 2 * 1024 * 1024  # 2 MB max
    ALLOWED_LOGO_CONTENT_TYPES: List[str] = [
        "image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"
    ]
    
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-latest")
    LLM_TIMEOUT: float = float(os.getenv("LLM_TIMEOUT", "20.0"))
    LLM_MAX_CALLS: int = int(os.getenv("LLM_MAX_CALLS", "50"))
    
    # University context
    PRIMARY_UNIVERSITY: str = "Albukhary International University (AIU)"
    PRIMARY_UNIVERSITY_CODE: str = "AIU"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
