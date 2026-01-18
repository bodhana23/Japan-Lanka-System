from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.inventory_transaction import TransactionType


class InventoryAdjustmentCreate(BaseModel):
    product_id: UUID
    quantity_change: int = Field(..., description="Positive for stock in, negative for stock out")
    reason: str = Field(..., min_length=1, max_length=500)


class InventoryTransactionResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: Optional[str] = None
    product_brand: Optional[str] = None
    user_id: Optional[UUID] = None
    user_name: Optional[str] = None
    transaction_type: TransactionType
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reason: Optional[str] = None
    reference_order_id: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryTransactionListResponse(BaseModel):
    items: List[InventoryTransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
