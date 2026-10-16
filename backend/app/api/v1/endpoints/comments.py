from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.interactions import Comment
from app.models.user import User
from app.schemas.interaction import CommentCreate, CommentOut

router = APIRouter()

@router.get("/experience/{experience_id}", response_model=List[CommentOut])
async def list_comments(experience_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Comment)
        .options(selectinload(Comment.user))
        .where(
            and_(
                Comment.experience_id == experience_id,
                Comment.status == "PUBLISHED"
            )
        )
        .order_by(Comment.created_at.asc())
    )
    comments = res.scalars().all()
    return [
        CommentOut(
            id=c.id,
            experience_id=c.experience_id,
            user_id=c.user_id,
            parent_id=c.parent_id,
            content=c.content,
            status=c.status,
            created_at=c.created_at,
            user_name=c.user.full_name if c.user else "Student",
            user_avatar=c.user.avatar_url if c.user else None
        )
        for c in comments
    ]

@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def create_comment(
    c_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_c = Comment(
        experience_id=c_in.experience_id,
        user_id=current_user.id,
        parent_id=c_in.parent_id,
        content=c_in.content.strip(),
        status="PUBLISHED"
    )
    db.add(new_c)
    await db.commit()
    await db.refresh(new_c)

    return CommentOut(
        id=new_c.id,
        experience_id=new_c.experience_id,
        user_id=new_c.user_id,
        parent_id=new_c.parent_id,
        content=new_c.content,
        status=new_c.status,
        created_at=new_c.created_at,
        user_name=current_user.full_name,
        user_avatar=current_user.avatar_url
    )
