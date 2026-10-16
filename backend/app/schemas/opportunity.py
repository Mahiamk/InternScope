from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.company import CompanyOut

class OpportunityBase(BaseModel):
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    title: str
    department: Optional[str] = None
    location: str
    work_type: str = "hybrid"
    period: str
    allowance: Optional[float] = None
    currency: str = "MYR"
    period_type: str = "monthly"
    skills: Optional[str] = None
    requirements: Optional[str] = None
    deadline: Optional[date] = None
    source_url: Optional[str] = None
    apply_url: str

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    period: Optional[str] = None
    allowance: Optional[float] = None
    skills: Optional[str] = None
    requirements: Optional[str] = None
    deadline: Optional[date] = None
    source_url: Optional[str] = None
    apply_url: Optional[str] = None
    status: Optional[str] = None

class OpportunityOut(OpportunityBase):
    id: str
    posted_by_id: Optional[str] = None
    status: str
    is_verified: bool
    is_expired: bool = False
    created_at: datetime
    updated_at: datetime
    company: Optional[CompanyOut] = None
    is_bookmarked: bool = False

    model_config = ConfigDict(from_attributes=True)

class OpportunityListResponse(BaseModel):
    items: List[OpportunityOut]
    total: int
    page: int
    size: int
    total_pages: int
