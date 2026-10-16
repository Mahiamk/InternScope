from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.models.company import Company
from app.models.experience import InternshipExperience
from app.models.senior_qa import SeniorQuestion, SeniorAnswer, SeniorFollowUp, SeniorAnswerVote
from app.schemas.senior_qa import (
    SeniorQuestionCreate,
    SeniorQuestionResponse,
    SeniorQuestionListResponse,
    CompanyBrief,
    SeniorAnswerCreate,
    SeniorAnswerResponse,
    SeniorFollowUpCreate,
    SeniorFollowUpResponse
)

router = APIRouter()

async def get_user_interned_company_ids(db: AsyncSession, user_id: str) -> List[str]:
    """Return list of company IDs where the given user has an approved/published internship experience."""
    result = await db.scalars(
        select(InternshipExperience.company_id)
        .where(
            InternshipExperience.user_id == user_id,
            InternshipExperience.status == "PUBLISHED"
        )
        .distinct()
    )
    return [cid for cid in result if cid]

@router.get("/questions", response_model=SeniorQuestionListResponse)
async def list_questions(
    company_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    my_questions: bool = Query(False),
    can_answer: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    user_interned_companies: List[str] = []
    if current_user:
        user_interned_companies = await get_user_interned_company_ids(db, current_user.id)

    # Base query with eager-loaded relations
    query = (
        select(SeniorQuestion)
        .options(
            selectinload(SeniorQuestion.company),
            selectinload(SeniorQuestion.user),
            selectinload(SeniorQuestion.answers)
        )
    )

    # Privacy filtering: Private questions only visible to author, admin/mod, or verified past intern of that company
    if not current_user:
        query = query.where(SeniorQuestion.is_private == False)
    elif current_user.role not in ["admin", "moderator"]:
        query = query.where(
            or_(
                SeniorQuestion.is_private == False,
                SeniorQuestion.user_id == current_user.id,
                SeniorQuestion.company_id.in_(user_interned_companies)
            )
        )

    if company_id:
        query = query.where(SeniorQuestion.company_id == company_id)
    if category and category != "ALL":
        query = query.where(SeniorQuestion.category == category)
    if status and status != "ALL":
        query = query.where(SeniorQuestion.status == status)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                SeniorQuestion.title.ilike(search_filter),
                SeniorQuestion.content.ilike(search_filter)
            )
        )
    if my_questions and current_user:
        query = query.where(SeniorQuestion.user_id == current_user.id)
    if can_answer and current_user:
        if user_interned_companies:
            query = query.where(SeniorQuestion.company_id.in_(user_interned_companies))
        else:
            return SeniorQuestionListResponse(items=[], total=0, can_answer_company_ids=[])

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_count = await db.scalar(count_query) or 0

    # Order and paginate
    query = query.order_by(desc(SeniorQuestion.created_at)).offset(offset).limit(limit)
    result = await db.execute(query)
    questions = result.scalars().all()

    items = []
    for q in questions:
        is_author = current_user is not None and q.user_id == current_user.id
        author_name = "Anonymous Student" if q.is_anonymous and not is_author else (q.user.full_name if q.user else "Student")
        author_program = q.user.program if q.user and q.user.program else "AIU Student"

        items.append(
            SeniorQuestionResponse(
                id=q.id,
                company_id=q.company_id,
                company=CompanyBrief(
                    id=q.company.id,
                    name=q.company.name,
                    slug=q.company.slug,
                    logo_url=q.company.logo_url,
                    industry=q.company.industry
                ),
                user_id=q.user_id,
                author_name=author_name,
                author_program=author_program,
                is_author=is_author,
                title=q.title,
                content=q.content,
                category=q.category,
                is_anonymous=q.is_anonymous,
                is_private=q.is_private,
                status=q.status,
                answers_count=len(q.answers),
                created_at=q.created_at
            )
        )

    return SeniorQuestionListResponse(
        items=items,
        total=total_count,
        can_answer_company_ids=user_interned_companies
    )

