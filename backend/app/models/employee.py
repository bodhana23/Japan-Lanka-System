"""Employee model for authenticated employees (managers, admins, auditors)."""

import uuid
from enum import Enum as PyEnum
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class EmployeeRole(str, PyEnum):
    """Enum for employee roles."""
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"
    AUDITOR = "AUDITOR"


class Employee(Base):
    """Employee model for storing employee information.

    BUSINESS RULE: Employee accounts are provisioned exclusively by administrators.
    Google Sign-In is used strictly for authentication, not onboarding.
    Employees CANNOT self-register - they must be created by an Admin first.
    """

    __tablename__ = "employees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    # password_hash can be empty for Google-only auth employees
    password_hash = Column(String(255), nullable=True)
    role = Column(
        Enum(EmployeeRole, name="employee_role", create_type=True),
        nullable=False
    )
    is_active = Column(Boolean, default=True, nullable=False)
    # Firebase UID for employees using Google Sign-In
    # This is populated when an employee first logs in via Google
    firebase_uid = Column(String(255), unique=True, nullable=True, index=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(DateTime, default=get_current_time, onupdate=get_current_time, nullable=False)

    # Relationships
    order_status_changes = relationship("OrderStatusHistory", back_populates="changed_by", lazy="dynamic")
    inventory_transactions = relationship("InventoryTransaction", back_populates="employee", lazy="dynamic")
    audit_logs = relationship("AuditLog", back_populates="employee", lazy="dynamic")
    notifications = relationship("Notification", back_populates="employee", lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Employee {self.email} ({self.role.value})>"
