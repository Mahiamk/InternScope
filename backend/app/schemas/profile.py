from datetime import date, datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict, field_validator, HttpUrl

ProficiencyLevel = Literal["beginner", "intermediate", "advanced", "expert"]

class SkillItem(BaseModel):
    name: str
    category: Optional[str] = "Other" # e.g. Programming Languages, Frameworks, Databases, Data/AI, Cloud/DevOps
    proficiency: Optional[str] = "intermediate" # beginner, intermediate, advanced, expert

    model_config = ConfigDict(extra="ignore")

class StudentProfileBase(BaseModel):
    preferred_name: Optional[str] = None
    university_name: Optional[str] = None
    degree_level: Optional[str] = None # e.g. Bachelor's, Master's, Diploma
    field_of_study: Optional[str] = None # e.g. Computer Science, Business Administration
    year_of_study: Optional[int] = None # 1, 2, 3, 4
    grad_year: Optional[int] = None
    training_start_date: Optional[date] = None
    preferred_training_period: Optional[str] = None

    skills: List[SkillItem] = []
    preferred_roles: List[str] = []
    preferred_industries: List[str] = []
    preferred_technologies: List[str] = []
    career_goals: Optional[str] = None

    preferred_locations: List[str] = []
    work_arrangements: List[str] = []
    preferred_duration_weeks: Optional[int] = None
    min_allowance: Optional[float] = None
    availability_status: str = "AVAILABLE"

    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("training_start_date", mode="before")
    @classmethod
    def parse_empty_date(cls, v):
        if v == "" or v is None:
            return None
        return v

class StudentProfileUpdate(BaseModel):
    preferred_name: Optional[str] = None
    university_name: Optional[str] = None
    degree_level: Optional[str] = None
    field_of_study: Optional[str] = None
    year_of_study: Optional[int] = None
    grad_year: Optional[int] = None
    training_start_date: Optional[date] = None
    preferred_training_period: Optional[str] = None

    skills: Optional[List[SkillItem]] = None
    preferred_roles: Optional[List[str]] = None
    preferred_industries: Optional[List[str]] = None
    preferred_technologies: Optional[List[str]] = None
    career_goals: Optional[str] = None

    preferred_locations: Optional[List[str]] = None
    work_arrangements: Optional[List[str]] = None
    preferred_duration_weeks: Optional[int] = None
    min_allowance: Optional[float] = None
    availability_status: Optional[str] = None

    bio: Optional[str] = None
    portfolio_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None

    is_completed: Optional[bool] = None

    model_config = ConfigDict(extra="ignore")

    @field_validator("training_start_date", mode="before")
    @classmethod
    def parse_empty_date(cls, v):
        if v == "" or v is None:
            return None
        return v

class ProfileCompletionOut(BaseModel):
    is_completed: bool
    percentage: int # 0 to 100
    missing_fields: List[str]
    completed_fields: List[str]
    next_step: Optional[str] = None

class StudentProfileOut(StudentProfileBase):
    id: str
    user_id: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    completion: Optional[ProfileCompletionOut] = None

    model_config = ConfigDict(from_attributes=True, extra="ignore")
