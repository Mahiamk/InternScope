from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.profile import StudentProfile
from app.models.user import User
from app.schemas.profile import (
    StudentProfileOut,
    StudentProfileUpdate,
    ProfileCompletionOut,
    SkillItem
)

router = APIRouter()

def compute_profile_completion(profile: StudentProfile, user: Optional[User] = None) -> ProfileCompletionOut:
    percentage = 0
    missing = []
    completed = []

    # 1. Academic Details (25%)
    name_present = bool(profile.preferred_name or (user and user.full_name))
    if name_present:
        percentage += 5
        completed.append("Preferred / Full Name")
    else:
        missing.append("Preferred Name")

    if profile.field_of_study:
        percentage += 10
        completed.append("Field of Study")
    else:
        missing.append("Field of Study")

    if profile.grad_year or profile.year_of_study:
        percentage += 10
        completed.append("Graduation Year / Study Year")
    else:
        missing.append("Graduation Year")

    # 2. Skills (25%)
    skills_count = len(profile.skills or [])
    if skills_count >= 1:
        percentage += 15
        completed.append("Key Skills Added")
    else:
        missing.append("Key Skills (at least 1)")

    if skills_count >= 3:
        percentage += 10
        completed.append("Diverse Skill Set (3+ skills)")

    # 3. Career Targets (25%)
    roles_count = len(profile.preferred_roles or [])
    if roles_count >= 1:
        percentage += 15
        completed.append("Target Roles")
    else:
        missing.append("Target Roles")

    industries_count = len(profile.preferred_industries or [])
    if industries_count >= 1:
        percentage += 10
        completed.append("Preferred Industries")
    else:
        missing.append("Preferred Industries")

    # 4. Preferences (25%)
    loc_count = len(profile.preferred_locations or [])
    if loc_count >= 1:
        percentage += 15
        completed.append("Target Locations")
    else:
        missing.append("Target Locations")

    arrangements_count = len(profile.work_arrangements or [])
    if arrangements_count >= 1:
        percentage += 10
        completed.append("Work Arrangements")
    else:
        missing.append("Work Arrangements")

    percentage = min(100, percentage)
    is_completed = (
        bool(profile.is_completed) or 
        (
            bool(profile.field_of_study) and 
            skills_count >= 1 and 
            roles_count >= 1 and 
            loc_count >= 1 and 
            arrangements_count >= 1
        )
    )

    next_step = None
    if not profile.field_of_study or not (profile.grad_year or profile.year_of_study):
        next_step = "Complete your academic background"
    elif skills_count < 1:
        next_step = "Add your core technical and domain skills"
    elif roles_count < 1:
        next_step = "Select your target internship roles"
    elif loc_count < 1 or arrangements_count < 1:
        next_step = "Specify your preferred locations and work mode"
    elif skills_count < 3:
        next_step = "Add more skills to increase your recommendation accuracy"
    else:
        next_step = "All set! Check your personalized recommendations"

    return ProfileCompletionOut(
        is_completed=is_completed,
        percentage=percentage,
        missing_fields=missing,
        completed_fields=completed,
        next_step=next_step
    )

async def get_or_create_profile(user: User, db: AsyncSession) -> StudentProfile:
    res = await db.execute(
        select(StudentProfile)
        .where(StudentProfile.user_id == user.id)
    )
    profile = res.scalar_one_or_none()

    if not profile:
        profile = StudentProfile(
            user_id=user.id,
            preferred_name=user.full_name,
            field_of_study=user.program or "",
            grad_year=user.grad_year,
            skills=[],
            preferred_roles=[],
            preferred_industries=[],
            preferred_technologies=[],
            preferred_locations=["Kuala Lumpur"],
            work_arrangements=["hybrid"],
            availability_status="AVAILABLE",
            is_completed=False
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile

@router.get("", response_model=StudentProfileOut)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_or_create_profile(current_user, db)
    completion = compute_profile_completion(profile, current_user)
    
    # Update is_completed in DB if it changed
    if profile.is_completed != completion.is_completed:
        profile.is_completed = completion.is_completed
        await db.commit()
        await db.refresh(profile)

    profile_dict = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    profile_dict["completion"] = completion
    return profile_dict

@router.patch("", response_model=StudentProfileOut)
async def update_my_profile(
    profile_in: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_or_create_profile(current_user, db)
    update_data = profile_in.model_dump(exclude_unset=True)

    for field, val in update_data.items():
        if field == "skills" and val is not None:
            # Normalize SkillItem schemas to standard dictionaries for JSON storage
            normalized_skills = []
            for s in val:
                if isinstance(s, dict):
                    normalized_skills.append(s)
                elif hasattr(s, "model_dump"):
                    normalized_skills.append(s.model_dump())
                else:
                    normalized_skills.append({"name": str(s), "category": "General", "proficiency": "intermediate"})
            setattr(profile, "skills", normalized_skills)
        elif field == "is_completed":
            setattr(profile, "is_completed", bool(val))
        else:
            setattr(profile, field, val)

    completion = compute_profile_completion(profile, current_user)
    if profile_in.is_completed is not None:
        profile.is_completed = profile_in.is_completed
    else:
        profile.is_completed = completion.is_completed

    await db.commit()
    await db.refresh(profile)

    profile_dict = {c.name: getattr(profile, c.name) for c in profile.__table__.columns}
    profile_dict["completion"] = completion
    return profile_dict

@router.get("/completion", response_model=ProfileCompletionOut)
async def get_my_profile_completion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await get_or_create_profile(current_user, db)
    return compute_profile_completion(profile, current_user)
