from typing import Optional, List
from datetime import date
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc, and_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.opportunity import Opportunity
from app.models.company import Company
from app.models.interactions import Bookmark, ContentReport
from app.models.user import User
from app.schemas.opportunity import (
    OpportunityCreate, OpportunityUpdate, OpportunityOut, OpportunityListResponse
)
from app.schemas.company import CompanyOut
from app.api.v1.endpoints.companies import slugify

router = APIRouter()

@router.get("", response_model=OpportunityListResponse)
async def list_opportunities(
    search: Optional[str] = None,
    company_id: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    work_type: Optional[str] = None,
    status_filter: Optional[str] = Query("OPEN", pattern="^(OPEN|CLOSED|ALL)$"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    query = (
        select(Opportunity)
        .options(selectinload(Opportunity.company))
    )

    if status_filter == "OPEN":
        query = query.where(
            and_(
                Opportunity.status == "OPEN",
                or_(Opportunity.deadline == None, Opportunity.deadline >= today)
            )
        )
    elif status_filter == "CLOSED":
        query = query.where(
            or_(
                Opportunity.status == "CLOSED",
                and_(Opportunity.deadline != None, Opportunity.deadline < today)
            )
        )

    if search:
        s = f"%{search.lower()}%"
        query = query.join(Opportunity.company).where(
            or_(
                func.lower(Opportunity.title).like(s),
                func.lower(Company.name).like(s),
                func.lower(Opportunity.skills).like(s),
                func.lower(Opportunity.location).like(s)
            )
        )

    if company_id:
        query = query.where(Opportunity.company_id == company_id)

    if department and department != "All":
        dep_str = f"%{department.lower()}%"
        query = query.where(
            or_(
                func.lower(Opportunity.department).like(dep_str),
                func.lower(Opportunity.title).like(dep_str),
                func.lower(Opportunity.skills).like(dep_str)
            )
        )

    if location and location != "All":
        query = query.where(func.lower(Opportunity.location).like(f"%{location.lower()}%"))

    if work_type and work_type != "All":
        query = query.where(Opportunity.work_type == work_type.lower())

    # Count total
    count_sub = query.order_by(None).subquery()
    count_query = select(func.count()).select_from(count_sub)
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    query = query.order_by(desc(Opportunity.created_at))
    offset = (page - 1) * size
    query = query.offset(offset).limit(size)
    res = await db.execute(query)
    opps = res.scalars().all()

    # Pre-fetch user bookmarks if logged in
    bookmarked_ids = set()
    if current_user:
        bm_res = await db.execute(
            select(Bookmark.target_id).where(
                and_(
                    Bookmark.user_id == current_user.id,
                    Bookmark.target_type == "OPPORTUNITY"
                )
            )
        )
        bookmarked_ids = set(bm_res.scalars().all())

    items = []
    for op in opps:
        is_expired = op.deadline is not None and op.deadline < today
        comp_out = CompanyOut.model_validate(op.company) if op.company else None
        
        items.append(OpportunityOut(
            id=op.id,
            company_id=op.company_id,
            posted_by_id=op.posted_by_id,
            title=op.title,
            department=op.department,
            location=op.location,
            work_type=op.work_type,
            period=op.period,
            allowance=op.allowance,
            currency=op.currency,
            period_type=op.period_type,
            skills=op.skills,
            requirements=op.requirements,
            deadline=op.deadline,
            source_url=op.source_url,
            apply_url=op.apply_url,
            status="EXPIRED" if is_expired else op.status,
            is_verified=op.is_verified,
            is_expired=is_expired,
            created_at=op.created_at,
            updated_at=op.updated_at,
            company=comp_out,
            is_bookmarked=op.id in bookmarked_ids
        ))

    total_pages = math.ceil(total / size) if size > 0 else 1

    return OpportunityListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/{id}", response_model=OpportunityOut)
async def get_opportunity(
    id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(Opportunity)
        .options(selectinload(Opportunity.company))
        .where(Opportunity.id == id)
    )
    res = await db.execute(query)
    op = res.scalar_one_or_none()
    if not op:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    is_bookmarked = False
    if current_user:
        bm_res = await db.execute(
            select(Bookmark).where(
                and_(
                    Bookmark.user_id == current_user.id,
                    Bookmark.target_type == "OPPORTUNITY",
                    Bookmark.target_id == op.id
                )
            )
        )
        is_bookmarked = bm_res.scalar_one_or_none() is not None

    today = date.today()
    is_expired = op.deadline is not None and op.deadline < today

    return OpportunityOut(
        id=op.id,
        company_id=op.company_id,
        posted_by_id=op.posted_by_id,
        title=op.title,
        department=op.department,
        location=op.location,
        work_type=op.work_type,
        period=op.period,
        allowance=op.allowance,
        currency=op.currency,
        period_type=op.period_type,
        skills=op.skills,
        requirements=op.requirements,
        deadline=op.deadline,
        source_url=op.source_url,
        apply_url=op.apply_url,
        status="EXPIRED" if is_expired else op.status,
        is_verified=op.is_verified,
        is_expired=is_expired,
        created_at=op.created_at,
        updated_at=op.updated_at,
        company=CompanyOut.model_validate(op.company) if op.company else None,
        is_bookmarked=is_bookmarked
    )

@router.post("", response_model=OpportunityOut, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    opp_in: OpportunityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    company_id = opp_in.company_id
    if not company_id and opp_in.company_name:
        comp_slug = slugify(opp_in.company_name)
        comp_res = await db.execute(select(Company).where(Company.slug == comp_slug))
        comp = comp_res.scalar_one_or_none()
        if not comp:
            comp = Company(
                name=opp_in.company_name.strip(),
                slug=comp_slug,
                industry="General",
                headquarters=opp_in.location or "Kuala Lumpur, Malaysia",
                is_verified=False
            )
            db.add(comp)
            await db.flush()
        company_id = comp.id

    if not company_id:
        raise HTTPException(status_code=400, detail="Company is required.")

    new_opp = Opportunity(
        company_id=company_id,
        posted_by_id=current_user.id,
        title=opp_in.title.strip(),
        department=opp_in.department,
        location=opp_in.location.strip(),
        work_type=opp_in.work_type,
        period=opp_in.period,
        allowance=opp_in.allowance,
        currency=opp_in.currency or "MYR",
        period_type=opp_in.period_type or "monthly",
        skills=opp_in.skills,
        requirements=opp_in.requirements,
        deadline=opp_in.deadline,
        source_url=opp_in.source_url,
        apply_url=opp_in.apply_url,
        status="OPEN",
        is_verified=True
    )
    db.add(new_opp)
    await db.commit()

    return await get_opportunity(new_opp.id, current_user, db)

@router.post("/{id}/report-closed", status_code=status.HTTP_200_OK)
async def report_opportunity_closed(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Opportunity).where(Opportunity.id == id))
    op = res.scalar_one_or_none()
    if not op:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    # Add content report
    report = ContentReport(
        reporter_user_id=current_user.id,
        target_type="OPPORTUNITY",
        target_id=id,
        reason="EXPIRED_OR_CLOSED",
        details="User reported that this vacancy is closed or expired.",
        status="PENDING"
    )
    db.add(report)
    await db.commit()
    return {"message": "Thank you for reporting. Our moderation team has flagged this listing."}
