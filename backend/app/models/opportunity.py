from sqlalchemy import Column, String, Float, Boolean, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class Opportunity(Base, TimeStampedMixin):
    __tablename__ = "opportunities"

    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    posted_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(255), nullable=False, index=True)
    department = Column(String(100), nullable=True)
    location = Column(String(255), nullable=False, index=True)
    work_type = Column(String(50), default="hybrid", nullable=False) # 'onsite', 'hybrid', 'remote'
    period = Column(String(100), nullable=False) # e.g. "3 - 6 Months"
    
    allowance = Column(Float, nullable=True)
    currency = Column(String(10), default="MYR", nullable=False)
    period_type = Column(String(50), default="monthly", nullable=False)
    
    skills = Column(String(500), nullable=True) # Comma-separated or structured
    requirements = Column(Text, nullable=True)
    deadline = Column(Date, nullable=True, index=True)
    
    source_url = Column(String(500), nullable=True)
    apply_url = Column(String(500), nullable=False)
    
    status = Column(String(50), default="OPEN", index=True, nullable=False) # 'OPEN', 'CLOSED', 'EXPIRED'
    is_verified = Column(Boolean, default=True, nullable=False)

    company = relationship("Company", back_populates="opportunities")
