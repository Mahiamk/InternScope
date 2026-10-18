from sqlalchemy import Column, String, Boolean, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class User(Base, TimeStampedMixin):
    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="student", nullable=False) # 'student', 'moderator', 'admin'
    university_id = Column(String(36), ForeignKey("universities.id", ondelete="SET NULL"), nullable=True, index=True)
    program = Column(String(255), nullable=True) # e.g. Computer Science, Business Analytics
    grad_year = Column(Integer, nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    suspension_reason = Column(Text, nullable=True)

    university = relationship("University", back_populates="users")
    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    experiences = relationship("InternshipExperience", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("ContentReport", back_populates="reporter", foreign_keys="ContentReport.reporter_user_id")
