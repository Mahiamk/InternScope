from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field

# --- Moderation Action Schemas ---
class ModerationActionCreate(BaseModel):
    action: str  # 'APPROVE', 'REJECT', 'REQUEST_CORRECTIONS', 'FLAG', 'DELETE', 'RESOLVE_REPORT'
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None

class ModerationActionOut(BaseModel):
    id: str
    moderator_user_id: Optional[str] = None
    moderator_name: Optional[str] = None
    target_type: str
    target_id: str
    action: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    meta_data: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Overview & Metrics Schemas ---
class AdminDashboardMetrics(BaseModel):
    total_users: int
    active_users: int
    pending_experiences: int
    published_experiences: int
    rejected_experiences: int
    corrections_needed_experiences: int
    total_companies: int
    verified_companies: int
    archived_companies: int
    total_opportunities: int
    active_opportunities: int
    expiring_soon_opportunities: int
    open_reports: int
    under_review_reports: int
    resolved_reports: int
    total_applications_tracked: int
    total_bookmarks: int
    new_users_7d: int
    new_experiences_7d: int
    new_reports_7d: int
    recent_actions: List[Dict[str, Any]] = []

# --- Reports Lifecycle Schemas ---
class ReportItemDetail(BaseModel):
    id: str
    reporter_id: Optional[str] = None
    reporter_name: Optional[str] = None
    reason: str
    details: Optional[str] = None
    created_at: datetime

class GroupedReportOut(BaseModel):
    target_type: str  # 'EXPERIENCE', 'COMMENT', 'COMPANY', 'OPPORTUNITY', 'QUESTION', 'ANSWER'
    target_id: str
    target_title: Optional[str] = None
    target_subtitle: Optional[str] = None
    status: str  # 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
    severity: str  # 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'
    report_count: int
    reasons: List[str]
    first_reported_at: datetime
    latest_reported_at: datetime
    assigned_moderator_id: Optional[str] = None
    assigned_moderator_name: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    reports: List[ReportItemDetail] = []

class ReportLifecycleUpdate(BaseModel):
    status: str  # 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
    severity: Optional[str] = None  # 'LOW', 'NORMAL', 'HIGH', 'CRITICAL'
    assigned_moderator_id: Optional[str] = None
    resolution_notes: Optional[str] = None
    action_taken: Optional[str] = None  # 'NONE', 'CONTENT_HIDDEN', 'CONTENT_EDITED', 'USER_WARNED', 'USER_SUSPENDED'

# --- Company Management & Merge Schemas ---
class AdminCompanyOut(BaseModel):
    id: str
    name: str
    slug: str
    industry: str
    headquarters: str
    website: Optional[str] = None
    careers_url: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    is_verified: bool
    is_archived: bool
    created_at: datetime
    experiences_count: int = 0
    opportunities_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class CompanyCreateAdmin(BaseModel):
    name: str
    industry: str
    headquarters: str
    website: Optional[str] = None
    careers_url: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    is_verified: bool = False

class CompanyUpdateAdmin(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    headquarters: Optional[str] = None
    website: Optional[str] = None
    careers_url: Optional[str] = None
    domain: Optional[str] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    is_verified: Optional[bool] = None
    is_archived: Optional[bool] = None

class CompanyImpactOut(BaseModel):
    company_id: str
    name: str
    experiences_count: int
    opportunities_count: int
    bookmarks_count: int
    questions_count: int

class CompanyMergeRequest(BaseModel):
    source_company_id: str
    target_company_id: str
    archive_source: bool = True

# --- Data Quality Schemas ---
class DataQualityItem(BaseModel):
    id: str
    name: str
    issue: str
    issue_type: str  # 'MISSING_WEBSITE', 'MISSING_LOGO', 'EXPIRED_OPEN_OPP', 'POSSIBLE_DUPLICATE'
    details: Optional[str] = None

class DataQualityReportOut(BaseModel):
    missing_websites_count: int
    missing_logos_count: int
    expired_open_opportunities_count: int
    possible_duplicates_count: int
    unverified_companies_count: int
    items: List[DataQualityItem] = []

# --- User Management Schemas ---
class AdminUserDetail(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    program: Optional[str] = None
    grad_year: Optional[int] = None
    is_verified: bool
    is_active: bool
    avatar_url: Optional[str] = None
    suspension_reason: Optional[str] = None
    created_at: datetime
    experiences_count: int = 0
    questions_count: int = 0
    answers_count: int = 0
    applications_count: int = 0
    reports_received_count: int = 0

    model_config = ConfigDict(from_attributes=True)

class UserRoleUpdate(BaseModel):
    role: str  # 'student', 'moderator', 'admin'

class UserStatusUpdate(BaseModel):
    is_active: bool
    suspension_reason: Optional[str] = None

# --- Analytics Schemas ---
class AllowanceDistribution(BaseModel):
    sample_size: int
    currency: str = "MYR"
    min: Optional[float] = None
    max: Optional[float] = None
    median: Optional[float] = None
    p25: Optional[float] = None
    p75: Optional[float] = None
    disclaimer: str = "Figures reflect self-reported student disclosures for research transparency, not audited employer payroll data."

class AdminAnalyticsOut(BaseModel):
    reports_by_industry: Dict[str, int] = {}
    top_companies_by_reports: List[Dict[str, Any]] = []
    top_roles_by_reports: List[Dict[str, Any]] = []
    application_status_breakdown: Dict[str, int] = {}
    total_saved_bookmarks: int = 0
    allowance_distribution: AllowanceDistribution
    moderation_stats: Dict[str, Any] = {}

# --- System Settings Schemas ---
class SystemSettingsOut(BaseModel):
    require_experience_approval: bool = True
    allow_student_registrations: bool = True
    allow_anonymous_reports: bool = True
    maintenance_mode: bool = False
    announcement_banner: Optional[str] = None
    primary_university: str = "Albukhary International University (AIU)"
    version: str = "1.0.0"

class SystemSettingsUpdate(BaseModel):
    require_experience_approval: Optional[bool] = None
    allow_student_registrations: Optional[bool] = None
    allow_anonymous_reports: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    announcement_banner: Optional[str] = None
