from sqlalchemy import Column, String, Text, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class Bookmark(Base, TimeStampedMixin):
    __tablename__ = "bookmarks"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(String(50), nullable=False, index=True) # 'EXPERIENCE', 'COMPANY', 'OPPORTUNITY'
    target_id = Column(String(36), nullable=False, index=True)

    user = relationship("User", back_populates="bookmarks")

class Application(Base, TimeStampedMixin):
    __tablename__ = "applications"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name = Column(String(255), nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    position = Column(String(255), nullable=False)
    status = Column(String(50), default="INTERESTED", nullable=False, index=True) 
    # 'INTERESTED', 'APPLIED', 'INTERVIEWING', 'OFFERED', 'REJECTED'
    applied_date = Column(Date, nullable=True)
    deadline = Column(Date, nullable=True)
    notes = Column(Text, nullable=True) # Strictly private to user

    user = relationship("User", back_populates="applications")

class Comment(Base, TimeStampedMixin):
    __tablename__ = "comments"

    experience_id = Column(String(36), ForeignKey("internship_experiences.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_id = Column(String(36), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    content = Column(Text, nullable=False)
    status = Column(String(50), default="PUBLISHED", nullable=False) # 'PUBLISHED', 'FLAGGED', 'HIDDEN'

    user = relationship("User", back_populates="comments")
    experience = relationship("InternshipExperience", back_populates="comments")

class ContentReport(Base, TimeStampedMixin):
    __tablename__ = "content_reports"

    reporter_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_type = Column(String(50), nullable=False, index=True) # 'EXPERIENCE', 'COMMENT', 'COMPANY', 'OPPORTUNITY'
    target_id = Column(String(36), nullable=False, index=True)
    reason = Column(String(100), nullable=False) # 'INACCURATE', 'CONFIDENTIAL_DATA', 'SPAM', 'HARASSMENT', 'OTHER'
    details = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING", nullable=False, index=True) # 'PENDING', 'RESOLVED', 'DISMISSED'

    reporter = relationship("User", back_populates="reports")

class ModerationAction(Base, TimeStampedMixin):
    __tablename__ = "moderation_actions"

    moderator_user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    target_type = Column(String(50), nullable=False)
    target_id = Column(String(36), nullable=False)
    action = Column(String(50), nullable=False) # 'APPROVE', 'REJECT', 'FLAG', 'DELETE', 'RESOLVE_REPORT'
    notes = Column(Text, nullable=True)

class AuditLog(Base, TimeStampedMixin):
    __tablename__ = "audit_logs"

    actor_id = Column(String(36), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(36), nullable=True)
    meta_data = Column(JSON, nullable=True)
