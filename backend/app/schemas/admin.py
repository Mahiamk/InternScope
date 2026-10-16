from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.schemas.experience import ExperienceOut
from app.schemas.interaction import ContentReportOut

class ModerationActionCreate(BaseModel):
    action: str # 'APPROVE', 'REJECT', 'FLAG', 'DELETE', 'RESOLVE_REPORT'
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class ModerationActionOut(BaseModel):
    id: str
    moderator_user_id: Optional[str] = None
    target_type: str
    target_id: str
    action: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminDashboardMetrics(BaseModel):
    total_users: int
    pending_experiences: int
    published_experiences: int
    total_companies: int
    total_opportunities: int
    open_reports: int
