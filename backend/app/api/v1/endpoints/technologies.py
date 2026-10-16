from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from app.core.database import get_db
from app.models.technology import Technology, ExperienceTechnology
from app.models.experience import InternshipExperience
from app.schemas.technology import TechnologyOut

router = APIRouter()

class TechnologyWithCount(BaseModel):
    id: str
    name: str
    slug: str
    category: str
    icon: str | None = None
    count: int

@router.get("", response_model=List[TechnologyWithCount])
async def list_technologies(db: AsyncSession = Depends(get_db)):
    # Group by technology and count appearances in published experiences
    stmt = (
        select(
            Technology.id,
            Technology.name,
            Technology.slug,
            Technology.category,
            Technology.icon,
            func.count(ExperienceTechnology.id).label("count")
        )
        .outerjoin(ExperienceTechnology, Technology.id == ExperienceTechnology.technology_id)
        .group_by(Technology.id)
        .order_by(func.count(ExperienceTechnology.id).desc(), Technology.name.asc())
    )
    res = await db.execute(stmt)
    rows = res.all()
    return [
        TechnologyWithCount(
            id=r[0],
            name=r[1],
            slug=r[2],
            category=r[3],
            icon=r[4],
            count=r[5]
        )
        for r in rows
    ]
