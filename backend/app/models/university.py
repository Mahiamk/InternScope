from sqlalchemy import Column, String, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class University(Base, TimeStampedMixin):
    __tablename__ = "universities"

    name = Column(String(255), nullable=False, unique=True, index=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    city = Column(String(100), nullable=False)
    country = Column(String(100), default="Malaysia", nullable=False)
    domain = Column(String(100), nullable=True) # e.g. aiu.edu.my
    is_active = Column(Boolean, default=True, nullable=False)

    users = relationship("User", back_populates="university")
