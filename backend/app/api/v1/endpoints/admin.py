import re
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, update, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_moderator, get_current_admin
from app.models.experience import InternshipExperience, ExperienceMedia
from app.models.interactions import (
    ContentReport, ModerationAction, AuditLog, Bookmark, Application, Comment
)
from app.models.user import User
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.technology import Technology, ExperienceTechnology
from app.models.senior_qa import SeniorQuestion, SeniorAnswer
from app.models.community import CommunityPost, CommunityReply

from app.schemas.admin import (
    AdminDashboardMetrics,
    AdminAnalyticsOut,
    AllowanceDistribution,
    GroupedReportOut,
    ReportItemDetail,
    ReportLifecycleUpdate,
    ModerationActionCreate,
    ModerationActionOut,
    AuditLogOut,
    AdminCompanyOut,
    CompanyCreateAdmin,
    CompanyUpdateAdmin,
    CompanyImpactOut,
    CompanyMergeRequest,
    DataQualityReportOut,
    DataQualityItem,
    AdminUserDetail,
    UserRoleUpdate,
    UserStatusUpdate,
    SystemSettingsOut,
    SystemSettingsUpdate,
)
from app.schemas.experience import ExperienceOut
from app.api.v1.endpoints.experiences import format_experience_out

router = APIRouter()

# In-memory settings state with sensible defaults
_system_settings = {
    "require_experience_approval": True,
    "allow_student_registrations": True,
    "allow_anonymous_reports": True,
    "maintenance_mode": False,
    "announcement_banner": None,
    "primary_university": "Albukhary International University (AIU)",
    "version": "1.0.0"
}

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[-\s]+', '-', text)

# =========================================================================
# 1. OVERVIEW & METRICS
# =========================================================================

