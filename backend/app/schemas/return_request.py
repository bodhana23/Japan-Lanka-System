from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.return_request import ReturnStatus


# Return Request schemas
class ReturnRequestCreate(BaseModel):
    order_id: UUID
    reason: str = Field(..., min_length=10, max_length=1000)


class ReturnRequestStatusUpdate(BaseModel):
    status: ReturnStatus
    admin_notes: Optional[str] = Field(None, max_length=1000)


class ReturnRequestResponse(BaseModel):
    id: UUID
    order_id: UUID
    user_id: UUID
    reason: str
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

    class Config:
        from_attributes = True


class ReturnRequestListResponse(BaseModel):
    items: List[ReturnRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
