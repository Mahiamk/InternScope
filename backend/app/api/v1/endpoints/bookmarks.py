from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.interactions import Bookmark
from app.models.experience import InternshipExperience
from app.models.company import Company
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.interaction import BookmarkCreate, BookmarkOut

router = APIRouter()

@router.get("", response_model=List[BookmarkOut])
async def list_user_bookmarks(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Bookmark)
        .where(Bookmark.user_id == current_user.id)
        .order_by(Bookmark.created_at.desc())
    )
    bookmarks = res.scalars().all()

    items = []
    for bm in bookmarks:
        details: Dict[str, Any] = {}
        if bm.target_type == "EXPERIENCE":
            e_res = await db.execute(
                select(InternshipExperience).where(InternshipExperience.id == bm.target_id)
            )
            exp = e_res.scalar_one_or_none()
            if exp:
                details = {
                    "title": exp.position,
                    "location": exp.location,
                    "allowance": exp.allowance if exp.is_allowance_disclosed else None
                }
        elif bm.target_type == "COMPANY":
            c_res = await db.execute(select(Company).where(Company.id == bm.target_id))
            comp = c_res.scalar_one_or_none()
            if comp:
                details = {
                    "name": comp.name,
                    "industry": comp.industry,
                    "slug": comp.slug
                }
        elif bm.target_type == "OPPORTUNITY":
            o_res = await db.execute(select(Opportunity).where(Opportunity.id == bm.target_id))
            opp = o_res.scalar_one_or_none()
            if opp:
                details = {
                    "title": opp.title,
                    "location": opp.location,
                    "deadline": str(opp.deadline) if opp.deadline else None
                }

        items.append(BookmarkOut(
            id=bm.id,
            target_type=bm.target_type,
            target_id=bm.target_id,
            created_at=bm.created_at,
            details=details
        ))

    return items

@router.post("/toggle", status_code=status.HTTP_200_OK)
async def toggle_bookmark(
    data: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Bookmark).where(
            and_(
                Bookmark.user_id == current_user.id,
                Bookmark.target_type == data.target_type.upper(),
                Bookmark.target_id == data.target_id
            )
        )
    )
    bm = res.scalar_one_or_none()
    if bm:
        await db.delete(bm)
        await db.commit()
        return {"bookmarked": False, "message": "Bookmark removed"}
    else:
        new_bm = Bookmark(
            user_id=current_user.id,
            target_type=data.target_type.upper(),
            target_id=data.target_id
        )
        db.add(new_bm)
        await db.commit()
        return {"bookmarked": True, "message": "Bookmarked successfully"}
