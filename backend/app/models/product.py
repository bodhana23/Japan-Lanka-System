import uuid
from decimal import Decimal

from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    brand = Column(String(100), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    year_from = Column(Integer, nullable=True)
    year_to = Column(Integer, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    quantity_available = Column(Integer, nullable=False, default=0)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    discount_percentage = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime, default=get_current_time, nullable=False)
    updated_at = Column(DateTime, default=get_current_time, onupdate=get_current_time, nullable=False)

    # Relationships
    order_items = relationship("OrderItem", back_populates="product", lazy="dynamic")
    cart_items = relationship("CartItem", back_populates="product", lazy="dynamic", cascade="all, delete-orphan")
    inventory_transactions = relationship("InventoryTransaction", back_populates="product", lazy="dynamic", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Product {self.name} ({self.brand})>"
