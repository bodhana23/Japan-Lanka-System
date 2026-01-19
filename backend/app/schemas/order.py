from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.order import OrderStatus, DeliveryMethod


# Order Item schemas
class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: Optional[str] = None
    quantity: int
    unit_price: Decimal
    created_at: datetime

    class Config:
        from_attributes = True


# Order schemas
class OrderCreate(BaseModel):
    delivery_method: DeliveryMethod
    shipping_address: Optional[str] = Field(None, max_length=500)
    shipping_city: Optional[str] = Field(None, max_length=100)
    shipping_postal_code: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None  # Optional notes for status change


class OrderResponse(BaseModel):
    id: UUID
    customer_id: UUID
    status: OrderStatus
    delivery_method: DeliveryMethod
    total_amount: Decimal
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None  # Fetched from user relationship

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: List[OrderResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Query parameters
class OrderFilter(BaseModel):
    status: Optional[OrderStatus] = None
    delivery_method: Optional[DeliveryMethod] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
