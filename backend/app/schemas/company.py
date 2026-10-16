from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class CompanyBase(BaseModel):
    name: str
    industry: str
    headquarters: str
    website: Optional[str] = None
    domain: Optional[str] = None
    careers_url: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class MatchedCompanyBrief(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    headquarters: Optional[str] = None

class CompanyLogoResolveRequest(BaseModel):
    website_url: str

class CompanyLogoResolveResponse(BaseModel):
    normalized_domain: str
    normalized_url: str
    status: str  # "resolved" | "fallback" | "not_found" | "invalid_url"
    source: str  # "existing_company" | "provider_logo" | "fallback_favicon" | "none"
    logo_url: Optional[str] = None
    matched_company: Optional[MatchedCompanyBrief] = None
    message: Optional[str] = None

class CompanyOut(CompanyBase):
    id: str
    slug: str
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CompanyWithStats(CompanyOut):
    experiences_count: int = 0
    opportunities_count: int = 0
    avg_allowance: Optional[float] = None
    min_allowance: Optional[float] = None
    max_allowance: Optional[float] = None
    currency: str = "MYR"
    avg_rating: Optional[float] = None
    top_technologies: List[str] = []
    top_roles: List[str] = []
