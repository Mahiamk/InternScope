from typing import Optional, List
import uuid
import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.experience import InternshipExperience, ExperienceMedia
from app.models.company import Company
from app.models.technology import Technology, ExperienceTechnology
from app.models.interactions import Bookmark
from app.models.user import User
from app.models.university import University
from app.schemas.experience import (
    ExperienceCreate, ExperienceUpdate, ExperienceOut,
    ExperienceListResponse, ExperienceAuthor, MediaOut
)
from app.schemas.company import CompanyOut
from app.schemas.technology import TechnologyOut
from app.api.v1.endpoints.companies import slugify
from app.services.logo_resolver import normalize_and_validate_url

router = APIRouter()

async def format_experience_out(
    exp: InternshipExperience,
    current_user_id: Optional[str] = None,
    db: Optional[AsyncSession] = None
) -> ExperienceOut:
    # Author info
    author = None
    if exp.user:
        univ_name = None
        if exp.user.university:
            univ_name = exp.user.university.name
        elif getattr(exp.user, "profile", None) and exp.user.profile and exp.user.profile.university_name:
            univ_name = exp.user.profile.university_name

        if exp.anonymous_display:
            author = ExperienceAuthor(
                full_name="Anonymous Senior",
                program=exp.user.program if exp.user else None,
                grad_year=exp.user.grad_year if exp.user else None,
                university_name=univ_name,
                avatar_url=None
            )
        else:
            author = ExperienceAuthor(
                full_name=exp.user.full_name,
                program=exp.user.program,
                grad_year=exp.user.grad_year,
                university_name=univ_name,
                avatar_url=exp.user.avatar_url
            )

    # Technologies
    techs: List[TechnologyOut] = []
    if exp.technologies:
        for et in exp.technologies:
            if et.technology:
                techs.append(TechnologyOut.model_validate(et.technology))

    # Media
    media_list = []
    if exp.media:
        sorted_media = sorted(exp.media, key=lambda m: m.order_idx)
        for m in sorted_media:
            media_list.append(MediaOut.model_validate(m))

    # Company
    comp_out = None
    if exp.company:
        comp_out = CompanyOut.model_validate(exp.company)

    # Bookmark check
    is_bookmarked = False
    if current_user_id and db:
        bm_res = await db.execute(
            select(Bookmark).where(
                and_(
                    Bookmark.user_id == current_user_id,
                    Bookmark.target_type == "EXPERIENCE",
                    Bookmark.target_id == exp.id
                )
            )
        )
        is_bookmarked = bm_res.scalar_one_or_none() is not None

    return ExperienceOut(
        id=exp.id,
        user_id=exp.user_id,
        company_id=exp.company_id,
        position=exp.position,
        department=exp.department,
        location=exp.location,
        work_type=exp.work_type,
        start_date=exp.start_date,
        end_date=exp.end_date,
        duration_weeks=exp.duration_weeks,
        allowance=exp.allowance if exp.is_allowance_disclosed else None,
        currency=exp.currency,
        allowance_period=exp.allowance_period,
        is_allowance_disclosed=exp.is_allowance_disclosed,
        responsibilities=exp.responsibilities,
        projects=exp.projects,
        interview_process=exp.interview_process,
        interview_tips=exp.interview_tips,
        interview_difficulty=exp.interview_difficulty,
        mentorship_rating=exp.mentorship_rating,
        culture_rating=exp.culture_rating,
        overall_rating=exp.overall_rating,
        pros=exp.pros,
        challenges=exp.challenges,
        advice=exp.advice,
        anonymous_display=exp.anonymous_display,
        status=exp.status,
        rejection_reason=exp.rejection_reason,
        views_count=exp.views_count,
        created_at=exp.created_at,
        updated_at=exp.updated_at,
        company=comp_out,
        author=author,
        technologies=techs,
        media=media_list,
        is_bookmarked=is_bookmarked
    )

