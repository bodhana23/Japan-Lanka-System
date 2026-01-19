import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.order import OrderStatus
from app.utils.timezone import get_current_time


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(
        Enum(OrderStatus, name="order_status", create_type=False),
        nullable=True  # Null for initial status when order is created
    )
    new_status = Column(
        Enum(OrderStatus, name="order_status", create_type=False),
        nullable=False
    )
    changed_by_employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False, index=True)

    # Relationships
    order = relationship("Order", back_populates="status_history")
    changed_by = relationship("Employee", back_populates="order_status_changes")

    def __repr__(self):
        return f"<OrderStatusHistory {self.old_status} -> {self.new_status}>"
