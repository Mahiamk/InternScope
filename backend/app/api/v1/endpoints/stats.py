from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.database import get_db
from app.models.experience import InternshipExperience
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.technology import Technology, ExperienceTechnology
from app.schemas.interaction import StatsSummaryOut

router = APIRouter()

@router.get("/summary", response_model=StatsSummaryOut)
async def get_summary_stats(db: AsyncSession = Depends(get_db)):
    # Total counts
    tot_exp = await db.scalar(
        select(func.count(InternshipExperience.id)).where(InternshipExperience.status == "PUBLISHED")
    ) or 0
    tot_comp = await db.scalar(select(func.count(Company.id))) or 0
    tot_opp = await db.scalar(
        select(func.count(Opportunity.id)).where(Opportunity.status == "OPEN")
    ) or 0

    # Allowance aggregates
    allowance_res = await db.execute(
        select(
            func.avg(InternshipExperience.allowance),
            func.min(InternshipExperience.allowance),
            func.max(InternshipExperience.allowance)
        ).where(
            and_(
                InternshipExperience.status == "PUBLISHED",
                InternshipExperience.is_allowance_disclosed == True,
                InternshipExperience.allowance != None
            )
        )
    )
    avg_allowance, min_allowance, max_allowance = allowance_res.one()

    # Popular technologies
    tech_res = await db.execute(
        select(Technology.name, func.count(ExperienceTechnology.id).label("cnt"))
        .join(ExperienceTechnology, Technology.id == ExperienceTechnology.technology_id)
        .join(InternshipExperience, ExperienceTechnology.experience_id == InternshipExperience.id)
        .where(InternshipExperience.status == "PUBLISHED")
        .group_by(Technology.name)
        .order_by(func.count(ExperienceTechnology.id).desc())
        .limit(10)
    )
    popular_tech = [{"name": r[0], "count": r[1]} for r in tech_res.all()]

    # Top locations
    loc_res = await db.execute(
        select(InternshipExperience.location, func.count(InternshipExperience.id).label("cnt"))
        .where(InternshipExperience.status == "PUBLISHED")
        .group_by(InternshipExperience.location)
        .order_by(func.count(InternshipExperience.id).desc())
        .limit(6)
    )
    top_locs = [{"location": r[0], "count": r[1]} for r in loc_res.all()]

    # Top industries
    ind_res = await db.execute(
        select(Company.industry, func.count(InternshipExperience.id).label("cnt"))
        .join(InternshipExperience, Company.id == InternshipExperience.company_id)
        .where(InternshipExperience.status == "PUBLISHED")
        .group_by(Company.industry)
        .order_by(func.count(InternshipExperience.id).desc())
        .limit(6)
    )
    top_inds = [{"industry": r[0], "count": r[1]} for r in ind_res.all()]

    return StatsSummaryOut(
        total_experiences=tot_exp,
        total_companies=tot_comp,
        total_opportunities=tot_opp,
        average_allowance=round(avg_allowance, 2) if avg_allowance else None,
        min_allowance=min_allowance,
        max_allowance=max_allowance,
        currency="MYR",
        popular_technologies=popular_tech,
        top_locations=top_locs,
        top_industries=top_inds
    )
