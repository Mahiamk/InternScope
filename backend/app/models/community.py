from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import TimeStampedMixin

class CommunityGroup(Base, TimeStampedMixin):
    __tablename__ = "community_groups"

    name = Column(String(255), nullable=False)
    platform = Column(String(50), nullable=False, index=True) # 'TELEGRAM', 'WHATSAPP'
    category = Column(String(50), nullable=False, index=True) 
    # 'OFFICIAL', 'FACULTY_TECH', 'FACULTY_BUSINESS', 'REGIONAL_KL_PENANG', 'PEER_STUDY', 'GENERAL'
    description = Column(Text, nullable=False)
    invite_url = Column(String(500), nullable=False)
    member_count = Column(Integer, default=50, nullable=False)
    is_official = Column(Boolean, default=False, nullable=False)
    icon_type = Column(String(50), default="chat", nullable=False)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    created_by = relationship("User", foreign_keys=[created_by_id])

class CommunityPost(Base, TimeStampedMixin):
    __tablename__ = "community_posts"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), default="GENERAL", nullable=False, index=True)
    # 'GENERAL', 'JOB_LEADS', 'ACCOMMODATION', 'INTERVIEW_PREP', 'ACADEMIC_LOGBOOK'
    is_pinned = Column(Boolean, default=False, nullable=False)
    upvotes_count = Column(Integer, default=0, nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    replies = relationship(
        "CommunityReply",
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="CommunityReply.created_at.asc()"
    )
    upvotes = relationship(
        "CommunityPostVote",
        back_populates="post",
        cascade="all, delete-orphan"
    )

class CommunityReply(Base, TimeStampedMixin):
    __tablename__ = "community_replies"

    post_id = Column(String(36), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)

    post = relationship("CommunityPost", back_populates="replies")
    user = relationship("User", foreign_keys=[user_id])

class CommunityPostVote(Base, TimeStampedMixin):
    __tablename__ = "community_post_votes"

    post_id = Column(String(36), ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    post = relationship("CommunityPost", back_populates="upvotes")
    user = relationship("User", foreign_keys=[user_id])
