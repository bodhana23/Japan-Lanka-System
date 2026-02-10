import re
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.order import OrderStatus, DeliveryMethod, SalesChannel


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
    customer_id: Optional[UUID] = None  # Nullable for offline sales
    status: OrderStatus
    delivery_method: DeliveryMethod
    sales_channel: SalesChannel = SalesChannel.ONLINE
    total_amount: Decimal
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    offline_customer_name: Optional[str] = None  # For offline sales
    offline_customer_phone: Optional[str] = None  # For offline sales
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None  # Fetched from user relationship
    is_billable: bool = False  # Whether bill can be generated for this order

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
    sales_channel: Optional[SalesChannel] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


# Offline Sales schemas
class OfflineSaleItemCreate(BaseModel):
    """Item for offline sale with explicit unit price."""
    product_id: UUID
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., gt=0, description="Unit price for this item")


class OfflineSaleCreate(BaseModel):
    """Request schema for creating an offline sale (manager only)."""
    items: List[OfflineSaleItemCreate] = Field(..., min_length=1)
    customer_name: str = Field(..., min_length=1, max_length=200, description="Customer name is required")
    customer_phone: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None

    @field_validator('customer_phone')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        """Validate Sri Lankan phone number format (10 digits starting with 0)."""
        if v is None or v.strip() == '':
            return None
        # Remove spaces, dashes, and parentheses
        cleaned = re.sub(r'[\s\-()]', '', v)
        if not re.match(r'^0\d{9}$', cleaned):
            raise ValueError('Phone number must be 10 digits starting with 0 (e.g., 0771234567)')
        return cleaned


class OfflineSaleResponse(BaseModel):
    """Response schema for created offline sale."""
    id: UUID
    status: OrderStatus
    delivery_method: DeliveryMethod
    sales_channel: SalesChannel
    total_amount: Decimal
    offline_customer_name: Optional[str] = None
    offline_customer_phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse] = []
    message: str = "Offline sale created successfully"

    class Config:
        from_attributes = True
