from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, ConfigDict
from app.core.database import get_db
from app.models.university import University

router = APIRouter()

class UniversityOut(BaseModel):
    id: str
    name: str
    code: str
    city: str
    country: str
    domain: str | None = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

@router.get("", response_model=List[UniversityOut])
async def list_universities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(University).where(University.is_active == True).order_by(University.name))
    return result.scalars().all()
