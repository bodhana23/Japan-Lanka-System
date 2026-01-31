from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.models.return_request import ReturnStatus


# Valid return reasons
VALID_REASONS = [
    "Damaged/Defective",
    "Wrong Item Received",
    "Item Not As Described",
    "Changed My Mind",
    "Other"
]


# Return Item schemas
class ReturnItemCreate(BaseModel):
    order_item_id: UUID
    quantity: int = Field(..., gt=0)


class ReturnItemResponse(BaseModel):
    id: UUID
    order_item_id: UUID
    quantity: int
    created_at: datetime
    # Order item info (enriched)
    product_id: Optional[UUID] = None
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    unit_price: Optional[float] = None
    original_quantity: Optional[int] = None

    class Config:
        from_attributes = True


# Return Request schemas
class ReturnRequestCreate(BaseModel):
    order_id: UUID
    reason: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    items: List[ReturnItemCreate] = Field(..., min_length=1)

    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        if v not in VALID_REASONS:
            raise ValueError(f"Invalid reason. Must be one of: {', '.join(VALID_REASONS)}")
        return v


class ReturnRequestStatusUpdate(BaseModel):
    status: ReturnStatus
    admin_notes: Optional[str] = Field(None, max_length=1000)


class ReturnRequestResponse(BaseModel):
    id: UUID
    order_id: UUID
    customer_id: UUID
    reason: str
    description: Optional[str] = None
    status: ReturnStatus
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    # Order info
    order_total: Optional[float] = None
    order_status: Optional[str] = None
    order_date: Optional[datetime] = None
    # Customer info (for managers)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    # Return items
    items: List[ReturnItemResponse] = []

    class Config:
        from_attributes = True


class ReturnRequestListResponse(BaseModel):
    items: List[ReturnRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Eligible order response
class EligibleOrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: float
    already_returned_quantity: int = 0
    returnable_quantity: int = 0

    class Config:
        from_attributes = True


class EligibleOrderResponse(BaseModel):
    id: UUID
    created_at: datetime
    total_amount: float
    status: str
    delivery_method: str
    items: List[EligibleOrderItemResponse]
    has_pending_return: bool = False

    class Config:
        from_attributes = True


class EligibleOrdersListResponse(BaseModel):
    items: List[EligibleOrderResponse]
    total: int
