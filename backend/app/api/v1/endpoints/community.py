from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.community import (
    CommunityGroup,
    CommunityPost,
    CommunityReply,
    CommunityPostVote
)
from app.schemas.community import (
    CommunityGroupCreate,
    CommunityGroupResponse,
    CommunityPostCreate,
    CommunityPostResponse,
    CommunityReplyCreate,
    CommunityReplyResponse
)

router = APIRouter()

# ----------------- Community Groups (Telegram & WhatsApp) -----------------

@router.get("/groups", response_model=List[CommunityGroupResponse])
async def list_groups(
    platform: Optional[str] = Query(None), # 'TELEGRAM' | 'WHATSAPP'
    category: Optional[str] = Query(None),
    is_official: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(CommunityGroup)
    if platform and platform != "ALL":
        query = query.where(CommunityGroup.platform == platform.upper())
    if category and category != "ALL":
        query = query.where(CommunityGroup.category == category)
    if is_official is not None:
        query = query.where(CommunityGroup.is_official == is_official)

    query = query.order_by(desc(CommunityGroup.is_official), desc(CommunityGroup.member_count))
    result = await db.execute(query)
    groups = result.scalars().all()
    return groups

@router.post("/groups", response_model=CommunityGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    data: CommunityGroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Only admin/moderator can create official marked groups
    is_official = data.is_official and (current_user.role in ["admin", "moderator"])

    new_group = CommunityGroup(
        name=data.name.strip(),
        platform=data.platform.upper(),
        category=data.category,
        description=data.description.strip(),
        invite_url=data.invite_url.strip(),
        member_count=data.member_count,
        is_official=is_official,
        icon_type=data.icon_type,
        created_by_id=current_user.id
    )
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    return new_group

# ----------------- Community Discussions & Posts -----------------

@router.get("/posts", response_model=List[CommunityPostResponse])
async def list_posts(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(CommunityPost)
        .options(
            selectinload(CommunityPost.user),
            selectinload(CommunityPost.replies),
            selectinload(CommunityPost.upvotes)
        )
    )

    if category and category != "ALL":
        query = query.where(CommunityPost.category == category)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                CommunityPost.title.ilike(search_filter),
                CommunityPost.content.ilike(search_filter)
            )
        )

    # Pinned first, then newest
    query = query.order_by(desc(CommunityPost.is_pinned), desc(CommunityPost.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    posts = result.scalars().all()

    items = []
    for p in posts:
        is_author = current_user is not None and p.user_id == current_user.id
        has_upvoted = False
        if current_user:
            has_upvoted = any(v.user_id == current_user.id for v in p.upvotes)

        items.append(
            CommunityPostResponse(
                id=p.id,
                user_id=p.user_id,
                author_name=p.user.full_name if p.user else "AIU Student",
                author_program=p.user.program if p.user and p.user.program else "Student",
                author_role=p.user.role if p.user else "student",
                is_author=is_author,
                title=p.title,
                content=p.content,
                category=p.category,
                is_pinned=p.is_pinned,
                upvotes_count=p.upvotes_count,
                has_upvoted=has_upvoted,
                replies_count=len(p.replies),
                created_at=p.created_at
            )
        )
    return items

@router.get("/posts/{post_id}", response_model=CommunityPostResponse)
async def get_post(
    post_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CommunityPost)
        .options(
            selectinload(CommunityPost.user),
            selectinload(CommunityPost.replies).selectinload(CommunityReply.user),
            selectinload(CommunityPost.upvotes)
        )
        .where(CommunityPost.id == post_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Discussion post not found")

    is_author = current_user is not None and p.user_id == current_user.id
    has_upvoted = False
    if current_user:
        has_upvoted = any(v.user_id == current_user.id for v in p.upvotes)

    replies_out: List[CommunityReplyResponse] = []
    for r in p.replies:
        r_is_author = current_user is not None and r.user_id == current_user.id
        replies_out.append(
            CommunityReplyResponse(
                id=r.id,
                post_id=r.post_id,
                user_id=r.user_id,
                author_name=r.user.full_name if r.user else "AIU Student",
                author_program=r.user.program if r.user else None,
                author_role=r.user.role if r.user else "student",
                is_author=r_is_author,
                content=r.content,
                created_at=r.created_at
            )
        )

    return CommunityPostResponse(
        id=p.id,
        user_id=p.user_id,
        author_name=p.user.full_name if p.user else "AIU Student",
        author_program=p.user.program if p.user else "Student",
        author_role=p.user.role if p.user else "student",
        is_author=is_author,
        title=p.title,
        content=p.content,
        category=p.category,
        is_pinned=p.is_pinned,
        upvotes_count=p.upvotes_count,
        has_upvoted=has_upvoted,
        replies_count=len(replies_out),
        created_at=p.created_at,
        replies=replies_out
    )

@router.post("/posts", response_model=CommunityPostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    data: CommunityPostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    new_post = CommunityPost(
        user_id=current_user.id,
        title=data.title.strip(),
        content=data.content.strip(),
        category=data.category,
        is_pinned=False,
        upvotes_count=0
    )
    db.add(new_post)
    await db.commit()
    await db.refresh(new_post)

    return CommunityPostResponse(
        id=new_post.id,
        user_id=new_post.user_id,
        author_name=current_user.full_name,
        author_program=current_user.program or "Student",
        author_role=current_user.role,
        is_author=True,
        title=new_post.title,
        content=new_post.content,
        category=new_post.category,
        is_pinned=False,
        upvotes_count=0,
        has_upvoted=False,
        replies_count=0,
        created_at=new_post.created_at,
        replies=[]
    )

@router.post("/posts/{post_id}/upvote")
async def toggle_upvote_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = await db.scalar(select(CommunityPost).where(CommunityPost.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Discussion post not found")

    existing_vote = await db.scalar(
        select(CommunityPostVote).where(
            CommunityPostVote.post_id == post_id,
            CommunityPostVote.user_id == current_user.id
        )
    )

    if existing_vote:
        await db.delete(existing_vote)
        post.upvotes_count = max(0, post.upvotes_count - 1)
        has_upvoted = False
    else:
        new_vote = CommunityPostVote(post_id=post_id, user_id=current_user.id)
        db.add(new_vote)
        post.upvotes_count += 1
        has_upvoted = True

    await db.commit()
    return {
        "status": "success",
        "upvotes_count": post.upvotes_count,
        "has_upvoted": has_upvoted
    }

@router.post("/posts/{post_id}/replies", response_model=CommunityReplyResponse, status_code=status.HTTP_201_CREATED)
async def create_reply(
    post_id: str,
    data: CommunityReplyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = await db.scalar(select(CommunityPost).where(CommunityPost.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Discussion post not found")

    reply = CommunityReply(
        post_id=post_id,
        user_id=current_user.id,
        content=data.content.strip()
    )
    db.add(reply)
    await db.commit()
    await db.refresh(reply)

    return CommunityReplyResponse(
        id=reply.id,
        post_id=reply.post_id,
        user_id=reply.user_id,
        author_name=current_user.full_name,
        author_program=current_user.program or "Student",
        author_role=current_user.role,
        is_author=True,
        content=reply.content,
        created_at=reply.created_at
    )

@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = await db.scalar(select(CommunityPost).where(CommunityPost.id == post_id))
    if not post:
        raise HTTPException(status_code=404, detail="Discussion post not found")

    if post.user_id != current_user.id and current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this post")

    await db.delete(post)
    await db.commit()
    return None
