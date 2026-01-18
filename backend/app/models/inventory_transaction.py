import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, Text, Integer, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class TransactionType(str, PyEnum):
    STOCK_IN = "stock_in"           # Inventory received from supplier
    STOCK_OUT = "stock_out"         # Inventory sold/shipped
    ADJUSTMENT = "adjustment"        # Manual inventory correction
    INITIAL = "initial"             # Initial stock when product created
    RETURN_IN = "return_in"         # Stock returned by customer


class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)  # Who made the change
    transaction_type = Column(
        Enum(TransactionType, name="transaction_type", create_type=True),
        nullable=False
    )
    quantity_change = Column(Integer, nullable=False)  # Positive for in, negative for out
    quantity_before = Column(Integer, nullable=False)
    quantity_after = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)  # E.g., "Order #123", "Shipment received"
    reference_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False, index=True)

    # Relationships
    product = relationship("Product", back_populates="inventory_transactions")
    user = relationship("User", back_populates="inventory_transactions")
    reference_order = relationship("Order", back_populates="inventory_transactions")

    def __repr__(self):
        return f"<InventoryTransaction {self.transaction_type.value}: {self.quantity_change}>"
