from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
import re
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.company import Company
from app.models.experience import InternshipExperience
from app.models.opportunity import Opportunity
from app.models.technology import Technology, ExperienceTechnology
from app.models.user import User
from app.schemas.company import (
    CompanyOut,
    CompanyWithStats,
    CompanyCreate,
    CompanyLogoResolveRequest,
    CompanyLogoResolveResponse
)
from app.services.logo_resolver import resolve_company_logo, check_rate_limit, normalize_and_validate_url

router = APIRouter()

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[-\s]+', '-', text)

@router.get("", response_model=List[CompanyWithStats])
async def list_companies(
    search: Optional[str] = None,
    industry: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    query = select(Company)
    if search:
        search_filter = f"%{search.lower()}%"
        query = query.where(
            func.lower(Company.name).like(search_filter) |
            func.lower(Company.description).like(search_filter)
        )
    if industry and industry != "All":
        query = query.where(func.lower(Company.industry).like(f"%{industry.lower()}%"))
    if location and location != "All":
        query = query.where(func.lower(Company.headquarters).like(f"%{location.lower()}%"))

    query = query.order_by(Company.name).offset(offset).limit(limit)
    res = await db.execute(query)
    companies = res.scalars().all()

    result = []
    for c in companies:
        # Get experiences count and allowance stats
        exp_res = await db.execute(
            select(
                func.count(InternshipExperience.id),
                func.avg(InternshipExperience.allowance),
                func.min(InternshipExperience.allowance),
                func.max(InternshipExperience.allowance),
                func.avg(InternshipExperience.overall_rating)
            ).where(
                and_(
                    InternshipExperience.company_id == c.id,
                    InternshipExperience.status == "PUBLISHED"
                )
            )
        )
        row = exp_res.one()
        exp_count, avg_allowance, min_allowance, max_allowance, avg_rating = row

        # Opportunities count
        opp_res = await db.execute(
            select(func.count(Opportunity.id)).where(
                and_(
                    Opportunity.company_id == c.id,
                    Opportunity.status == "OPEN"
                )
            )
        )
        opp_count = opp_res.scalar_one()

        # Get top technologies
        tech_res = await db.execute(
            select(Technology.name, func.count(ExperienceTechnology.id).label("cnt"))
            .join(ExperienceTechnology, Technology.id == ExperienceTechnology.technology_id)
            .join(InternshipExperience, ExperienceTechnology.experience_id == InternshipExperience.id)
            .where(
                and_(
                    InternshipExperience.company_id == c.id,
                    InternshipExperience.status == "PUBLISHED"
                )
            )
            .group_by(Technology.name)
            .order_by(func.count(ExperienceTechnology.id).desc())
            .limit(5)
        )
        top_techs = [t[0] for t in tech_res.all()]

        # Get top roles
        roles_res = await db.execute(
            select(InternshipExperience.position, func.count(InternshipExperience.id))
            .where(
                and_(
                    InternshipExperience.company_id == c.id,
                    InternshipExperience.status == "PUBLISHED"
                )
            )
            .group_by(InternshipExperience.position)
            .order_by(func.count(InternshipExperience.id).desc())
            .limit(4)
        )
        top_roles = [r[0] for r in roles_res.all()]

        c_dict = CompanyOut.model_validate(c).model_dump()
        result.append(CompanyWithStats(
            **c_dict,
            experiences_count=exp_count or 0,
            opportunities_count=opp_count or 0,
            avg_allowance=round(avg_allowance, 2) if avg_allowance else None,
            min_allowance=min_allowance,
            max_allowance=max_allowance,
            avg_rating=round(avg_rating, 1) if avg_rating else None,
            top_technologies=top_techs,
            top_roles=top_roles
        ))

    return result

@router.post("/resolve-logo", response_model=CompanyLogoResolveResponse)
async def resolve_logo_endpoint(
    req: CompanyLogoResolveRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    client_ip = request.client.host if request.client else "127.0.0.1"
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before attempting more logo resolutions."
        )

    return await resolve_company_logo(req.website_url, db, client_ip=client_ip)

@router.get("/{slug_or_id}", response_model=CompanyWithStats)
async def get_company(slug_or_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Company).where((Company.slug == slug_or_id) | (Company.id == slug_or_id))
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get stats
    exp_res = await db.execute(
        select(
            func.count(InternshipExperience.id),
            func.avg(InternshipExperience.allowance),
            func.min(InternshipExperience.allowance),
            func.max(InternshipExperience.allowance),
            func.avg(InternshipExperience.overall_rating)
        ).where(
            and_(
                InternshipExperience.company_id == c.id,
                InternshipExperience.status == "PUBLISHED"
            )
        )
    )
    exp_count, avg_allowance, min_allowance, max_allowance, avg_rating = exp_res.one()

    opp_res = await db.execute(
        select(func.count(Opportunity.id)).where(
            and_(
                Opportunity.company_id == c.id,
                Opportunity.status == "OPEN"
            )
        )
    )
    opp_count = opp_res.scalar_one()

    tech_res = await db.execute(
        select(Technology.name, func.count(ExperienceTechnology.id).label("cnt"))
        .join(ExperienceTechnology, Technology.id == ExperienceTechnology.technology_id)
        .join(InternshipExperience, ExperienceTechnology.experience_id == InternshipExperience.id)
        .where(
            and_(
                InternshipExperience.company_id == c.id,
                InternshipExperience.status == "PUBLISHED"
            )
        )
        .group_by(Technology.name)
        .order_by(func.count(ExperienceTechnology.id).desc())
        .limit(8)
    )
    top_techs = [t[0] for t in tech_res.all()]

    roles_res = await db.execute(
        select(InternshipExperience.position, func.count(InternshipExperience.id))
        .where(
            and_(
                InternshipExperience.company_id == c.id,
                InternshipExperience.status == "PUBLISHED"
            )
        )
        .group_by(InternshipExperience.position)
        .order_by(func.count(InternshipExperience.id).desc())
        .limit(5)
    )
    top_roles = [r[0] for r in roles_res.all()]

    c_dict = CompanyOut.model_validate(c).model_dump()
    return CompanyWithStats(
        **c_dict,
        experiences_count=exp_count or 0,
        opportunities_count=opp_count or 0,
        avg_allowance=round(avg_allowance, 2) if avg_allowance else None,
        min_allowance=min_allowance,
        max_allowance=max_allowance,
        avg_rating=round(avg_rating, 1) if avg_rating else None,
        top_technologies=top_techs,
        top_roles=top_roles
    )

@router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    comp_in: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    slug = slugify(comp_in.name)
    existing = await db.execute(select(Company).where(Company.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="A company with this name already exists.")

    domain = comp_in.domain
    if not domain and comp_in.website:
        try:
            norm_dom, _ = normalize_and_validate_url(comp_in.website)
            domain = norm_dom
        except Exception:
            pass

    if domain:
        existing_dom = await db.execute(select(Company).where(Company.domain == domain))
        if existing_dom.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"A company record already exists for domain '{domain}'.")

    comp_dict = comp_in.model_dump()
    comp_dict["domain"] = domain
    new_comp = Company(
        **comp_dict,
        slug=slug,
        is_verified=False
    )
    db.add(new_comp)
    await db.commit()
    await db.refresh(new_comp)
    return new_comp
