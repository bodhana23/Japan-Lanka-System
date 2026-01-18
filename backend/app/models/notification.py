import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class NotificationType(str, PyEnum):
    ORDER_UPDATE = "order_update"
    RETURN_UPDATE = "return_update"
    SYSTEM = "system"
    PROMOTION = "promotion"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(
        Enum(NotificationType, name="notification_type", create_type=True),
        nullable=False,
        default=NotificationType.SYSTEM
    )
    is_read = Column(Boolean, default=False, nullable=False)
    related_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    related_return_id = Column(UUID(as_uuid=True), ForeignKey("return_requests.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="notifications")
    related_order = relationship("Order", back_populates="notifications")
    related_return = relationship("ReturnRequest", back_populates="notifications")

    def __repr__(self):
        return f"<Notification {self.title} for user {self.user_id}>"
