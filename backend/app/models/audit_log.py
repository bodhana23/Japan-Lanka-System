"""Audit log model for tracking user actions."""

import uuid

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Polymorphic reference: either customer_id or employee_id can be set (or both null for system actions)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=True, index=True)
    entity_id = Column(String(50), nullable=True)
    details = Column(JSONB, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False, index=True)

    # Relationships
    customer = relationship("Customer", back_populates="audit_logs")
    employee = relationship("Employee", back_populates="audit_logs")

    def __repr__(self):
        user_id = self.customer_id or self.employee_id or "system"
        return f"<AuditLog {self.action} by {user_id}>"
