from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class CommunityGroupCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    platform: str = Field(..., pattern="^(TELEGRAM|WHATSAPP)$")
    category: str = Field(..., pattern="^(OFFICIAL|FACULTY_TECH|FACULTY_BUSINESS|REGIONAL_KL_PENANG|PEER_STUDY|GENERAL)$")
    description: str = Field(..., min_length=5, max_length=1000)
    invite_url: str = Field(..., min_length=5, max_length=500)
    member_count: int = Field(50, ge=1)
    is_official: bool = False
    icon_type: str = Field("chat", max_length=50)

class CommunityGroupResponse(BaseModel):
    id: str
    name: str
    platform: str # 'TELEGRAM' | 'WHATSAPP'
    category: str
    description: str
    invite_url: str
    member_count: int
    is_official: bool
    icon_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CommunityReplyCreate(BaseModel):
    content: str = Field(..., min_length=2, max_length=2000)

class CommunityReplyResponse(BaseModel):
    id: str
    post_id: str
    user_id: str
    author_name: str
    author_program: Optional[str] = None
    author_role: str = "student"
    is_author: bool = False
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CommunityPostCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    content: str = Field(..., min_length=10, max_length=5000)
    category: str = Field("GENERAL", pattern="^(GENERAL|JOB_LEADS|ACCOMMODATION|INTERVIEW_PREP|ACADEMIC_LOGBOOK)$")

class CommunityPostResponse(BaseModel):
    id: str
    user_id: str
    author_name: str
    author_program: Optional[str] = None
    author_role: str = "student"
    is_author: bool = False
    title: str
    content: str
    category: str
    is_pinned: bool = False
    upvotes_count: int = 0
    has_upvoted: bool = False
    replies_count: int = 0
    created_at: datetime
    replies: Optional[List[CommunityReplyResponse]] = None

    model_config = ConfigDict(from_attributes=True)

class CommunityFeedResponse(BaseModel):
    posts: List[CommunityPostResponse]
    groups: List[CommunityGroupResponse]
    total_posts: int
