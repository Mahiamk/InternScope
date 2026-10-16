from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_moderator, get_current_admin
from app.models.experience import InternshipExperience
from app.models.interactions import ContentReport, ModerationAction, AuditLog
from app.models.user import User
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.schemas.admin import ModerationActionCreate, AdminDashboardMetrics
from app.schemas.experience import ExperienceOut
from app.schemas.interaction import ContentReportOut
from app.schemas.user import UserOut
from app.api.v1.endpoints.experiences import format_experience_out

router = APIRouter()

@router.get("/metrics", response_model=AdminDashboardMetrics)
async def get_admin_metrics(
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    users_cnt = await db.scalar(select(func.count(User.id)))
    pending_cnt = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.status == "PENDING"))
    pub_cnt = await db.scalar(select(func.count(InternshipExperience.id)).where(InternshipExperience.status == "PUBLISHED"))
    comp_cnt = await db.scalar(select(func.count(Company.id)))
    opp_cnt = await db.scalar(select(func.count(Opportunity.id)))
    rep_cnt = await db.scalar(select(func.count(ContentReport.id)).where(ContentReport.status == "PENDING"))

    return AdminDashboardMetrics(
        total_users=users_cnt or 0,
        pending_experiences=pending_cnt or 0,
        published_experiences=pub_cnt or 0,
        total_companies=comp_cnt or 0,
        total_opportunities=opp_cnt or 0,
        open_reports=rep_cnt or 0
    )

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
            selectinload(InternshipExperience.technologies),
            selectinload(InternshipExperience.media)
        )
        .where(InternshipExperience.status == "PENDING")
        .order_by(desc(InternshipExperience.created_at))
    )
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
    else:
        raise HTTPException(status_code=400, detail="Invalid moderation action")

    # Record moderation action
    mod_action = ModerationAction(
        moderator_user_id=current_mod.id,
        target_type="EXPERIENCE",
        target_id=id,
        action=act,
        notes=action_in.notes
    )
    db.add(mod_action)

    # Record audit log
    audit = AuditLog(
        actor_id=current_mod.id,
        action=f"MODERATE_EXPERIENCE_{act}",
        entity_type="EXPERIENCE",
        entity_id=id,
        meta_data={"notes": action_in.notes, "status": exp.status}
    )
    db.add(audit)

    await db.commit()
    return await format_experience_out(exp, current_mod.id, db)

@router.get("/reports", response_model=List[ContentReportOut])
async def list_reports(
    status_filter: Optional[str] = Query("PENDING"),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    query = select(ContentReport)
    if status_filter and status_filter != "ALL":
        query = query.where(ContentReport.status == status_filter.upper())
    query = query.order_by(desc(ContentReport.created_at))
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/reports/{id}/resolve")
async def resolve_report(
    id: str,
    status_update: str = Query(..., pattern="^(RESOLVED|DISMISSED)$"),
    current_mod: User = Depends(get_current_moderator),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(ContentReport).where(ContentReport.id == id))
    rep = res.scalar_one_or_none()
    if not rep:
        raise HTTPException(status_code=404, detail="Report not found")

    rep.status = status_update
    mod_action = ModerationAction(
        moderator_user_id=current_mod.id,
        target_type="CONTENT_REPORT",
        target_id=id,
        action=status_update,
        notes="Moderator processed report."
    )
    db.add(mod_action)
    await db.commit()
    return {"message": f"Report marked as {status_update}"}

@router.get("/users", response_model=List[UserOut])
async def list_users(
    limit: int = 50,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(User).order_by(desc(User.created_at)).limit(limit))
    return res.scalars().all()
