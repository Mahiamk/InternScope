from datetime import date
from typing import List, Optional, Dict, Any, Set
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from collections import Counter

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.profile import StudentProfile
from app.models.opportunity import Opportunity
from app.models.experience import InternshipExperience
from app.models.company import Company
from app.api.v1.endpoints.profile import get_or_create_profile
from app.services.recommendation import (
    calculate_opportunity_score,
    calculate_experience_relevance,
    extract_skills_from_text,
    normalize_skill
)

router = APIRouter()

@router.get("")
async def get_recommended_opportunities(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    work_type: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_or_create_profile(current_user, db)

    # Fetch active non-expired opportunities with company details
    today = date.today()
    stmt = (
        select(Opportunity)
        .options(selectinload(Opportunity.company))
        .where(
            and_(
                Opportunity.status == "OPEN",
                or_(Opportunity.deadline.is_(None), Opportunity.deadline >= today)
            )
        )
    )
    if work_type:
        stmt = stmt.where(Opportunity.work_type == work_type.lower())
    if location:
        stmt = stmt.where(Opportunity.location.ilike(f"%{location}%"))

    res = await db.execute(stmt)
    opportunities = res.scalars().all()

    # Score each opportunity
    scored = []
    for opp in opportunities:
        score_data = calculate_opportunity_score(profile, opp)
        
        # Serialize company
        comp_data = None
        if opp.company:
            comp_data = {
                "id": opp.company.id,
                "name": opp.company.name,
                "slug": opp.company.slug,
                "logo_url": opp.company.logo_url,
                "industry": opp.company.industry,
                "headquarters": opp.company.headquarters,
                "is_verified": opp.company.is_verified
            }

        opp_dict = {
            "id": opp.id,
            "company_id": opp.company_id,
            "company": comp_data,
            "title": opp.title,
            "department": opp.department,
            "location": opp.location,
            "work_type": opp.work_type,
            "period": opp.period,
            "allowance": opp.allowance,
            "currency": opp.currency,
            "period_type": opp.period_type,
            "skills": opp.skills,
            "requirements": opp.requirements,
            "deadline": opp.deadline.isoformat() if opp.deadline else None,
            "apply_url": opp.apply_url,
            "status": opp.status,
            "is_verified": opp.is_verified,
            "created_at": opp.created_at.isoformat() if opp.created_at else None
        }

        scored.append({
            "opportunity": opp_dict,
            "match_score": score_data["match_score"],
            "score_breakdown": score_data["score_breakdown"],
            "matched_skills": score_data["matched_skills"],
            "missing_skills": score_data["missing_skills"],
            "learning_suggestion": score_data.get("learning_suggestion"),
            "reasons": score_data["reasons"]
        })

    # Sort descending by match_score
    scored.sort(key=lambda x: x["match_score"], reverse=True)

    paginated = scored[offset : offset + limit]

    return {
        "total": len(scored),
        "limit": limit,
        "offset": offset,
        "items": paginated
    }

@router.get("/experiences")
async def get_recommended_experiences(
    limit: int = Query(6, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_or_create_profile(current_user, db)

    # Fetch published experiences
    stmt = (
        select(InternshipExperience)
        .options(
            selectinload(InternshipExperience.company),
            selectinload(InternshipExperience.technologies)
        )
        .where(InternshipExperience.status == "PUBLISHED")
    )
    res = await db.execute(stmt)
    experiences = res.scalars().all()

    scored = []
    for exp in experiences:
        relevance_data = calculate_experience_relevance(profile, exp)
        
        comp_data = None
        if exp.company:
            comp_data = {
                "id": exp.company.id,
                "name": exp.company.name,
                "slug": exp.company.slug,
                "logo_url": exp.company.logo_url,
                "industry": exp.company.industry
            }

        exp_dict = {
            "id": exp.id,
            "position": exp.position,
            "department": exp.department,
            "location": exp.location,
            "work_type": exp.work_type,
            "duration_weeks": exp.duration_weeks,
            "allowance": exp.allowance if exp.is_allowance_disclosed else None,
            "overall_rating": exp.overall_rating,
            "mentorship_rating": exp.mentorship_rating,
            "culture_rating": exp.culture_rating,
            "responsibilities": exp.responsibilities[:240] + "..." if len(exp.responsibilities) > 240 else exp.responsibilities,
            "pros": exp.pros,
            "challenges": exp.challenges,
            "advice": exp.advice,
            "company": comp_data
        }

        scored.append({
            "experience": exp_dict,
            "relevance_score": relevance_data["relevance_score"],
            "highlights": relevance_data["highlights"]
        })

    scored.sort(key=lambda x: x["relevance_score"], reverse=True)
    return scored[:limit]

@router.get("/skills-gap")
async def get_skill_gap_analysis(
    opportunity_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_or_create_profile(current_user, db)

    # Student skills set
    student_skills = profile.skills or []
    student_norm_set = set()
    for s in student_skills:
        name = s.get("name") if isinstance(s, dict) else str(s)
        student_norm_set.add(normalize_skill(name).lower())

    if opportunity_id:
        # Opportunity-specific skill gap
        res = await db.execute(
            select(Opportunity)
            .options(selectinload(Opportunity.company))
            .where(Opportunity.id == opportunity_id)
        )
        opp = res.scalar_one_or_none()
        if not opp:
            raise HTTPException(status_code=404, detail="Opportunity not found")

        score_data = calculate_opportunity_score(profile, opp)
        return {
            "opportunity_id": opp.id,
            "opportunity_title": opp.title,
            "company_name": opp.company.name if opp.company else "",
            "match_score": score_data["match_score"],
            "matched_skills": score_data["matched_skills"],
            "missing_skills": score_data["missing_skills"],
            "score_breakdown": score_data["score_breakdown"],
            "reasons": score_data["reasons"]
        }

    # Aggregate skill gap across active vacancies
    res = await db.execute(
        select(Opportunity)
        .options(selectinload(Opportunity.company))
        .where(
            and_(
                Opportunity.status == "OPEN",
                or_(Opportunity.deadline.is_(None), Opportunity.deadline >= date.today())
            )
        )
    )
    opportunities = res.scalars().all()

    missing_skill_counter: Counter = Counter()
    missing_skill_roles: Dict[str, Set[str]] = {}

    total_evaluated_vacancies = 0

    for opp in opportunities:
        opp_skills = extract_skills_from_text(opp.skills)
        if not opp_skills:
            continue

        total_evaluated_vacancies += 1
        for sk in opp_skills:
            sk_norm = normalize_skill(sk)
            if sk_norm.lower() not in student_norm_set:
                missing_skill_counter[sk_norm] += 1
                if sk_norm not in missing_skill_roles:
                    missing_skill_roles[sk_norm] = set()
                missing_skill_roles[sk_norm].add(opp.title)

    # Format top missing skills
    market_gaps = []
    for skill_name, count in missing_skill_counter.most_common(12):
        priority = "CRITICAL" if count >= 3 else ("RECOMMENDED" if count >= 2 else "GOOD_TO_HAVE")
        roles = list(missing_skill_roles.get(skill_name, set()))[:3]
        market_gaps.append({
            "skill": skill_name,
            "demand_count": count,
            "priority": priority,
            "relevant_roles": roles
        })

    return {
        "total_evaluated_vacancies": total_evaluated_vacancies,
        "student_skills_count": len(student_skills),
        "in_demand_missing_skills": market_gaps
    }
