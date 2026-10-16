from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class Technology(Base, TimeStampedMixin):
    __tablename__ = "technologies"

    name = Column(String(100), unique=True, index=True, nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(50), nullable=False) # 'Frontend', 'Backend', 'Data/AI', 'DevOps', 'Mobile', 'Design'
    icon = Column(String(100), nullable=True)

    experience_links = relationship("ExperienceTechnology", back_populates="technology", cascade="all, delete-orphan")

class ExperienceTechnology(Base):
    __tablename__ = "experience_technologies"

    id = Column(String(36), primary_key=True)
    experience_id = Column(String(36), ForeignKey("internship_experiences.id", ondelete="CASCADE"), nullable=False, index=True)
    technology_id = Column(String(36), ForeignKey("technologies.id", ondelete="CASCADE"), nullable=False, index=True)

    experience = relationship("InternshipExperience", back_populates="technologies")
    technology = relationship("Technology", back_populates="experience_links")
