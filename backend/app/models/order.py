import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, Text, Numeric, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


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


class SalesChannel(str, PyEnum):
    ONLINE = "online"
    OFFLINE = "offline"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True, index=True)  # Nullable for offline sales
    status = Column(
        Enum(OrderStatus, name="order_status", create_type=True),
        nullable=False,
        default=OrderStatus.PENDING
    )
    delivery_method = Column(
        Enum(DeliveryMethod, name="delivery_method", create_type=True),
        nullable=False
    )
    sales_channel = Column(
        Enum(SalesChannel, name="sales_channel", create_type=True),
        nullable=False,
        default=SalesChannel.ONLINE
    )
    total_amount = Column(Numeric(12, 2), nullable=False)
    shipping_address = Column(String(500), nullable=True)
    shipping_city = Column(String(100), nullable=True)
    shipping_postal_code = Column(String(20), nullable=True)
    # Offline sale customer info (when customer_id is null)
    offline_customer_name = Column(String(200), nullable=True)
    offline_customer_phone = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(DateTime, default=get_current_time, onupdate=get_current_time, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", lazy="joined", cascade="all, delete-orphan")
    return_requests = relationship("ReturnRequest", back_populates="order", lazy="dynamic")
    status_history = relationship("OrderStatusHistory", back_populates="order", lazy="dynamic", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="related_order", lazy="dynamic")
    inventory_transactions = relationship("InventoryTransaction", back_populates="reference_order", lazy="dynamic")

    def __repr__(self):
        return f"<Order {self.id} - {self.status.value}>"
