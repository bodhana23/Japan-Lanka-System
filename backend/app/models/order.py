import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, Text, Numeric, Enum, ForeignKey, VARCHAR
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.types import TypeDecorator

from app.database import Base
from app.utils.timezone import get_current_time


class OrderStatus(str, PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    SHIPPED = "shipped"
    READY_TO_PICKUP = "ready_to_pickup"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURN_APPROVED = "return_approved"
    PICKED_UP = "picked_up"


class OrderStatusType(TypeDecorator):
    """Stores OrderStatus as VARCHAR; coerces DB value to OrderStatus enum on read."""
    impl = VARCHAR(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if isinstance(value, OrderStatus):
            return value.value
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        try:
            return OrderStatus(value)
        except ValueError:
            return value


class DeliveryMethod(str, PyEnum):
    PICKUP = "pickup"
    SHIPPING = "shipping"


class SalesChannel(str, PyEnum):
    ONLINE = "online"
    OFFLINE = "offline"


class PaymentStatus(str, PyEnum):
    NOT_PAID = "not_paid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True, index=True)  # Nullable for offline sales
    status = Column(
        OrderStatusType,
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
    # Payment tracking fields
    subtotal = Column(Numeric(12, 2), nullable=True)  # Order subtotal before delivery fee
    delivery_fee = Column(Numeric(10, 2), nullable=True, default=0)  # Delivery fee based on district
    paid_amount = Column(Numeric(12, 2), nullable=True, default=0)  # Amount paid via PayHere
    remaining_amount = Column(Numeric(12, 2), nullable=True, default=0)  # Amount to be paid COD
    payment_status = Column(
        Enum(PaymentStatus, name="payment_status", create_type=True),
        nullable=False,
        default=PaymentStatus.NOT_PAID
    )
    # District for delivery fee calculation
    shipping_district = Column(String(100), nullable=True)
    shipping_address = Column(String(500), nullable=True)
    shipping_city = Column(String(100), nullable=True)
    shipping_postal_code = Column(String(20), nullable=True)
    # Offline sale customer info (when customer_id is null)
    offline_customer_name = Column(String(200), nullable=True)
    offline_customer_phone = Column(String(20), nullable=True)
    # PayHere payment reference
    payhere_payment_id = Column(String(100), nullable=True)
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

    @property
    def is_billable(self) -> bool:
        """Check if this order is eligible for bill generation.

        Rules:
        - Offline orders: Always billable once delivered (paid at point of sale)
        - Online orders: Billable for any non-cancelled order
        """
        if self.status == OrderStatus.CANCELLED:
            return False
        if self.sales_channel == SalesChannel.OFFLINE:
            return self.status == OrderStatus.DELIVERED
        # Online orders are billable
        return True

    def update_payment_status(self):
        """Update payment status based on paid and total amounts."""
        from decimal import Decimal
        paid = Decimal(str(self.paid_amount or 0))
        total = Decimal(str(self.total_amount or 0))

        if paid <= 0:
            self.payment_status = PaymentStatus.NOT_PAID
        elif paid >= total:
            self.payment_status = PaymentStatus.PAID
        else:
            self.payment_status = PaymentStatus.PARTIALLY_PAID

    def __repr__(self):
        return f"<Order {self.id} - {self.status.value}>"
