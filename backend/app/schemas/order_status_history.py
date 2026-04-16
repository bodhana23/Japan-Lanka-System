from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, field_validator

from app.models.order import OrderStatus


class OrderStatusHistoryResponse(BaseModel):
    id: UUID
    order_id: UUID
    old_status: Optional[str] = None
    new_status: str
    changed_by_employee_id: Optional[UUID] = None
    changed_by_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    @field_validator('old_status', 'new_status', mode='before')
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        return str(v.value if hasattr(v, 'value') else v).lower()

    class Config:
        from_attributes = True


class OrderStatusHistoryListResponse(BaseModel):
    items: List[OrderStatusHistoryResponse]
    total: int
