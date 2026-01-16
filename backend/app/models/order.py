import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, Text, Numeric, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class OrderStatus(str, PyEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    READY_TO_PICKUP = "ready_to_pickup"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class DeliveryMethod(str, PyEnum):
    PICKUP = "pickup"
    SHIPPING = "shipping"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(
        Enum(OrderStatus, name="order_status", create_type=True),
        nullable=False,
        default=OrderStatus.PENDING
    )
    delivery_method = Column(
        Enum(DeliveryMethod, name="delivery_method", create_type=True),
        nullable=False
    )
    total_amount = Column(Numeric(12, 2), nullable=False)
    shipping_address = Column(String(500), nullable=True)
    shipping_city = Column(String(100), nullable=True)
    shipping_postal_code = Column(String(20), nullable=True)
    customer_phone = Column(String(20), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="joined", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order {self.id} - {self.status.value}>"