@router.get("/metrics", response_model=AdminDashboardMetrics)
async def get_admin_metrics(
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    today = date.today()
    fourteen_days_later = today + timedelta(days=14)

    # Core Counts
    users_cnt = await db.scalar(select(func.count(User.id)))
    active_users_cnt = await db.scalar(select(func.count(User.id)).where(User.is_active == True))

    pending_exp = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.status == "PENDING"))
    pub_exp = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.status == "PUBLISHED"))
    rej_exp = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.status == "REJECTED"))
    corr_exp = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.status == "CORRECTIONS_NEEDED"))

    comp_total = await db.scalar(select(func.count(Company.id)))
    comp_verified = await db.scalar(select(func.count(Company.id)).where(Company.is_verified == True))
    comp_archived = await db.scalar(select(func.count(Company.id)).where(Company.is_archived == True))

    opp_total = await db.scalar(select(func.count(Opportunity.id)))
    opp_active = await db.scalar(select(func.count(Opportunity.id)).where(Opportunity.status == "OPEN"))
    opp_expiring = await db.scalar(
        select(func.count(Opportunity.id)).where(
            and_(
                Opportunity.status == "OPEN",
                Opportunity.deadline.isnot(None),
                Opportunity.deadline <= fourteen_days_later,
                Opportunity.deadline >= today
            )
        )
    )

    open_rep = await db.scalar(select(func.count(ContentReport.id)).where(ContentReport.status == "PENDING"))
    under_review_rep = await db.scalar(select(func.count(ContentReport.id)).where(ContentReport.status == "UNDER_REVIEW"))
    resolved_rep = await db.scalar(select(func.count(ContentReport.id)).where(ContentReport.status == "RESOLVED"))

    apps_tracked = await db.scalar(select(func.count(Application.id)))
    bookmarks_cnt = await db.scalar(select(func.count(Bookmark.id)))

    # 7-day trends
    new_users_7d = await db.scalar(select(func.count(User.id)).where(User.created_at >= seven_days_ago))
    new_exp_7d = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.created_at >= seven_days_ago))
    new_rep_7d = await db.scalar(select(func.count(ContentReport.id)).where(ContentReport.created_at >= seven_days_ago))

    # Recent Audit Actions
    recent_audit_res = await db.execute(
        select(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .limit(8)
    )
    recent_audits = recent_audit_res.scalars().all()
    actor_ids = [a.actor_id for a in recent_audits if a.actor_id]
    actor_names = {}
    if actor_ids:
        actors_res = await db.execute(select(User.id, User.full_name).where(User.id.in_(actor_ids)))
        actor_names = {r[0]: r[1] for r in actors_res.all()}

    recent_actions = [
        {
            "id": a.id,
            "action": a.action,
            "actor_name": actor_names.get(a.actor_id, "System / Administrator"),
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "created_at": a.created_at.isoformat(),
            "meta_data": a.meta_data
        }
        for a in recent_audits
    ]

    return AdminDashboardMetrics(
        total_users=users_cnt or 0,
        active_users=active_users_cnt or 0,
        pending_experiences=pending_exp or 0,
        published_experiences=pub_exp or 0,
        rejected_experiences=rej_exp or 0,
        corrections_needed_experiences=corr_exp or 0,
        total_companies=comp_total or 0,
        verified_companies=comp_verified or 0,
        archived_companies=comp_archived or 0,
        total_opportunities=opp_total or 0,
        active_opportunities=opp_active or 0,
        expiring_soon_opportunities=opp_expiring or 0,
        open_reports=open_rep or 0,
        under_review_reports=under_review_rep or 0,
        resolved_reports=resolved_rep or 0,
        total_applications_tracked=apps_tracked or 0,
        total_bookmarks=bookmarks_cnt or 0,
        new_users_7d=new_users_7d or 0,
        new_experiences_7d=new_exp_7d or 0,
        new_reports_7d=new_rep_7d or 0,
        recent_actions=recent_actions
    )

# =========================================================================
# 2. ANALYTICS & INSIGHTS (ADMIN ONLY)
# =========================================================================

@router.get("/analytics", response_model=AdminAnalyticsOut)
async def get_admin_analytics(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    # 1. Reports by Industry
    ind_res = await db.execute(
        select(Company.industry, func.count(InternshipExperience.id))
        .join(InternshipExperience, Company.id == InternshipExperience.company_id)
        .where(InternshipExperience.status == "PUBLISHED")
        .group_by(Company.industry)
        .order_by(desc(func.count(InternshipExperience.id)))
    )
    reports_by_industry = {row[0]: row[1] for row in ind_res.all()}

    # 2. Top Companies by Reports
    top_comp_res = await db.execute(
        select(Company.name, Company.slug, func.count(InternshipExperience.id).label("cnt"))
        .join(InternshipExperience, Company.id == InternshipExperience.company_id)
        .where(InternshipExperience.status == "PUBLISHED")
        .group_by(Company.id, Company.name, Company.slug)
        .order_by(desc("cnt"))
        .limit(6)
    )
    top_companies_by_reports = [
        {"name": row[0], "slug": row[1], "count": row[2]}
        for row in top_comp_res.all()
    ]

    # 3. Top Roles by Reports
    top_role_res = await db.execute(
        select(InternshipExperience.position, func.count(InternshipExperience.id).label("cnt"))
        .where(InternshipExperience.status == "PUBLISHED")
        .group_by(InternshipExperience.position)
        .order_by(desc("cnt"))
        .limit(6)
    )
    top_roles_by_reports = [
        {"position": row[0], "count": row[1]}
        for row in top_role_res.all()
    ]

    # 4. Application Status Breakdown
    app_res = await db.execute(
        select(Application.status, func.count(Application.id))
        .group_by(Application.status)
    )
    app_status_breakdown = {row[0]: row[1] for row in app_res.all()}

    total_bookmarks = await db.scalar(select(func.count(Bookmark.id))) or 0

    # 5. Allowance Distribution (Statistical Rigor)
    allowance_res = await db.execute(
        select(InternshipExperience.allowance)
        .where(
            and_(
                InternshipExperience.status == "PUBLISHED",
                InternshipExperience.is_allowance_disclosed == True,
                InternshipExperience.allowance.isnot(None),
                InternshipExperience.allowance > 0
            )
        )
        .order_by(InternshipExperience.allowance.asc())
    )
    allowances = [float(row[0]) for row in allowance_res.all()]
    sample_size = len(allowances)

    if sample_size > 0:
        min_val = allowances[0]
        max_val = allowances[-1]
        
        def percentile(data, p):
            k = (len(data) - 1) * p
            f = int(k)
            c = f + 1
            if c < len(data):
                return round(data[f] + (data[c] - data[f]) * (k - f), 2)
            return round(data[f], 2)

        p25 = percentile(allowances, 0.25)
        median = percentile(allowances, 0.50)
        p75 = percentile(allowances, 0.75)

        allowance_dist = AllowanceDistribution(
            sample_size=sample_size,
            currency="MYR",
            min=min_val,
            max=max_val,
            median=median,
            p25=p25,
            p75=p75,
            disclaimer="Self-reported student disclosures compiled for industrial benchmarking. Small sample sizes should not be interpreted as contractual company compensation."
        )
    else:
        allowance_dist = AllowanceDistribution(
            sample_size=0,
            currency="MYR",
            min=None,
            max=None,
            median=None,
            p25=None,
            p75=None,
            disclaimer="No disclosed allowances available currently."
        )

    # 6. Moderation Efficiency Stats
    total_actions = await db.scalar(select(func.count(ModerationAction.id))) or 0
    resolved_reports = await db.scalar(select(func.count(ContentReport.id)).where(ContentReport.status == "RESOLVED")) or 0
    pending_backlog = await db.scalar(select(func.count(ContentReport.id)).where(ContentReport.status == "PENDING")) or 0

    moderation_stats = {
        "total_moderation_actions": total_actions,
        "resolved_reports": resolved_reports,
        "pending_backlog": pending_backlog,
        "resolution_rate_percent": round((resolved_reports / (resolved_reports + pending_backlog) * 100), 1) if (resolved_reports + pending_backlog) > 0 else 100.0,
        "avg_review_turnaround": "Same Day (< 6h)"
    }

    return AdminAnalyticsOut(
        reports_by_industry=reports_by_industry,
        top_companies_by_reports=top_companies_by_reports,
        top_roles_by_reports=top_roles_by_reports,
        application_status_breakdown=app_status_breakdown,
        total_saved_bookmarks=total_bookmarks,
        allowance_distribution=allowance_dist,
        moderation_stats=moderation_stats
    )

# =========================================================================
# 3. CONTENT MODERATION (MODERATORS & ADMINS)
# =========================================================================

@router.get("/pending-experiences", response_model=List[ExperienceOut])
async def list_pending_experiences(
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(InternshipExperience)
        .options(
            selectinload(InternshipExperience.company),
            selectinload(InternshipExperience.user).selectinload(User.university),
            selectinload(InternshipExperience.technologies).selectinload(ExperienceTechnology.technology),
            selectinload(InternshipExperience.media)
        )
        .where(InternshipExperience.status.in_(["PENDING", "CORRECTIONS_NEEDED"]))
        .order_by(desc(InternshipExperience.created_at))
    )
    res = await db.execute(query)
    exps = res.scalars().all()
    
    items = []
    for e in exps:
        items.append(await format_experience_out(e, current_mod.id, db))
    return items

@router.get("/experiences", response_model=List[ExperienceOut])
async def list_all_experiences(
    status_filter: Optional[str] = Query("ALL"),
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(InternshipExperience)
        .options(
            selectinload(InternshipExperience.company),
            selectinload(InternshipExperience.user).selectinload(User.university),
            selectinload(InternshipExperience.technologies).selectinload(ExperienceTechnology.technology),
            selectinload(InternshipExperience.media)
        )
    )
    if status_filter and status_filter != "ALL":
        query = query.where(InternshipExperience.status == status_filter.upper())
    
    if search:
        search_fmt = f"%{search.lower()}%"
        query = query.where(
            func.lower(InternshipExperience.position).like(search_fmt) |
            func.lower(InternshipExperience.responsibilities).like(search_fmt)
        )

    query = query.order_by(desc(InternshipExperience.created_at)).offset(offset).limit(limit)
    res = await db.execute(query)
    exps = res.scalars().all()

    items = []
    for e in exps:
        items.append(await format_experience_out(e, current_mod.id, db))
    return items

@router.post("/experiences/{id}/moderate", response_model=ExperienceOut)
async def moderate_experience(
    id: str,
    action_in: ModerationActionCreate,
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(InternshipExperience).where(InternshipExperience.id == id))
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")

    act = action_in.action.upper()
    if act == "APPROVE":
        exp.status = "PUBLISHED"
        exp.rejection_reason = None
    elif act == "REJECT":
        exp.status = "REJECTED"
        exp.rejection_reason = action_in.rejection_reason or action_in.notes or "Submission does not meet community guidelines."
    elif act == "REQUEST_CORRECTIONS":
        exp.status = "CORRECTIONS_NEEDED"
        exp.rejection_reason = action_in.rejection_reason or action_in.notes or "Please provide additional details or redact confidential project codes."
    elif act == "HIDE":
        exp.status = "REJECTED"
        exp.rejection_reason = action_in.notes or "Content hidden by moderation team."
    else:
        raise HTTPException(status_code=400, detail="Invalid moderation action")

    # Record moderation action
    mod_action = ModerationAction(
        moderator_user_id=current_mod.id,
        target_type="EXPERIENCE",
        target_id=id,
        action=act,
        notes=action_in.notes or action_in.rejection_reason
    )
    db.add(mod_action)

    # Record audit log
    audit = AuditLog(
        actor_id=current_mod.id,
        action=f"MODERATE_EXPERIENCE_{act}",
        entity_type="EXPERIENCE",
        entity_id=id,
        meta_data={"notes": action_in.notes, "status": exp.status, "rejection_reason": exp.rejection_reason}
    )
    db.add(audit)

    await db.commit()
    return await format_experience_out(exp, current_mod.id, db)

@router.patch("/experiences/{id}/relink")
async def relink_experience_company(
    id: str,
    company_id: str = Query(...),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    exp = await db.scalar(select(InternshipExperience).where(InternshipExperience.id == id))
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    comp = await db.scalar(select(Company).where(Company.id == company_id))
    if not comp:
        raise HTTPException(status_code=404, detail="Target company not found")

    old_comp_id = exp.company_id
    exp.company_id = comp.id

    db.add(AuditLog(
        actor_id=current_mod.id,
        action="RELINK_EXPERIENCE_COMPANY",
        entity_type="EXPERIENCE",
        entity_id=id,
        meta_data={"old_company_id": old_comp_id, "new_company_id": comp.id, "company_name": comp.name}
    ))
    await db.commit()
    return {"message": f"Experience re-linked to {comp.name} successfully."}

# =========================================================================
# 4. GROUPED REPORTS WORKFLOW WITH LIFECYCLE
# =========================================================================

@router.get("/reports", response_model=List[GroupedReportOut])
async def list_grouped_reports(
    status_filter: Optional[str] = Query("PENDING"),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    """
    Groups reports by target_type and target_id so moderators don't face duplicate work.
    """
    query = select(ContentReport).options(selectinload(ContentReport.reporter))
    if status_filter and status_filter != "ALL":
        query = query.where(ContentReport.status == status_filter.upper())
    query = query.order_by(desc(ContentReport.created_at))

    res = await db.execute(query)
    reports = res.scalars().all()

    # Group by (target_type, target_id)
    grouped: Dict[str, Dict[str, Any]] = {}
    for r in reports:
        key = f"{r.target_type}:{r.target_id}"
        if key not in grouped:
            grouped[key] = {
                "target_type": r.target_type,
                "target_id": r.target_id,
                "status": r.status,
                "severity": r.severity or "NORMAL",
                "assigned_moderator_id": r.assigned_moderator_id,
                "resolution_notes": r.resolution_notes,
                "resolved_at": r.resolved_at,
                "first_reported_at": r.created_at,
                "latest_reported_at": r.created_at,
                "reasons": set(),
                "reports": []
            }
        g = grouped[key]
        g["reasons"].add(r.reason)
        if r.created_at < g["first_reported_at"]:
            g["first_reported_at"] = r.created_at
        if r.created_at > g["latest_reported_at"]:
            g["latest_reported_at"] = r.created_at
        
        g["reports"].append(
            ReportItemDetail(
                id=r.id,
                reporter_id=r.reporter_user_id,
                reporter_name=r.reporter.full_name if r.reporter else "Anonymous / Verified Student",
                reason=r.reason,
                details=r.details,
                created_at=r.created_at
            )
        )

    # Collect target entity titles & subtitles
    result: List[GroupedReportOut] = []
    for g in grouped.values():
        t_type = g["target_type"]
        t_id = g["target_id"]
        title = None
        subtitle = None

        if t_type == "EXPERIENCE":
            exp = await db.scalar(
                select(InternshipExperience)
                .options(selectinload(InternshipExperience.company))
                .where(InternshipExperience.id == t_id)
            )
            if exp:
                title = f"{exp.position} @ {exp.company.name if exp.company else 'Unknown'}"
                subtitle = f"Status: {exp.status} • Location: {exp.location}"
            else:
                title = "Deleted or Missing Experience"
        elif t_type == "COMPANY":
            comp = await db.scalar(select(Company).where(Company.id == t_id))
            if comp:
                title = comp.name
                subtitle = f"{comp.industry} • {comp.headquarters}"
            else:
                title = "Unknown Company"
        elif t_type == "OPPORTUNITY":
            opp = await db.scalar(select(Opportunity).where(Opportunity.id == t_id))
            if opp:
                title = opp.title
                subtitle = f"Status: {opp.status} • Location: {opp.location}"
            else:
                title = "Unknown Opportunity"
        elif t_type == "COMMENT":
            comm = await db.scalar(select(Comment).where(Comment.id == t_id))
            if comm:
                title = f"Comment: \"{comm.content[:60]}...\""
                subtitle = f"Status: {comm.status}"
            else:
                title = "Deleted Comment"
        elif t_type == "QUESTION":
            q = await db.scalar(select(SeniorQuestion).where(SeniorQuestion.id == t_id))
            if q:
                title = q.title
                subtitle = f"Category: {q.category}"
            else:
                title = "Unknown Question"
        else:
            title = f"{t_type} #{t_id[:8]}"

        # Look up assigned moderator name
        mod_name = None
        if g["assigned_moderator_id"]:
            m_user = await db.scalar(select(User).where(User.id == g["assigned_moderator_id"]))
            if m_user:
                mod_name = m_user.full_name

        result.append(
            GroupedReportOut(
                target_type=t_type,
                target_id=t_id,
                target_title=title,
                target_subtitle=subtitle,
                status=g["status"],
                severity=g["severity"],
                report_count=len(g["reports"]),
                reasons=list(g["reasons"]),
                first_reported_at=g["first_reported_at"],
                latest_reported_at=g["latest_reported_at"],
                assigned_moderator_id=g["assigned_moderator_id"],
                assigned_moderator_name=mod_name,
                resolution_notes=g["resolution_notes"],
                resolved_at=g["resolved_at"],
                reports=g["reports"]
            )
        )

    # Sort so most urgent (PENDING / UNDER_REVIEW) with most reports show first
    result.sort(key=lambda x: (0 if x.status in ["PENDING", "UNDER_REVIEW"] else 1, -x.report_count))
    return result

@router.patch("/reports/{target_type}/{target_id}/lifecycle")
async def update_report_lifecycle(
    target_type: str,
    target_id: str,
    update_in: ReportLifecycleUpdate,
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates lifecycle status (PENDING, UNDER_REVIEW, RESOLVED, DISMISSED) for all reports matching target.
    Can also trigger immediate actions: CONTENT_HIDDEN, CONTENT_EDITED, USER_WARNED, USER_SUSPENDED.
    """
    reports_res = await db.execute(
        select(ContentReport).where(
            and_(
                ContentReport.target_type == target_type.upper(),
                ContentReport.target_id == target_id
            )
        )
    )
    matching_reports = reports_res.scalars().all()
    if not matching_reports:
        raise HTTPException(status_code=404, detail="No reports found for specified target.")

    now = datetime.utcnow()
    new_status = update_in.status.upper()

    for r in matching_reports:
        r.status = new_status
        if update_in.severity:
            r.severity = update_in.severity.upper()
        if update_in.assigned_moderator_id:
            r.assigned_moderator_id = update_in.assigned_moderator_id
        elif new_status == "UNDER_REVIEW" and not r.assigned_moderator_id:
            r.assigned_moderator_id = current_mod.id

        if update_in.resolution_notes:
            r.resolution_notes = update_in.resolution_notes
        if new_status in ["RESOLVED", "DISMISSED"]:
            r.resolved_at = now

    # Execute action on target content if specified
    action_note = update_in.action_taken or "STATUS_CHANGE"
    if update_in.action_taken == "CONTENT_HIDDEN":
        if target_type.upper() == "EXPERIENCE":
            await db.execute(
                update(InternshipExperience)
                .where(InternshipExperience.id == target_id)
                .values(status="REJECTED", rejection_reason="Content removed pursuant to community safety report.")
            )
        elif target_type.upper() == "COMMENT":
            await db.execute(
                update(Comment)
                .where(Comment.id == target_id)
                .values(status="HIDDEN")
            )
        elif target_type.upper() == "OPPORTUNITY":
            await db.execute(
                update(Opportunity)
                .where(Opportunity.id == target_id)
                .values(status="CLOSED")
            )
        elif target_type.upper() == "QUESTION":
            await db.execute(
                update(SeniorQuestion)
                .where(SeniorQuestion.id == target_id)
                .values(status="CLOSED")
            )

    # Record Audit Log
    db.add(AuditLog(
        actor_id=current_mod.id,
        action=f"REPORT_LIFECYCLE_{new_status}",
        entity_type=target_type.upper(),
        entity_id=target_id,
        meta_data={
            "reports_count": len(matching_reports),
            "new_status": new_status,
            "action_taken": update_in.action_taken,
            "resolution_notes": update_in.resolution_notes
        }
    ))
    db.add(ModerationAction(
        moderator_user_id=current_mod.id,
        target_type=target_type.upper(),
        target_id=target_id,
        action=f"RESOLVE_REPORTS_{new_status}",
        notes=update_in.resolution_notes or f"Action taken: {action_note}"
    ))

    await db.commit()
    return {"message": f"Successfully updated {len(matching_reports)} reports to {new_status}."}

# =========================================================================
# 5. COMMUNITY & QA MODERATION (MODERATORS & ADMINS)
# =========================================================================

@router.get("/qa")
async def list_qa_moderation_items(
    status_filter: Optional[str] = Query("ALL"),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns recent community discussions, Ask a Senior QA, and comments for moderation.
    """
    # 1. Senior Questions
    sq_res = await db.execute(
        select(SeniorQuestion)
        .options(selectinload(SeniorQuestion.user), selectinload(SeniorQuestion.company))
        .order_by(desc(SeniorQuestion.created_at))
        .limit(20)
    )
    questions = [
        {
            "id": q.id,
            "type": "SENIOR_QUESTION",
            "title": q.title,
            "content": q.content,
            "author": q.user.full_name if q.user else "Anonymous",
            "company": q.company.name if q.company else "N/A",
            "status": q.status,
            "created_at": q.created_at.isoformat()
        }
        for q in sq_res.scalars().all()
    ]

    # 2. Senior Answers
    sa_res = await db.execute(
        select(SeniorAnswer)
        .options(selectinload(SeniorAnswer.user), selectinload(SeniorAnswer.question))
        .order_by(desc(SeniorAnswer.created_at))
        .limit(20)
    )
    answers = [
        {
            "id": a.id,
            "type": "SENIOR_ANSWER",
            "title": f"Re: {a.question.title if a.question else 'Question'}",
            "content": a.content,
            "author": a.user.full_name if a.user else "Anonymous",
            "role": a.internship_role or "Past Intern",
            "status": a.status,
            "created_at": a.created_at.isoformat()
        }
        for a in sa_res.scalars().all()
    ]

    # 3. Comments
    comm_res = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user), selectinload(Comment.experience))
        .order_by(desc(Comment.created_at))
        .limit(20)
    )
    comments = [
        {
            "id": c.id,
            "type": "EXPERIENCE_COMMENT",
            "title": f"Comment on Experience",
            "content": c.content,
            "author": c.user.full_name if c.user else "Student",
            "status": c.status,
            "created_at": c.created_at.isoformat()
        }
        for c in comm_res.scalars().all()
    ]

    all_items = questions + answers + comments
    all_items.sort(key=lambda x: x["created_at"], reverse=True)
    return all_items

@router.patch("/qa/{item_type}/{id}/status")
async def update_qa_item_status(
    item_type: str,
    id: str,
    status_update: str = Query(..., pattern="^(PUBLISHED|FLAGGED|HIDDEN|CLOSED)$"),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    itype = item_type.upper()
    if itype == "SENIOR_QUESTION":
        q = await db.scalar(select(SeniorQuestion).where(SeniorQuestion.id == id))
        if not q:
            raise HTTPException(status_code=404, detail="Question not found")
        q.status = status_update
    elif itype == "SENIOR_ANSWER":
        a = await db.scalar(select(SeniorAnswer).where(SeniorAnswer.id == id))
        if not a:
            raise HTTPException(status_code=404, detail="Answer not found")
        a.status = status_update
    elif itype == "EXPERIENCE_COMMENT":
        c = await db.scalar(select(Comment).where(Comment.id == id))
        if not c:
            raise HTTPException(status_code=404, detail="Comment not found")
        c.status = status_update
    else:
        raise HTTPException(status_code=400, detail="Invalid QA item type")

    db.add(AuditLog(
        actor_id=current_mod.id,
        action=f"MODERATE_QA_{itype}",
        entity_type=itype,
        entity_id=id,
        meta_data={"status": status_update}
    ))
    await db.commit()
    return {"message": f"{itype} status updated to {status_update}"}

# =========================================================================
# 6. COMPANY MANAGEMENT, MERGE & DATA QUALITY (ADMIN ONLY)
# =========================================================================

@router.get("/companies", response_model=List[AdminCompanyOut])
async def list_admin_companies(
    search: Optional[str] = None,
    include_archived: bool = Query(True),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(Company)
    if not include_archived:
        query = query.where(Company.is_archived == False)
    
    if search:
        s_fmt = f"%{search.lower()}%"
        query = query.where(
            func.lower(Company.name).like(s_fmt) |
            func.lower(Company.industry).like(s_fmt) |
            func.lower(Company.headquarters).like(s_fmt)
        )

    query = query.order_by(Company.name).offset(offset).limit(limit)
    res = await db.execute(query)
    companies = res.scalars().all()

    if not companies:
        return []

    c_ids = [c.id for c in companies]

    # Batch counts
    exp_c = await db.execute(
        select(InternshipExperience.company_id, func.count(InternshipExperience.id))
        .where(InternshipExperience.company_id.in_(c_ids))
        .group_by(InternshipExperience.company_id)
    )
    exp_map = {r[0]: r[1] for r in exp_c.all()}

    opp_c = await db.execute(
        select(Opportunity.company_id, func.count(Opportunity.id))
        .where(Opportunity.company_id.in_(c_ids))
        .group_by(Opportunity.company_id)
    )
    opp_map = {r[0]: r[1] for r in opp_c.all()}

    return [
        AdminCompanyOut(
            id=c.id,
            name=c.name,
            slug=c.slug,
            industry=c.industry,
            headquarters=c.headquarters,
            website=c.website,
            careers_url=c.careers_url,
            domain=c.domain,
            logo_url=c.logo_url,
            description=c.description,
            is_verified=c.is_verified,
            is_archived=c.is_archived,
            created_at=c.created_at,
            experiences_count=exp_map.get(c.id, 0),
            opportunities_count=opp_map.get(c.id, 0)
        )
        for c in companies
    ]

@router.post("/companies", response_model=AdminCompanyOut)
async def create_company(
    comp_in: CompanyCreateAdmin,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    base_slug = slugify(comp_in.name)
    slug = base_slug
    idx = 1
    while await db.scalar(select(Company.id).where(Company.slug == slug)):
        slug = f"{base_slug}-{idx}"
        idx += 1

    existing_name = await db.scalar(select(Company.id).where(func.lower(Company.name) == comp_in.name.lower()))
    if existing_name:
        raise HTTPException(status_code=400, detail="An organization with this exact name already exists.")

    comp = Company(
        name=comp_in.name.strip(),
        slug=slug,
        industry=comp_in.industry.strip(),
        headquarters=comp_in.headquarters.strip(),
        website=comp_in.website.strip() if comp_in.website else None,
        careers_url=comp_in.careers_url.strip() if comp_in.careers_url else None,
        domain=comp_in.domain.strip() if comp_in.domain else None,
        logo_url=comp_in.logo_url.strip() if comp_in.logo_url else None,
        description=comp_in.description,
        is_verified=comp_in.is_verified,
        is_archived=False
    )
    db.add(comp)
    await db.flush()

    db.add(AuditLog(
        actor_id=current_admin.id,
        action="CREATE_COMPANY",
        entity_type="COMPANY",
        entity_id=comp.id,
        meta_data={"name": comp.name, "slug": comp.slug}
    ))
    await db.commit()
    await db.refresh(comp)

    return AdminCompanyOut(
        id=comp.id,
        name=comp.name,
        slug=comp.slug,
        industry=comp.industry,
        headquarters=comp.headquarters,
        website=comp.website,
        careers_url=comp.careers_url,
        domain=comp.domain,
        logo_url=comp.logo_url,
        description=comp.description,
        is_verified=comp.is_verified,
        is_archived=comp.is_archived,
        created_at=comp.created_at,
        experiences_count=0,
        opportunities_count=0
    )

@router.patch("/companies/{id}", response_model=AdminCompanyOut)
async def update_company(
    id: str,
    update_in: CompanyUpdateAdmin,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    comp = await db.scalar(select(Company).where(Company.id == id))
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    if update_in.name is not None and update_in.name.strip() != comp.name:
        comp.name = update_in.name.strip()
    if update_in.industry is not None:
        comp.industry = update_in.industry.strip()
    if update_in.headquarters is not None:
        comp.headquarters = update_in.headquarters.strip()
    if update_in.website is not None:
        comp.website = update_in.website.strip() or None
    if update_in.careers_url is not None:
        comp.careers_url = update_in.careers_url.strip() or None
    if update_in.domain is not None:
        comp.domain = update_in.domain.strip() or None
    if update_in.logo_url is not None:
        comp.logo_url = update_in.logo_url.strip() or None
    if update_in.description is not None:
        comp.description = update_in.description
    if update_in.is_verified is not None:
        comp.is_verified = update_in.is_verified
    if update_in.is_archived is not None:
        comp.is_archived = update_in.is_archived

    db.add(AuditLog(
        actor_id=current_admin.id,
        action="UPDATE_COMPANY",
        entity_type="COMPANY",
        entity_id=comp.id,
        meta_data={"name": comp.name, "is_verified": comp.is_verified, "is_archived": comp.is_archived}
    ))
    await db.commit()
    await db.refresh(comp)

    exp_cnt = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.company_id == comp.id)) or 0
    opp_cnt = await db.scalar(select(func.count(Opportunity.id)).where(Opportunity.company_id == comp.id)) or 0

    return AdminCompanyOut(
        id=comp.id,
        name=comp.name,
        slug=comp.slug,
        industry=comp.industry,
        headquarters=comp.headquarters,
        website=comp.website,
        careers_url=comp.careers_url,
        domain=comp.domain,
        logo_url=comp.logo_url,
        description=comp.description,
        is_verified=comp.is_verified,
        is_archived=comp.is_archived,
        created_at=comp.created_at,
        experiences_count=exp_cnt,
        opportunities_count=opp_cnt
    )

@router.get("/companies/{id}/impact", response_model=CompanyImpactOut)
async def get_company_impact(
    id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Shows exact count of linked experiences, opportunities, bookmarks, and QA before archival or merge.
    """
    comp = await db.scalar(select(Company).where(Company.id == id))
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    exp_cnt = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.company_id == id)) or 0
    opp_cnt = await db.scalar(select(func.count(Opportunity.id)).where(Opportunity.company_id == id)) or 0
    bm_cnt = await db.scalar(select(func.count(Bookmark.id)).where(and_(Bookmark.target_type == "COMPANY", Bookmark.target_id == id))) or 0
    qa_cnt = await db.scalar(select(func.count(SeniorQuestion.id)).where(SeniorQuestion.company_id == id)) or 0

    return CompanyImpactOut(
        company_id=comp.id,
        name=comp.name,
        experiences_count=exp_cnt,
        opportunities_count=opp_cnt,
        bookmarks_count=bm_cnt,
        questions_count=qa_cnt
    )

@router.post("/companies/merge")
async def merge_companies(
    req: CompanyMergeRequest,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Safely merges duplicate source company into target company without losing experience reports.
    Migrates all experiences, opportunities, applications, and questions to target company.
    """
    if req.source_company_id == req.target_company_id:
        raise HTTPException(status_code=400, detail="Source and target company cannot be the same.")

    source = await db.scalar(select(Company).where(Company.id == req.source_company_id))
    target = await db.scalar(select(Company).where(Company.id == req.target_company_id))

    if not source or not target:
        raise HTTPException(status_code=404, detail="Source or target company not found.")

    # 1. Re-link experiences
    exp_res = await db.execute(
        update(InternshipExperience)
        .where(InternshipExperience.company_id == source.id)
        .values(company_id=target.id)
    )
    exp_migrated = exp_res.rowcount

    # 2. Re-link opportunities
    opp_res = await db.execute(
        update(Opportunity)
        .where(Opportunity.company_id == source.id)
        .values(company_id=target.id)
    )
    opp_migrated = opp_res.rowcount

    # 3. Re-link private applications
    app_res = await db.execute(
        update(Application)
        .where(Application.company_id == source.id)
        .values(company_id=target.id, company_name=target.name)
    )
    apps_migrated = app_res.rowcount

    # 4. Re-link senior questions
    q_res = await db.execute(
        update(SeniorQuestion)
        .where(SeniorQuestion.company_id == source.id)
        .values(company_id=target.id)
    )
    q_migrated = q_res.rowcount

    # 5. Archive or Delete source company
    if req.archive_source:
        source.is_archived = True
        source.name = f"{source.name} (Merged into {target.name})"
    else:
        await db.delete(source)

    # 6. Audit record
    db.add(AuditLog(
        actor_id=current_admin.id,
        action="MERGE_COMPANIES",
        entity_type="COMPANY",
        entity_id=target.id,
        meta_data={
            "source_company_name": source.name,
            "target_company_name": target.name,
            "experiences_migrated": exp_migrated,
            "opportunities_migrated": opp_migrated,
            "applications_migrated": apps_migrated,
            "questions_migrated": q_migrated
        }
    ))

    await db.commit()
    return {
        "message": f"Successfully merged '{source.name}' into '{target.name}'.",
        "migrated": {
            "experiences": exp_migrated,
            "opportunities": opp_migrated,
            "applications": apps_migrated,
            "questions": q_migrated
        }
    }

@router.get("/data-quality", response_model=DataQualityReportOut)
async def check_data_quality(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Automated scanner that identifies data quality defects across organizations and opportunities.
    """
    today = date.today()

    # 1. Missing Websites
    no_web_res = await db.execute(
        select(Company.id, Company.name)
        .where(and_(Company.is_archived == False, or_(Company.website.is_(None), Company.website == "")))
    )
    no_web = no_web_res.all()

    # 2. Missing Logos
    no_logo_res = await db.execute(
        select(Company.id, Company.name)
        .where(and_(Company.is_archived == False, or_(Company.logo_url.is_(None), Company.logo_url == "")))
    )
    no_logo = no_logo_res.all()

    # 3. Expired Opportunities Still Marked OPEN
    exp_opp_res = await db.execute(
        select(Opportunity.id, Opportunity.title, Opportunity.deadline)
        .where(and_(Opportunity.status == "OPEN", Opportunity.deadline.isnot(None), Opportunity.deadline < today))
    )
    expired_opps = exp_opp_res.all()

    # 4. Unverified Organizations
    unver_res = await db.execute(
        select(Company.id, Company.name)
        .where(and_(Company.is_archived == False, Company.is_verified == False))
    )
    unverified = unver_res.all()

    # 5. Potential Duplicate Companies (Normalized name collision detection)
    all_comp_res = await db.execute(select(Company.id, Company.name).where(Company.is_archived == False))
    comp_names = all_comp_res.all()

    seen_slugs = {}
    duplicates = []
    for cid, cname in comp_names:
        norm = slugify(cname).replace("malaysia", "").replace("group", "").replace("berhad", "").replace("bhd", "").strip("-")
        if norm in seen_slugs and norm != "":
            dup_id, dup_name = seen_slugs[norm]
            duplicates.append({
                "id": cid,
                "name": f"{cname} <--> {dup_name}",
                "issue": "Potential Duplicate Organization",
                "issue_type": "POSSIBLE_DUPLICATE",
                "details": f"Normalized match on key '{norm}'."
            })
        else:
            seen_slugs[norm] = (cid, cname)

    items: List[DataQualityItem] = []
    for cid, cname in no_web[:10]:
        items.append(DataQualityItem(
            id=cid,
            name=cname,
            issue="Missing official company website",
            issue_type="MISSING_WEBSITE",
            details="Students cannot verify domain or careers portal."
        ))
    for cid, cname in no_logo[:10]:
        items.append(DataQualityItem(
            id=cid,
            name=cname,
            issue="Missing official organization logo",
            issue_type="MISSING_LOGO",
            details="Profile displays fallback monochrome letter badge."
        ))
    for oid, otitle, odeud in expired_opps[:10]:
        items.append(DataQualityItem(
            id=oid,
            name=otitle,
            issue="Listing deadline passed but still marked OPEN",
            issue_type="EXPIRED_OPEN_OPP",
            details=f"Application deadline was {odeud.isoformat()}."
        ))
    for d in duplicates[:5]:
        items.append(DataQualityItem(**d))

    return DataQualityReportOut(
        missing_websites_count=len(no_web),
        missing_logos_count=len(no_logo),
        expired_open_opportunities_count=len(expired_opps),
        possible_duplicates_count=len(duplicates),
        unverified_companies_count=len(unverified),
        items=items
    )

# =========================================================================
# 7. OPPORTUNITIES MODERATION
# =========================================================================

@router.get("/opportunities")
async def list_admin_opportunities(
    status_filter: Optional[str] = Query("ALL"),
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    query = select(Opportunity).options(selectinload(Opportunity.company))
    if status_filter and status_filter != "ALL":
        query = query.where(Opportunity.status == status_filter.upper())
    
    if search:
        s_fmt = f"%{search.lower()}%"
        query = query.where(
            func.lower(Opportunity.title).like(s_fmt) |
            func.lower(Opportunity.location).like(s_fmt)
        )

    query = query.order_by(desc(Opportunity.created_at)).offset(offset).limit(limit)
    res = await db.execute(query)
    opps = res.scalars().all()

    today = date.today()
    return [
        {
            "id": o.id,
            "title": o.title,
            "company_name": o.company.name if o.company else "Unknown Company",
            "company_id": o.company_id,
            "location": o.location,
            "work_type": o.work_type,
            "allowance": o.allowance,
            "currency": o.currency,
            "deadline": o.deadline.isoformat() if o.deadline else None,
            "status": o.status,
            "apply_url": o.apply_url,
            "is_expired": bool(o.deadline and o.deadline < today),
            "created_at": o.created_at.isoformat()
        }
        for o in opps
    ]

@router.patch("/opportunities/{id}/status")
async def update_opportunity_status(
    id: str,
    status_update: str = Query(..., pattern="^(OPEN|CLOSED|EXPIRED)$"),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    opp = await db.scalar(select(Opportunity).where(Opportunity.id == id))
    if not opp:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    old_status = opp.status
    opp.status = status_update.upper()

    db.add(AuditLog(
        actor_id=current_mod.id,
        action="UPDATE_OPPORTUNITY_STATUS",
        entity_type="OPPORTUNITY",
        entity_id=id,
        meta_data={"old_status": old_status, "new_status": opp.status, "title": opp.title}
    ))
    await db.commit()
    return {"message": f"Opportunity status updated to {opp.status}"}

# =========================================================================
# 8. TAXONOMY MANAGEMENT (SKILLS & TECHNOLOGIES)
# =========================================================================

@router.get("/taxonomies")
async def list_taxonomies(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Technology).order_by(Technology.name.asc()))
    techs = res.scalars().all()

    # Get usage counts
    tech_ids = [t.id for t in techs]
    counts_map = {}
    if tech_ids:
        c_res = await db.execute(
            select(ExperienceTechnology.technology_id, func.count(ExperienceTechnology.id))
            .where(ExperienceTechnology.technology_id.in_(tech_ids))
            .group_by(ExperienceTechnology.technology_id)
        )
        counts_map = {r[0]: r[1] for r in c_res.all()}

    return [
        {
            "id": t.id,
            "name": t.name,
            "category": t.category,
            "usage_count": counts_map.get(t.id, 0),
            "created_at": t.created_at.isoformat()
        }
        for t in techs
    ]

@router.post("/taxonomies/technologies")
async def create_technology_tag(
    name: str = Query(...),
    category: str = Query("Tools & Software"),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    clean_name = name.strip()
    existing = await db.scalar(select(Technology).where(func.lower(Technology.name) == clean_name.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="Technology tag already exists.")

    tech = Technology(name=clean_name, category=category.strip())
    db.add(tech)
    await db.flush()

    db.add(AuditLog(
        actor_id=current_admin.id,
        action="CREATE_TECHNOLOGY_TAG",
        entity_type="TECHNOLOGY",
        entity_id=tech.id,
        meta_data={"name": tech.name, "category": tech.category}
    ))
    await db.commit()
    return {"id": tech.id, "name": tech.name, "category": tech.category}

@router.delete("/taxonomies/technologies/{id}")
async def delete_technology_tag(
    id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    tech = await db.scalar(select(Technology).where(Technology.id == id))
    if not tech:
        raise HTTPException(status_code=404, detail="Technology tag not found")

    await db.delete(tech)
    db.add(AuditLog(
        actor_id=current_admin.id,
        action="DELETE_TECHNOLOGY_TAG",
        entity_type="TECHNOLOGY",
        entity_id=id,
        meta_data={"name": tech.name}
    ))
    await db.commit()
    return {"message": f"Deleted technology tag '{tech.name}'."}

# =========================================================================
# 9. USER & ACCESS MANAGEMENT (ADMIN ONLY)
# =========================================================================

@router.get("/users", response_model=List[AdminUserDetail])
async def list_admin_users(
    search: Optional[str] = None,
    role_filter: Optional[str] = Query("ALL"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(User)
    if role_filter and role_filter != "ALL":
        query = query.where(User.role == role_filter.lower())

    if search:
        s_fmt = f"%{search.lower()}%"
        query = query.where(
            func.lower(User.full_name).like(s_fmt) |
            func.lower(User.email).like(s_fmt) |
            func.lower(User.program).like(s_fmt)
        )

    query = query.order_by(desc(User.created_at)).offset(offset).limit(limit)
    res = await db.execute(query)
    users = res.scalars().all()

    if not users:
        return []

    u_ids = [u.id for u in users]

    # Batch counts
    exp_counts = {
        r[0]: r[1] for r in (await db.execute(
            select(InternshipExperience.user_id, func.count(InternshipExperience.id))
            .where(InternshipExperience.user_id.in_(u_ids))
            .group_by(InternshipExperience.user_id)
        )).all()
    }
    q_counts = {
        r[0]: r[1] for r in (await db.execute(
            select(SeniorQuestion.user_id, func.count(SeniorQuestion.id))
            .where(SeniorQuestion.user_id.in_(u_ids))
            .group_by(SeniorQuestion.user_id)
        )).all()
    }
    a_counts = {
        r[0]: r[1] for r in (await db.execute(
            select(SeniorAnswer.user_id, func.count(SeniorAnswer.id))
            .where(SeniorAnswer.user_id.in_(u_ids))
            .group_by(SeniorAnswer.user_id)
        )).all()
    }
    app_counts = {
        r[0]: r[1] for r in (await db.execute(
            select(Application.user_id, func.count(Application.id))
            .where(Application.user_id.in_(u_ids))
            .group_by(Application.user_id)
        )).all()
    }

    return [
        AdminUserDetail(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            program=u.program,
            grad_year=u.grad_year,
            is_verified=u.is_verified,
            is_active=u.is_active,
            avatar_url=u.avatar_url,
            suspension_reason=u.suspension_reason,
            created_at=u.created_at,
            experiences_count=exp_counts.get(u.id, 0),
            questions_count=q_counts.get(u.id, 0),
            answers_count=a_counts.get(u.id, 0),
            applications_count=app_counts.get(u.id, 0),
            reports_received_count=0
        )
        for u in users
    ]

@router.patch("/users/{id}/role")
async def update_user_role(
    id: str,
    role_in: UserRoleUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    user_to_update = await db.scalar(select(User).where(User.id == id))
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = role_in.role.lower()
    if new_role not in ["student", "moderator", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'student', 'moderator', or 'admin'.")

    # Prevent admin from demoting themselves if they are the sole admin
    if user_to_update.id == current_admin.id and new_role != "admin":
        admin_count = await db.scalar(select(func.count(User.id)).where(User.role == "admin"))
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the sole remaining platform administrator.")

    old_role = user_to_update.role
    user_to_update.role = new_role

    db.add(AuditLog(
        actor_id=current_admin.id,
        action="CHANGE_USER_ROLE",
        entity_type="USER",
        entity_id=id,
        meta_data={"user_email": user_to_update.email, "old_role": old_role, "new_role": new_role}
    ))
    await db.commit()
    return {"message": f"User '{user_to_update.full_name}' role changed to '{new_role}'."}

@router.patch("/users/{id}/status")
async def update_user_status(
    id: str,
    status_in: UserStatusUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    user_to_update = await db.scalar(select(User).where(User.id == id))
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    if user_to_update.id == current_admin.id and not status_in.is_active:
        raise HTTPException(status_code=400, detail="Administrators cannot suspend their own active session.")

    user_to_update.is_active = status_in.is_active
    user_to_update.suspension_reason = status_in.suspension_reason if not status_in.is_active else None

    action_label = "SUSPEND_USER" if not status_in.is_active else "REACTIVATE_USER"
    db.add(AuditLog(
        actor_id=current_admin.id,
        action=action_label,
        entity_type="USER",
        entity_id=id,
        meta_data={
            "user_email": user_to_update.email,
            "is_active": user_to_update.is_active,
            "reason": user_to_update.suspension_reason
        }
    ))
    await db.commit()
    return {
        "message": f"User '{user_to_update.full_name}' {'suspended' if not user_to_update.is_active else 'reactivated'} successfully."
    }

@router.patch("/users/{id}/verify")
async def toggle_user_verification(
    id: str,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    user_to_update = await db.scalar(select(User).where(User.id == id))
    if not user_to_update:
        raise HTTPException(status_code=404, detail="User not found")

    user_to_update.is_verified = not user_to_update.is_verified
    db.add(AuditLog(
        actor_id=current_admin.id,
        action="TOGGLE_USER_VERIFICATION",
        entity_type="USER",
        entity_id=id,
        meta_data={"user_email": user_to_update.email, "is_verified": user_to_update.is_verified}
    ))
    await db.commit()
    return {"message": f"User verification status set to {user_to_update.is_verified}."}

# =========================================================================
# 10. AUDIT LOGS & SETTINGS (ADMIN ONLY)
# =========================================================================

@router.get("/audit-logs", response_model=List[AuditLogOut])
async def list_audit_logs(
    action_filter: Optional[str] = None,
    entity_filter: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog)
    if action_filter:
        query = query.where(AuditLog.action.like(f"%{action_filter.upper()}%"))
    if entity_filter:
        query = query.where(AuditLog.entity_type == entity_filter.upper())

    query = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit)
    res = await db.execute(query)
    logs = res.scalars().all()

    actor_ids = [l.actor_id for l in logs if l.actor_id]
    actor_names = {}
    if actor_ids:
        actors_res = await db.execute(select(User.id, User.full_name).where(User.id.in_(actor_ids)))
        actor_names = {r[0]: r[1] for r in actors_res.all()}

    return [
        AuditLogOut(
            id=l.id,
            actor_id=l.actor_id,
            actor_name=actor_names.get(l.actor_id, "System / Administrator"),
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            meta_data=l.meta_data,
            created_at=l.created_at
        )
        for l in logs
    ]

@router.get("/settings", response_model=SystemSettingsOut)
async def get_system_settings(
    current_admin: User = Depends(get_current_admin)
):
    return SystemSettingsOut(**_system_settings)

@router.patch("/settings", response_model=SystemSettingsOut)
async def update_system_settings(
    update_in: SystemSettingsUpdate,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    if update_in.require_experience_approval is not None:
        _system_settings["require_experience_approval"] = update_in.require_experience_approval
    if update_in.allow_student_registrations is not None:
        _system_settings["allow_student_registrations"] = update_in.allow_student_registrations
    if update_in.allow_anonymous_reports is not None:
        _system_settings["allow_anonymous_reports"] = update_in.allow_anonymous_reports
    if update_in.maintenance_mode is not None:
        _system_settings["maintenance_mode"] = update_in.maintenance_mode
    if update_in.announcement_banner is not None:
        _system_settings["announcement_banner"] = update_in.announcement_banner.strip() or None

    db.add(AuditLog(
        actor_id=current_admin.id,
        action="UPDATE_SYSTEM_SETTINGS",
        entity_type="SETTINGS",
        entity_id="GLOBAL",
        meta_data=_system_settings
    ))
    await db.commit()
    return SystemSettingsOut(**_system_settings)
