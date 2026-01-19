import uuid

from sqlalchemy import Column, DateTime, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class Cart(Base):
    __tablename__ = "carts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(DateTime, default=get_current_time, onupdate=get_current_time, nullable=False)

    # Relationships
    customer = relationship("Customer", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", lazy="joined", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Cart {self.id} for customer {self.customer_id}>"


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=get_current_time, nullable=False)

    # Unique constraint: one product per cart
    __table_args__ = (
        UniqueConstraint('cart_id', 'product_id', name='uq_cart_product'),
    )

    # Relationships
    cart = relationship("Cart", back_populates="items")
    product = relationship("Product", back_populates="cart_items")

    def __repr__(self):
        return f"<CartItem {self.id} - qty: {self.quantity}>"