@router.get("", response_model=ExperienceListResponse)
async def list_experiences(
    search: Optional[str] = None,
    company_id: Optional[str] = None,
    department: Optional[str] = None,
    location: Optional[str] = None,
    work_type: Optional[str] = None,
    technology_id: Optional[str] = None,
    min_allowance: Optional[float] = None,
    max_allowance: Optional[float] = None,
    sort_by: str = Query("newest", pattern="^(newest|allowance_desc|rating_desc|views_desc)$"),
    page: int = Query(1, ge=1),
    size: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
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
        .where(InternshipExperience.status == "PUBLISHED")
    )

    if search:
        s = f"%{search.lower()}%"
        query = query.join(InternshipExperience.company).where(
            or_(
                func.lower(InternshipExperience.position).like(s),
                func.lower(Company.name).like(s),
                func.lower(InternshipExperience.responsibilities).like(s),
                func.lower(InternshipExperience.location).like(s)
            )
        )

    if company_id:
        query = query.where(InternshipExperience.company_id == company_id)

    if department and department != "All":
        dep_str = f"%{department.lower()}%"
        query = query.where(
            or_(
                func.lower(InternshipExperience.department).like(dep_str),
                func.lower(InternshipExperience.position).like(dep_str)
            )
        )

    if location and location != "All":
        query = query.where(func.lower(InternshipExperience.location).like(f"%{location.lower()}%"))

    if work_type and work_type != "All":
        query = query.where(InternshipExperience.work_type == work_type.lower())

    if min_allowance is not None:
        query = query.where(
            and_(
                InternshipExperience.is_allowance_disclosed == True,
                InternshipExperience.allowance >= min_allowance
            )
        )

    if max_allowance is not None:
        query = query.where(
            and_(
                InternshipExperience.is_allowance_disclosed == True,
                InternshipExperience.allowance <= max_allowance
            )
        )

    if technology_id and technology_id != "All":
        query = query.join(InternshipExperience.technologies).where(
            ExperienceTechnology.technology_id == technology_id
        )

    # Count total
    count_sub = query.order_by(None).subquery()
    count_query = select(func.count()).select_from(count_sub)
    total_res = await db.execute(count_query)
    total = total_res.scalar_one()

    # Sort
    if sort_by == "allowance_desc":
        query = query.order_by(desc(InternshipExperience.allowance).nullslast(), desc(InternshipExperience.created_at))
    elif sort_by == "rating_desc":
        query = query.order_by(desc(InternshipExperience.overall_rating), desc(InternshipExperience.created_at))
    elif sort_by == "views_desc":
        query = query.order_by(desc(InternshipExperience.views_count), desc(InternshipExperience.created_at))
    else:
        query = query.order_by(desc(InternshipExperience.created_at))

    # Pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size)
    res = await db.execute(query)
    experiences = res.scalars().unique().all()

    items = []
    user_id = current_user.id if current_user else None
    for exp in experiences:
        items.append(await format_experience_out(exp, user_id, db))

    total_pages = math.ceil(total / size) if size > 0 else 1

    return ExperienceListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        total_pages=total_pages
    )

@router.get("/me", response_model=List[ExperienceOut])
async def get_my_experiences(
    current_user: User = Depends(get_current_user),
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
        .where(InternshipExperience.user_id == current_user.id)
        .order_by(desc(InternshipExperience.created_at))
    )
    res = await db.execute(query)
    experiences = res.scalars().unique().all()

    items = []
    for exp in experiences:
        items.append(await format_experience_out(exp, current_user.id, db))
    return items

@router.get("/{id}", response_model=ExperienceOut)
async def get_experience(
    id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
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
        .where(InternshipExperience.id == id)
    )
    res = await db.execute(query)
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Internship experience not found")

    # If draft or rejected, only author or moderator can view
    if exp.status != "PUBLISHED":
        if not current_user or (current_user.id != exp.user_id and current_user.role not in ["moderator", "admin"]):
            raise HTTPException(status_code=403, detail="You do not have permission to view this report")

    # Increment view count
    exp.views_count += 1
    await db.commit()

    user_id = current_user.id if current_user else None
    return await format_experience_out(exp, user_id, db)