@router.post("/questions", response_model=SeniorQuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    data: SeniorQuestionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify company exists
    company = await db.scalar(select(Company).where(Company.id == data.company_id))
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    new_q = SeniorQuestion(
        user_id=current_user.id,
        company_id=data.company_id,
        title=data.title.strip(),
        content=data.content.strip(),
        category=data.category,
        is_anonymous=data.is_anonymous,
        is_private=data.is_private,
        status="OPEN"
    )
    db.add(new_q)
    await db.commit()
    await db.refresh(new_q)

    # Re-fetch with relations
    q_result = await db.execute(
        select(SeniorQuestion)
        .options(
            selectinload(SeniorQuestion.company),
            selectinload(SeniorQuestion.user)
        )
        .where(SeniorQuestion.id == new_q.id)
    )
    q = q_result.scalar_one()

    return SeniorQuestionResponse(
        id=q.id,
        company_id=q.company_id,
        company=CompanyBrief(
            id=q.company.id,
            name=q.company.name,
            slug=q.company.slug,
            logo_url=q.company.logo_url,
            industry=q.company.industry
        ),
        user_id=q.user_id,
        author_name=current_user.full_name,
        author_program=current_user.program or "AIU Student",
        is_author=True,
        title=q.title,
        content=q.content,
        category=q.category,
        is_anonymous=q.is_anonymous,
        is_private=q.is_private,
        status=q.status,
        answers_count=0,
        created_at=q.created_at,
        answers=[]
    )

@router.get("/questions/{question_id}", response_model=SeniorQuestionResponse)
async def get_question(
    question_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SeniorQuestion)
        .options(
            selectinload(SeniorQuestion.company),
            selectinload(SeniorQuestion.user),
            selectinload(SeniorQuestion.answers).selectinload(SeniorAnswer.user),
            selectinload(SeniorQuestion.answers).selectinload(SeniorAnswer.follow_ups).selectinload(SeniorFollowUp.user),
            selectinload(SeniorQuestion.answers).selectinload(SeniorAnswer.helpful_votes)
        )
        .where(SeniorQuestion.id == question_id)
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    user_interned_companies = []
    if current_user:
        user_interned_companies = await get_user_interned_company_ids(db, current_user.id)

    # Privacy enforcement
    is_author = current_user is not None and q.user_id == current_user.id
    if q.is_private:
        is_authorized = (
            is_author
            or (current_user and current_user.role in ["admin", "moderator"])
            or (current_user and q.company_id in user_interned_companies)
        )
        if not is_authorized:
            raise HTTPException(status_code=403, detail="This is a private question restricted to verified alumni and past interns of this company.")

    author_name = "Anonymous Student" if q.is_anonymous and not is_author else (q.user.full_name if q.user else "Student")
    author_program = q.user.program if q.user and q.user.program else "AIU Student"

    # Format answers
    answers_out: List[SeniorAnswerResponse] = []
    for ans in q.answers:
        ans_is_author = current_user is not None and ans.user_id == current_user.id
        ans_author_name = "Anonymous Senior" if ans.is_anonymous and not ans_is_author else (ans.user.full_name if ans.user else "Senior Intern")
        has_voted = False
        if current_user:
            has_voted = any(vote.user_id == current_user.id for vote in ans.helpful_votes)

        follow_ups_out: List[SeniorFollowUpResponse] = []
        for fu in ans.follow_ups:
            fu_is_author = current_user is not None and fu.user_id == current_user.id
            fu_author_name = "Anonymous Student" if fu.is_anonymous and not fu_is_author else (fu.user.full_name if fu.user else "Student")
            follow_ups_out.append(
                SeniorFollowUpResponse(
                    id=fu.id,
                    answer_id=fu.answer_id,
                    user_id=fu.user_id,
                    author_name=fu_author_name,
                    author_role=fu.user.role if fu.user else "student",
                    is_author=fu_is_author,
                    content=fu.content,
                    is_anonymous=fu.is_anonymous,
                    created_at=fu.created_at
                )
            )

        answers_out.append(
            SeniorAnswerResponse(
                id=ans.id,
                question_id=ans.question_id,
                user_id=ans.user_id,
                author_name=ans_author_name,
                author_role=ans.user.role if ans.user else "student",
                author_program=ans.user.program if ans.user else None,
                is_author=ans_is_author,
                content=ans.content,
                is_anonymous=ans.is_anonymous,
                is_verified_intern=ans.is_verified_intern,
                internship_role=ans.internship_role,
                helpful_count=ans.helpful_count,
                has_voted_helpful=has_voted,
                follow_ups=follow_ups_out,
                created_at=ans.created_at
            )
        )

    return SeniorQuestionResponse(
        id=q.id,
        company_id=q.company_id,
        company=CompanyBrief(
            id=q.company.id,
            name=q.company.name,
            slug=q.company.slug,
            logo_url=q.company.logo_url,
            industry=q.company.industry
        ),
        user_id=q.user_id,
        author_name=author_name,
        author_program=author_program,
        is_author=is_author,
        title=q.title,
        content=q.content,
        category=q.category,
        is_anonymous=q.is_anonymous,
        is_private=q.is_private,
        status=q.status,
        answers_count=len(answers_out),
        created_at=q.created_at,
        answers=answers_out
    )

@router.post("/questions/{question_id}/answers", response_model=SeniorAnswerResponse, status_code=status.HTTP_201_CREATED)
async def create_answer(
    question_id: str,
    data: SeniorAnswerCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    question = await db.scalar(select(SeniorQuestion).where(SeniorQuestion.id == question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    user_interned_companies = await get_user_interned_company_ids(db, current_user.id)
    if question.is_private:
        is_authorized = (
            question.user_id == current_user.id
            or current_user.role in ["admin", "moderator"]
            or question.company_id in user_interned_companies
        )
        if not is_authorized:
            raise HTTPException(status_code=403, detail="Unauthorized to answer this private question.")

    # Check if the answering user previously interned at this company
    exp = await db.scalar(
        select(InternshipExperience)
        .where(
            InternshipExperience.user_id == current_user.id,
            InternshipExperience.company_id == question.company_id,
            InternshipExperience.status == "PUBLISHED"
        )
        .order_by(desc(InternshipExperience.start_date))
    )

    is_verified_intern = False
    internship_role = None
    if exp:
        is_verified_intern = True
        year_str = f" • {exp.start_date.year}" if exp.start_date else ""
        internship_role = f"Verified {exp.position}{year_str}"

    new_answer = SeniorAnswer(
        question_id=question_id,
        user_id=current_user.id,
        content=data.content.strip(),
        is_anonymous=data.is_anonymous,
        is_verified_intern=is_verified_intern,
        internship_role=internship_role,
        helpful_count=0,
        status="PUBLISHED"
    )
    db.add(new_answer)

    # Update question status to ANSWERED if it was OPEN
    if question.status == "OPEN":
        question.status = "ANSWERED"

    await db.commit()
    await db.refresh(new_answer)

    return SeniorAnswerResponse(
        id=new_answer.id,
        question_id=new_answer.question_id,
        user_id=new_answer.user_id,
        author_name=current_user.full_name,
        author_role=current_user.role,
        author_program=current_user.program or "AIU Student",
        is_author=True,
        content=new_answer.content,
        is_anonymous=new_answer.is_anonymous,
        is_verified_intern=new_answer.is_verified_intern,
        internship_role=new_answer.internship_role,
        helpful_count=0,
        has_voted_helpful=False,
        follow_ups=[],
        created_at=new_answer.created_at
    )

@router.post("/answers/{answer_id}/helpful")
async def toggle_helpful_vote(
    answer_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    answer = await db.scalar(select(SeniorAnswer).where(SeniorAnswer.id == answer_id))
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    existing_vote = await db.scalar(
        select(SeniorAnswerVote).where(
            SeniorAnswerVote.answer_id == answer_id,
            SeniorAnswerVote.user_id == current_user.id
        )
    )

    if existing_vote:
        await db.delete(existing_vote)
        answer.helpful_count = max(0, answer.helpful_count - 1)
        has_voted = False
    else:
        new_vote = SeniorAnswerVote(answer_id=answer_id, user_id=current_user.id)
        db.add(new_vote)
        answer.helpful_count += 1
        has_voted = True

    await db.commit()
    return {
        "status": "success",
        "helpful_count": answer.helpful_count,
        "has_voted_helpful": has_voted
    }

@router.post("/answers/{answer_id}/follow-ups", response_model=SeniorFollowUpResponse, status_code=status.HTTP_201_CREATED)
async def create_follow_up(
    answer_id: str,
    data: SeniorFollowUpCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    answer = await db.scalar(select(SeniorAnswer).where(SeniorAnswer.id == answer_id))
    if not answer:
        raise HTTPException(status_code=404, detail="Answer not found")

    follow_up = SeniorFollowUp(
        answer_id=answer_id,
        user_id=current_user.id,
        content=data.content.strip(),
        is_anonymous=data.is_anonymous
    )
    db.add(follow_up)
    await db.commit()
    await db.refresh(follow_up)

    return SeniorFollowUpResponse(
        id=follow_up.id,
        answer_id=follow_up.answer_id,
        user_id=follow_up.user_id,
        author_name=current_user.full_name,
        author_role=current_user.role,
        is_author=True,
        content=follow_up.content,
        is_anonymous=follow_up.is_anonymous,
        created_at=follow_up.created_at
    )

@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    question_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    question = await db.scalar(select(SeniorQuestion).where(SeniorQuestion.id == question_id))
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    if question.user_id != current_user.id and current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this question")

    await db.delete(question)
    await db.commit()
    return None
