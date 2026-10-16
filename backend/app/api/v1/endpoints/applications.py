from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.interactions import Application
from app.models.user import User
from app.schemas.interaction import ApplicationCreate, ApplicationUpdate, ApplicationOut

router = APIRouter()

@router.get("", response_model=List[ApplicationOut])
async def list_user_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Application)
        .where(Application.user_id == current_user.id)
        .order_by(desc(Application.updated_at))
    )
    return res.scalars().all()

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_app = Application(
        user_id=current_user.id,
        company_name=app_in.company_name.strip(),
        company_id=app_in.company_id,
        position=app_in.position.strip(),
        status=app_in.status.upper(),
        applied_date=app_in.applied_date,
        deadline=app_in.deadline,
        notes=app_in.notes
    )
    db.add(new_app)
    await db.commit()
    await db.refresh(new_app)
    return new_app

@router.put("/{id}", response_model=ApplicationOut)
async def update_application(
    id: str,
    app_in: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Application).where(
            and_(
                Application.id == id,
                Application.user_id == current_user.id
            )
        )
    )
    app_obj = res.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application record not found")

    update_data = app_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if field == "status" and val:
            setattr(app_obj, field, val.upper())
        else:
            setattr(app_obj, field, val)

    await db.commit()
    await db.refresh(app_obj)
    return app_obj

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(
    id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Application).where(
            and_(
                Application.id == id,
                Application.user_id == current_user.id
            )
        )
    )
    app_obj = res.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application record not found")

    await db.delete(app_obj)
    await db.commit()
    return None
