from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.interactions import ContentReport
from app.models.user import User
from app.schemas.interaction import ContentReportCreate, ContentReportOut

router = APIRouter()

@router.post("", response_model=ContentReportOut, status_code=status.HTTP_201_CREATED)
async def submit_content_report(
    rep_in: ContentReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    report = ContentReport(
        reporter_user_id=current_user.id,
        target_type=rep_in.target_type.upper(),
        target_id=rep_in.target_id,
        reason=rep_in.reason,
        details=rep_in.details,
        status="PENDING"
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report
