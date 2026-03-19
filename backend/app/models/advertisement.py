import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Enum
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.utils.timezone import get_current_time


class MediaType(str, PyEnum):
    IMAGE = "image"
    VIDEO = "video"


class Advertisement(Base):
    __tablename__ = "advertisements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=True)
    media_url = Column(String(500), nullable=False)
    media_type = Column(Enum(MediaType), nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(
        DateTime,
        default=get_current_time,
        onupdate=get_current_time,
        nullable=False,
    )

    def __repr__(self):
        return f"<Advertisement {self.title or self.id} ({self.media_type})>"
