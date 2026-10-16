from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class SeniorQuestion(Base, TimeStampedMixin):
    __tablename__ = "senior_questions"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="INTERVIEWS", nullable=False, index=True)
    # Categories: 'INTERVIEWS', 'DAILY_TASKS', 'APPLICATION_PROCESS', 'CULTURE_BENEFITS', 'GENERAL'
    is_anonymous = Column(Boolean, default=False, nullable=False)
    is_private = Column(Boolean, default=False, nullable=False)
    # If is_private is True, only the question asker, moderators, and verified alumni/past interns of this company can see it
    status = Column(String(50), default="OPEN", nullable=False, index=True) # 'OPEN', 'ANSWERED', 'CLOSED'

    user = relationship("User", foreign_keys=[user_id])
    company = relationship("Company", foreign_keys=[company_id])
    answers = relationship(
        "SeniorAnswer",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="SeniorAnswer.created_at.asc()"
    )

class SeniorAnswer(Base, TimeStampedMixin):
    __tablename__ = "senior_answers"

    question_id = Column(String(36), ForeignKey("senior_questions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    is_verified_intern = Column(Boolean, default=False, nullable=False)
    internship_role = Column(String(255), nullable=True) # e.g. "Software Engineering Intern • 2024"
    helpful_count = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="PUBLISHED", nullable=False) # 'PUBLISHED', 'FLAGGED', 'HIDDEN'

    question = relationship("SeniorQuestion", back_populates="answers")
    user = relationship("User", foreign_keys=[user_id])
    follow_ups = relationship(
        "SeniorFollowUp",
        back_populates="answer",
        cascade="all, delete-orphan",
        order_by="SeniorFollowUp.created_at.asc()"
    )
    helpful_votes = relationship(
        "SeniorAnswerVote",
        back_populates="answer",
        cascade="all, delete-orphan"
    )

class SeniorFollowUp(Base, TimeStampedMixin):
    __tablename__ = "senior_follow_ups"

    answer_id = Column(String(36), ForeignKey("senior_answers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)

    answer = relationship("SeniorAnswer", back_populates="follow_ups")
    user = relationship("User", foreign_keys=[user_id])

class SeniorAnswerVote(Base, TimeStampedMixin):
    __tablename__ = "senior_answer_votes"

    answer_id = Column(String(36), ForeignKey("senior_answers.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    answer = relationship("SeniorAnswer", back_populates="helpful_votes")
    user = relationship("User", foreign_keys=[user_id])
