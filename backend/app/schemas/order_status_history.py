from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel

from app.models.order import OrderStatus


class OrderStatusHistoryResponse(BaseModel):
    id: UUID
    order_id: UUID
    old_status: Optional[OrderStatus] = None
    new_status: OrderStatus
    changed_by_user_id: Optional[UUID] = None
    changed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderStatusHistoryListResponse(BaseModel):
    items: List[OrderStatusHistoryResponse]
    total: int
