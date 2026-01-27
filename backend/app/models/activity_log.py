"""Activity log model for tracking user account-related activities."""

import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class ActivityType(str, PyEnum):
    """Enum for activity types."""
    # Customer activities
    CUSTOMER_REGISTERED = "customer_registered"
    CUSTOMER_LOGIN = "customer_login"
    CUSTOMER_LOGIN_FAILED = "customer_login_failed"
    CUSTOMER_LOGOUT = "customer_logout"
    CUSTOMER_PASSWORD_CHANGED = "customer_password_changed"
    CUSTOMER_PASSWORD_CHANGE_FAILED = "customer_password_change_failed"
    CUSTOMER_PASSWORD_RESET_REQUESTED = "customer_password_reset_requested"
    CUSTOMER_PROFILE_UPDATED = "customer_profile_updated"
    CUSTOMER_GOOGLE_LOGIN = "customer_google_login"
    CUSTOMER_GOOGLE_REGISTERED = "customer_google_registered"
    CUSTOMER_EMAIL_VERIFIED = "customer_email_verified"
    CUSTOMER_VERIFICATION_EMAIL_RESENT = "customer_verification_email_resent"
    CUSTOMER_STATUS_UPDATED = "customer_status_updated"
    CUSTOMER_DELETED = "customer_deleted"

    # Employee activities
    EMPLOYEE_LOGIN = "employee_login"
    EMPLOYEE_LOGIN_FAILED = "employee_login_failed"
    EMPLOYEE_LOGOUT = "employee_logout"
    EMPLOYEE_PASSWORD_RESET_REQUESTED = "employee_password_reset_requested"
    EMPLOYEE_PROFILE_UPDATED = "employee_profile_updated"
    EMPLOYEE_GOOGLE_LOGIN = "employee_google_login"
    EMPLOYEE_ROLE_UPDATED = "employee_role_updated"
    EMPLOYEE_STATUS_UPDATED = "employee_status_updated"
    EMPLOYEE_CREATED = "employee_created"
    EMPLOYEE_DELETED = "employee_deleted"


class ActivityLog(Base):
    """Activity log model for tracking user account-related activities.

    This includes:
    - User registration
    - Login and logout
    - Password changes
    - Profile updates
    - Role changes
    - Account deletion
    """

    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User who performed the activity (can be customer or employee)
    # For actions like "login failed", user_id can be null
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True, index=True)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True, index=True)

    # Activity details
    activity_type = Column(
        Enum(ActivityType, name="activity_type", create_type=True),
        nullable=False,
        index=True
    )
    description = Column(Text, nullable=False)

    # Request metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=get_current_time, nullable=False, index=True)

    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id])
    employee = relationship("Employee", foreign_keys=[employee_id])

    def __repr__(self):
        user_id = self.customer_id or self.employee_id or "unknown"
        return f"<ActivityLog {self.activity_type.value} by {user_id}>"
