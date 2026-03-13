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


class ReturnReason(str, PyEnum):
    DAMAGED_DEFECTIVE = "Damaged/Defective"
    WRONG_ITEM = "Wrong Item Received"
    NOT_AS_DESCRIBED = "Item Not As Described"
    CHANGED_MIND = "Changed My Mind"
    OTHER = "Other"


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True, index=True)
    processed_by_employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True, index=True)
    reason = Column(String(100), nullable=False)  # Reason category
    description = Column(Text, nullable=True)  # Additional description/details
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
    customer = relationship("Customer", back_populates="return_requests", foreign_keys=[customer_id])
    processed_by_employee = relationship("Employee", foreign_keys=[processed_by_employee_id])
    notifications = relationship("Notification", back_populates="related_return", lazy="dynamic")
    return_items = relationship("ReturnItem", back_populates="return_request", lazy="joined", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ReturnRequest {self.id} - {self.status.value}>"