@router.post("", response_model=ExperienceOut, status_code=status.HTTP_201_CREATED)
async def create_experience(
    exp_in: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Determine company via domain, website, or slug lookup
    company_id = exp_in.company_id
    norm_domain = None
    norm_url = None

    if exp_in.company_website:
        try:
            norm_domain, norm_url = normalize_and_validate_url(exp_in.company_website)
        except Exception:
            pass

    comp = None
    # 1. Look up by company_id if provided
    if company_id:
        res = await db.execute(select(Company).where(Company.id == company_id))
        comp = res.scalar_one_or_none()

    # 2. Look up by normalized domain if available
    if not comp and norm_domain:
        res = await db.execute(
            select(Company).where(
                or_(
                    Company.domain == norm_domain,
                    Company.website.ilike(f"%{norm_domain}%")
                )
            )
        )
        comp = res.scalars().first()

    # 3. Look up by slug or name if available
    if not comp and exp_in.company_name:
        comp_slug = slugify(exp_in.company_name)
        res = await db.execute(
            select(Company).where(
                or_(
                    Company.slug == comp_slug,
                    func.lower(Company.name) == exp_in.company_name.strip().lower()
                )
            )
        )
        comp = res.scalar_one_or_none()

    # 4. If existing company matched, update missing attributes
    if comp:
        company_id = comp.id
        if norm_domain and not comp.domain:
            comp.domain = norm_domain
        if norm_url and not comp.website:
            comp.website = norm_url
        if exp_in.company_logo_url and not comp.logo_url:
            comp.logo_url = exp_in.company_logo_url
    else:
        # 5. Create new company record safely
        if not exp_in.company_name and not norm_domain:
            raise HTTPException(status_code=400, detail="Company name or valid website URL is required.")

        comp_name = (exp_in.company_name or norm_domain.split('.')[0].capitalize()).strip()
        comp_slug = slugify(comp_name)
        # Check if slug exists to avoid unique constraint clash
        existing_slug = await db.execute(select(Company).where(Company.slug == comp_slug))
        if existing_slug.scalar_one_or_none():
            comp_slug = f"{comp_slug}-{uuid.uuid4().hex[:4]}"

        comp = Company(
            name=comp_name,
            slug=comp_slug,
            domain=norm_domain,
            website=norm_url or exp_in.company_website,
            logo_url=exp_in.company_logo_url,
            industry="Technology",
            headquarters=exp_in.location or "Kuala Lumpur, Malaysia",
            is_verified=False
        )
        db.add(comp)
        await db.flush()
        company_id = comp.id
    
    if not company_id:
        raise HTTPException(status_code=400, detail="Company is required.")

    # Status: if user submitted as DRAFT, set DRAFT. Otherwise set PUBLISHED (or PENDING if moderation active)
    status_val = exp_in.status if exp_in.status in ["DRAFT", "PENDING", "PUBLISHED"] else "PUBLISHED"

    new_exp = InternshipExperience(
        user_id=current_user.id,
        company_id=company_id,
        position=exp_in.position.strip(),
        department=exp_in.department,
        location=exp_in.location.strip(),
        work_type=exp_in.work_type,
        start_date=exp_in.start_date,
        end_date=exp_in.end_date,
        duration_weeks=exp_in.duration_weeks,
        allowance=exp_in.allowance if exp_in.is_allowance_disclosed else None,
        currency=exp_in.currency or "MYR",
        allowance_period=exp_in.allowance_period or "monthly",
        is_allowance_disclosed=exp_in.is_allowance_disclosed,
        responsibilities=exp_in.responsibilities,
        projects=exp_in.projects,
        interview_process=exp_in.interview_process,
        interview_tips=exp_in.interview_tips,
        interview_difficulty=exp_in.interview_difficulty or 3,
        mentorship_rating=exp_in.mentorship_rating or 4,
        culture_rating=exp_in.culture_rating or 4,
        overall_rating=exp_in.overall_rating or 4,
        pros=exp_in.pros,
        challenges=exp_in.challenges,
        advice=exp_in.advice,
        anonymous_display=exp_in.anonymous_display,
        status=status_val
    )
    db.add(new_exp)
    await db.flush()

    # Link technologies
    all_tech_ids = list(exp_in.technology_ids)
    for name in exp_in.technology_names:
        clean_name = name.strip()
        if clean_name:
            t_slug = slugify(clean_name)
            t_res = await db.execute(select(Technology).where(Technology.slug == t_slug))
            tech = t_res.scalar_one_or_none()
            if not tech:
                tech = Technology(
                    id=str(uuid.uuid4()),
                    name=clean_name,
                    slug=t_slug,
                    category="General"
                )
                db.add(tech)
                await db.flush()
            if tech.id not in all_tech_ids:
                all_tech_ids.append(tech.id)

    for tid in all_tech_ids:
        exp_tech = ExperienceTechnology(
            id=str(uuid.uuid4()),
            experience_id=new_exp.id,
            technology_id=tid
        )
        db.add(exp_tech)

    # Add media
    for idx, m in enumerate(exp_in.media):
        exp_media = ExperienceMedia(
            experience_id=new_exp.id,
            media_url=m.media_url,
            caption=m.caption,
            order_idx=m.order_idx if m.order_idx is not None else idx
        )
        db.add(exp_media)

    await db.commit()

    # Reload with relationships
    return await get_experience(new_exp.id, current_user, db)

@router.put("/{id}", response_model=ExperienceOut)
async def update_experience(
    id: str,
    exp_update: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(InternshipExperience).where(InternshipExperience.id == id))
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")

    if exp.user_id != current_user.id and current_user.role not in ["moderator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to edit this experience")

    update_data = exp_update.model_dump(
        exclude_unset=True,
        exclude={"technology_ids", "media", "company_website", "company_logo_url"}
    )
    for field, value in update_data.items():
        setattr(exp, field, value)

    # Update company website and logo if provided
    if exp_update.company_website or exp_update.company_logo_url:
        comp_res = await db.execute(select(Company).where(Company.id == exp.company_id))
        comp = comp_res.scalar_one_or_none()
        if comp:
            if exp_update.company_website:
                try:
                    norm_dom, norm_u = normalize_and_validate_url(exp_update.company_website)
                    if not comp.domain:
                        comp.domain = norm_dom
                    comp.website = norm_u
                except Exception:
                    pass
            if exp_update.company_logo_url:
                comp.logo_url = exp_update.company_logo_url

    # Update tech if provided
    if exp_update.technology_ids is not None:
        await db.execute(
            select(ExperienceTechnology).where(ExperienceTechnology.experience_id == id)
        )
        # Delete existing links
        await db.execute(
            ExperienceTechnology.__table__.delete().where(ExperienceTechnology.experience_id == id)
        )
        for tid in exp_update.technology_ids:
            db.add(ExperienceTechnology(
                id=str(uuid.uuid4()),
                experience_id=id,
                technology_id=tid
            ))

    await db.commit()
    return await get_experience(id, current_user, db)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_experience(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(InternshipExperience).where(InternshipExperience.id == id))
    exp = res.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")

    if exp.user_id != current_user.id and current_user.role not in ["moderator", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this experience")

    await db.delete(exp)
    await db.commit()
    return None
