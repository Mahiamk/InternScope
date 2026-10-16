from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class CompanyBrief(BaseModel):
    id: str
    name: str
    slug: str
    logo_url: Optional[str] = None
    industry: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class SeniorFollowUpCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=2000)
    is_anonymous: bool = False

class SeniorFollowUpResponse(BaseModel):
    id: str
    answer_id: str
    user_id: str
    author_name: str
    author_role: str
    is_author: bool = False
    content: str
    is_anonymous: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SeniorAnswerCreate(BaseModel):
    content: str = Field(..., min_length=5, max_length=5000)
    is_anonymous: bool = False

class SeniorAnswerResponse(BaseModel):
    id: str
    question_id: str
    user_id: str
    author_name: str
    author_role: str
    author_program: Optional[str] = None
    is_author: bool = False
    content: str
    is_anonymous: bool
    is_verified_intern: bool = False
    internship_role: Optional[str] = None
    helpful_count: int = 0
    has_voted_helpful: bool = False
    follow_ups: List[SeniorFollowUpResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SeniorQuestionCreate(BaseModel):
    company_id: str
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10, max_length=5000)
    category: str = Field("INTERVIEWS", pattern="^(INTERVIEWS|DAILY_TASKS|APPLICATION_PROCESS|CULTURE_BENEFITS|GENERAL)$")
    is_anonymous: bool = False
    is_private: bool = False

class SeniorQuestionResponse(BaseModel):
    id: str
    company_id: str
    company: CompanyBrief
    user_id: str
    author_name: str
    author_program: Optional[str] = None
    is_author: bool = False
    title: str
    content: str
    category: str
    is_anonymous: bool
    is_private: bool
    status: str
    answers_count: int = 0
    created_at: datetime
    answers: Optional[List[SeniorAnswerResponse]] = None

    model_config = ConfigDict(from_attributes=True)

class SeniorQuestionListResponse(BaseModel):
    items: List[SeniorQuestionResponse]
    total: int
    can_answer_company_ids: List[str] = []
