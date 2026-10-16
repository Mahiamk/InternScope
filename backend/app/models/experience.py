from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class InternshipExperience(Base, TimeStampedMixin):
    __tablename__ = "internship_experiences"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Position & Details
    position = Column(String(255), nullable=False, index=True)
    department = Column(String(255), nullable=True)
    location = Column(String(255), nullable=False, index=True)
    work_type = Column(String(50), default="hybrid", nullable=False) # 'onsite', 'hybrid', 'remote'
    
    # Dates & Duration
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    duration_weeks = Column(Integer, nullable=True)
    
    # Compensation (Safe disclosure)
    allowance = Column(Float, nullable=True)
    currency = Column(String(10), default="MYR", nullable=False)
    allowance_period = Column(String(50), default="monthly", nullable=False) # 'monthly', 'hourly', 'total'
    is_allowance_disclosed = Column(Boolean, default=True, nullable=False)
    
    # Editorial Content
    responsibilities = Column(Text, nullable=False)
    projects = Column(Text, nullable=True)
    interview_process = Column(Text, nullable=True)
    interview_tips = Column(Text, nullable=True)
    interview_difficulty = Column(Integer, default=3, nullable=True) # 1-5
    
    # Ratings & Reflections
    mentorship_rating = Column(Integer, default=4, nullable=True) # 1-5
    culture_rating = Column(Integer, default=4, nullable=True) # 1-5
    overall_rating = Column(Integer, default=4, nullable=False) # 1-5
    pros = Column(Text, nullable=True)
    challenges = Column(Text, nullable=True)
    advice = Column(Text, nullable=True)
    
    # Privacy & Status
    anonymous_display = Column(Boolean, default=False, nullable=False)
    status = Column(String(50), default="PUBLISHED", index=True, nullable=False) # 'DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'
    rejection_reason = Column(Text, nullable=True)
    views_count = Column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="experiences")
    company = relationship("Company", back_populates="experiences")
    technologies = relationship("ExperienceTechnology", back_populates="experience", cascade="all, delete-orphan")
    media = relationship("ExperienceMedia", back_populates="experience", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="experience", cascade="all, delete-orphan")

class ExperienceMedia(Base, TimeStampedMixin):
    __tablename__ = "experience_media"

    experience_id = Column(String(36), ForeignKey("internship_experiences.id", ondelete="CASCADE"), nullable=False, index=True)
    media_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    order_idx = Column(Integer, default=0, nullable=False)

    experience = relationship("InternshipExperience", back_populates="media")
