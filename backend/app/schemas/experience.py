from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, field_validator
from app.schemas.technology import TechnologyOut
from app.schemas.company import CompanyOut

class MediaItem(BaseModel):
    media_url: str
    caption: Optional[str] = None
    order_idx: int = 0
    model_config = ConfigDict(extra="ignore")

class MediaOut(MediaItem):
    id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True, extra="ignore")

class ExperienceBase(BaseModel):
    company_id: Optional[str] = None
    company_name: Optional[str] = None # allows typing a company if not yet in system
    company_website: Optional[str] = None # website URL for automatic logo resolution & linking
    company_logo_url: Optional[str] = None # resolved or custom logo URL
    position: str
    department: Optional[str] = None
    location: str
    work_type: str = "hybrid" # onsite, hybrid, remote
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_weeks: Optional[int] = None
    
    # Allowance
    allowance: Optional[float] = None
    currency: str = "MYR"
    allowance_period: str = "monthly"
    is_allowance_disclosed: bool = True
    
    # Narrative
    responsibilities: str
    projects: Optional[str] = None
    interview_process: Optional[str] = None
    interview_tips: Optional[str] = None
    interview_difficulty: Optional[int] = 3
    
    # Ratings & Advice
    mentorship_rating: Optional[int] = 4
    culture_rating: Optional[int] = 4
    overall_rating: int = 4
    pros: Optional[str] = None
    challenges: Optional[str] = None
    advice: Optional[str] = None
    
    anonymous_display: bool = False
    status: str = "PUBLISHED" # DRAFT, PENDING, PUBLISHED

    model_config = ConfigDict(extra="ignore")

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def parse_empty_date_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v

class ExperienceCreate(ExperienceBase):
    technology_ids: List[str] = []
    technology_names: List[str] = [] # can pass custom technology names
    media: List[MediaItem] = []

class ExperienceUpdate(BaseModel):
    company_website: Optional[str] = None
    company_logo_url: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    work_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    duration_weeks: Optional[int] = None
    allowance: Optional[float] = None
    currency: Optional[str] = None
    allowance_period: Optional[str] = None
    is_allowance_disclosed: Optional[bool] = None
    responsibilities: Optional[str] = None
    projects: Optional[str] = None
    interview_process: Optional[str] = None
    interview_tips: Optional[str] = None
    interview_difficulty: Optional[int] = None
    mentorship_rating: Optional[int] = None
    culture_rating: Optional[int] = None
    overall_rating: Optional[int] = None
    pros: Optional[str] = None
    challenges: Optional[str] = None
    advice: Optional[str] = None
    anonymous_display: Optional[bool] = None
    status: Optional[str] = None
    technology_ids: Optional[List[str]] = None
    media: Optional[List[MediaItem]] = None

class ExperienceAuthor(BaseModel):
    full_name: str
    program: Optional[str] = None
    grad_year: Optional[int] = None
    university_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ExperienceOut(ExperienceBase):
    id: str
    user_id: str
    status: str
    rejection_reason: Optional[str] = None
    views_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    company: Optional[CompanyOut] = None
    author: Optional[ExperienceAuthor] = None
    technologies: List[TechnologyOut] = []
    media: List[MediaOut] = []
    is_bookmarked: bool = False

    model_config = ConfigDict(from_attributes=True)

class ExperienceListResponse(BaseModel):
    items: List[ExperienceOut]
    total: int
    page: int
    size: int
    total_pages: int
