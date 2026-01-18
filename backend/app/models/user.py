import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class UserRole(str, PyEnum):
    CUSTOMER = "customer"
    MANAGER = "manager"
    ADMIN = "admin"
    AUDITOR = "auditor"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    firebase_uid = Column(String(128), unique=True, nullable=True, index=True)
    role = Column(
        Enum(UserRole, name="user_role", create_type=True),
        nullable=False,
        default=UserRole.CUSTOMER
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(DateTime, default=get_current_time, onupdate=get_current_time, nullable=False)

    # Relationships
    orders = relationship("Order", back_populates="user", lazy="dynamic")
    audit_logs = relationship("AuditLog", back_populates="user", lazy="dynamic")
    return_requests = relationship("ReturnRequest", back_populates="user", lazy="dynamic")
    cart = relationship("Cart", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", lazy="dynamic", cascade="all, delete-orphan")
    order_status_changes = relationship("OrderStatusHistory", back_populates="changed_by", lazy="dynamic")
    inventory_transactions = relationship("InventoryTransaction", back_populates="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.email}>"
