from sqlalchemy import Column, String, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class Company(Base, TimeStampedMixin):
    __tablename__ = "companies"

    name = Column(String(255), unique=True, index=True, nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    domain = Column(String(255), unique=True, index=True, nullable=True)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(500), nullable=True)
    careers_url = Column(String(500), nullable=True)
    industry = Column(String(100), index=True, nullable=False) # e.g. Fintech, Oil & Gas, E-Commerce, Consulting
    headquarters = Column(String(255), nullable=False) # e.g. Kuala Lumpur, Penang, Cyberjaya
    description = Column(Text, nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False, index=True)

    experiences = relationship("InternshipExperience", back_populates="company", cascade="all, delete-orphan")
    opportunities = relationship("Opportunity", back_populates="company", cascade="all, delete-orphan")
