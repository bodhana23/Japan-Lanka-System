import re
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.order import OrderStatus, DeliveryMethod, SalesChannel, PaymentStatus


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
    shipping_district: Optional[str] = Field(None, max_length=100)
    shipping_address: Optional[str] = Field(None, max_length=500)
    shipping_city: Optional[str] = Field(None, max_length=100)
    shipping_postal_code: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_length=1)
    # Payment options for online checkout
    pay_full_amount: bool = Field(True, description="If True, pay 100%. If False, pay minimum 30% for delivery orders.")

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None  # Optional notes for status change


class OrderResponse(BaseModel):
    id: UUID
    customer_id: Optional[UUID] = None  # Nullable for offline sales
    status: str  # stored as plain string to tolerate legacy uppercase values from DB
    delivery_method: DeliveryMethod

    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        return str(v.value if hasattr(v, 'value') else v).lower()
    sales_channel: SalesChannel = SalesChannel.ONLINE
    total_amount: Decimal
    subtotal: Optional[Decimal] = None
    delivery_fee: Optional[Decimal] = None
    paid_amount: Optional[Decimal] = None
    remaining_amount: Optional[Decimal] = None
    payment_status: PaymentStatus = PaymentStatus.NOT_PAID
    shipping_district: Optional[str] = None
    shipping_address: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_postal_code: Optional[str] = None
    offline_customer_name: Optional[str] = None  # For offline sales
    offline_customer_phone: Optional[str] = None  # For offline sales
    payhere_payment_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None  # Fetched from user relationship
    is_billable: bool = False  # Whether bill can be generated for this order
    has_return_request: bool = False  # Whether a return request exists for this order
    # Return summary when return is approved (shows which items were returned)
    return_status: Optional[str] = None  # e.g. 'approved', 'pending', 'rejected', 'completed'
    return_admin_notes: Optional[str] = None  # Manager notes from the return decision
    return_items: Optional[List["ReturnItemSummary"]] = None  # Items that were returned


class ReturnItemSummary(BaseModel):
    """Lightweight return item embedded in OrderResponse."""
    order_item_id: UUID
    product_name: Optional[str] = None
    returned_quantity: int
    original_quantity: int
    unit_price: Decimal

    class Config:
        from_attributes = True


# Resolve the forward reference used in OrderResponse
OrderResponse.model_rebuild()


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
    status: str
    delivery_method: DeliveryMethod

    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        return str(v.value if hasattr(v, 'value') else v).lower()
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


# ============ PAYHERE CHECKOUT SCHEMAS ============

class CheckoutCalculation(BaseModel):
    """Response for checkout calculation (preview before payment)."""
    subtotal: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    minimum_payment: Decimal  # 30% of total for delivery
    full_payment: Decimal  # 100% of total
    delivery_method: DeliveryMethod
    district: Optional[str] = None
    requires_payment: bool  # True for delivery, False for pickup (optional payment)


class InitiateCheckoutRequest(BaseModel):
    """Request to initiate checkout and get PayHere form data."""
    delivery_method: DeliveryMethod
    shipping_district: Optional[str] = Field(None, max_length=100)
    shipping_address: Optional[str] = Field(None, max_length=500)
    shipping_city: Optional[str] = Field(None, max_length=100)
    shipping_postal_code: Optional[str] = Field(None, max_length=20)
    notes: Optional[str] = None
    items: List[OrderItemCreate] = Field(..., min_length=1)
    pay_full_amount: bool = Field(True, description="True = pay 100%, False = pay 30% minimum")
    skip_payment: bool = Field(False, description="For pickup orders: skip payment entirely")

class PayHereFormData(BaseModel):
    """Data required to submit PayHere checkout form."""
    merchant_id: str
    return_url: str
    cancel_url: str
    notify_url: str
    order_id: str
    items: str  # Item description
    currency: str = "LKR"
    amount: str  # Amount to pay now
    first_name: str
    last_name: str
    email: str
    phone: str
    address: str
    city: str
    country: str = "Sri Lanka"
    # Optional hash for production
    hash: Optional[str] = None


class InitiateCheckoutResponse(BaseModel):
    """Response with order details and PayHere form data."""
    order_id: str
    subtotal: Decimal
    delivery_fee: Decimal
    total_amount: Decimal
    pay_now_amount: Decimal
    remaining_cod_amount: Decimal
    payment_status: PaymentStatus
    delivery_method: DeliveryMethod
    requires_payment: bool
    payhere_form_data: Optional[PayHereFormData] = None
    message: str


class PickupOrderCreate(BaseModel):
    """Request to create a pickup order (optionally without payment)."""
    items: List[OrderItemCreate] = Field(..., min_length=1)
    notes: Optional[str] = None
    pay_now: bool = Field(False, description="If True, customer wants to pay via PayHere")
    pay_full_amount: bool = Field(True, description="If pay_now=True: pay 100% or not")


class PickupOrderResponse(BaseModel):
    """Response for pickup order creation."""
    order_id: str
    status: str
    payment_status: PaymentStatus

    @field_validator('status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        return str(v.value if hasattr(v, 'value') else v).lower()
    total_amount: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    requires_payment: bool
    payhere_form_data: Optional[PayHereFormData] = None
    message: str
