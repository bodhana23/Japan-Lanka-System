import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class ReturnStatus(str, PyEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(
        Enum(ReturnStatus, name="return_status", create_type=True),
        nullable=False,
        default=ReturnStatus.PENDING
    )
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(DateTime, default=get_current_time, onupdate=get_current_time, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="return_requests")
    user = relationship("User", back_populates="return_requests")
    notifications = relationship("Notification", back_populates="related_return", lazy="dynamic")

    def __repr__(self):
        return f"<ReturnRequest {self.id} - {self.status.value}>"
