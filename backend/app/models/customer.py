"""Customer model for authenticated customers."""

import uuid
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class Customer(Base):
    """Customer model for storing customer information."""

    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    address = Column(String(500), nullable=True)
    password_hash = Column(String(255), nullable=False)
    firebase_uid = Column(String(128), unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    # Email verification status - Google OAuth users are auto-verified,
    # email/password users must verify via Firebase email verification
    email_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(DateTime, default=get_current_time, onupdate=get_current_time, nullable=False)

    # Relationships
    orders = relationship("Order", back_populates="customer", lazy="dynamic")
    cart = relationship("Cart", back_populates="customer", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="customer", lazy="dynamic", cascade="all, delete-orphan")
    return_requests = relationship("ReturnRequest", back_populates="customer", lazy="dynamic")
    audit_logs = relationship("AuditLog", back_populates="customer", lazy="dynamic")

    def __repr__(self):
        return f"<Customer {self.email}>"
