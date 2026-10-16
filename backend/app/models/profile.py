from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, Date, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class StudentProfile(Base, TimeStampedMixin):
    __tablename__ = "student_profiles"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Academic Information
    preferred_name = Column(String(255), nullable=True)
    university_name = Column(String(255), nullable=True)
    degree_level = Column(String(100), nullable=True) # e.g. "Bachelor's", "Master's", "Diploma"
    field_of_study = Column(String(255), nullable=True) # e.g. "Computer Science", "Business Administration"
    year_of_study = Column(Integer, nullable=True) # 1, 2, 3, 4
    grad_year = Column(Integer, nullable=True)
    training_start_date = Column(Date, nullable=True)
    preferred_training_period = Column(String(100), nullable=True) # e.g. "3 - 6 Months (June - Dec 2026)"

    # Skills: [{"name": "Python", "category": "Programming Languages", "proficiency": "advanced"}]
    skills = Column(JSON, default=list, nullable=False)

    # Career Interests
    preferred_roles = Column(JSON, default=list, nullable=False) # e.g. ["Backend Developer", "Data Analyst"]
    preferred_industries = Column(JSON, default=list, nullable=False) # e.g. ["Technology", "Fintech"]
    preferred_technologies = Column(JSON, default=list, nullable=False)
    career_goals = Column(Text, nullable=True)

    # Preferences
    preferred_locations = Column(JSON, default=list, nullable=False) # e.g. ["Kuala Lumpur", "Penang", "Remote"]
    work_arrangements = Column(JSON, default=list, nullable=False) # e.g. ["hybrid", "remote", "onsite"]
    preferred_duration_weeks = Column(Integer, nullable=True) # e.g. 24
    min_allowance = Column(Float, nullable=True)
    availability_status = Column(String(50), default="AVAILABLE", nullable=False) # "AVAILABLE", "LOOKING", "PLACED"

    # Profile Enrichment
    bio = Column(Text, nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    resume_url = Column(String(500), nullable=True)

    # Onboarding Status
    is_completed = Column(Boolean, default=False, nullable=False, index=True)

    # Relationship
    user = relationship("User", back_populates="profile")
