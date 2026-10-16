from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserOut

class BookmarkCreate(BaseModel):
    target_type: str # 'EXPERIENCE', 'COMPANY', 'OPPORTUNITY'
    target_id: str

class BookmarkOut(BaseModel):
    id: str
    target_type: str
    target_id: str
    created_at: datetime
    details: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)

class ApplicationCreate(BaseModel):
    company_name: str
    company_id: Optional[str] = None
    position: str
    status: str = "INTERESTED" # 'INTERESTED', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED'
    applied_date: Optional[date] = None
    deadline: Optional[date] = None
    notes: Optional[str] = None

class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[date] = None
    deadline: Optional[date] = None
    notes: Optional[str] = None

class ApplicationOut(ApplicationCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CommentCreate(BaseModel):
    experience_id: str
    content: str
    parent_id: Optional[str] = None

class CommentOut(BaseModel):
    id: str
    experience_id: str
    user_id: str
    parent_id: Optional[str] = None
    content: str
    status: str
    created_at: datetime
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class ContentReportCreate(BaseModel):
    target_type: str # 'EXPERIENCE', 'COMMENT', 'COMPANY', 'OPPORTUNITY'
    target_id: str
    reason: str
    details: Optional[str] = None

class ContentReportOut(ContentReportCreate):
    id: str
    reporter_user_id: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class StatsSummaryOut(BaseModel):
    total_experiences: int
    total_companies: int
    total_opportunities: int
    average_allowance: Optional[float] = None
    min_allowance: Optional[float] = None
    max_allowance: Optional[float] = None
    currency: str = "MYR"
    popular_technologies: List[Dict[str, Any]] = []
    top_locations: List[Dict[str, Any]] = []
    top_industries: List[Dict[str, Any]] = []
