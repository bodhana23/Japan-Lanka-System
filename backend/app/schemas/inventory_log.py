"""Pydantic schemas for inventory logs."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.inventory_log import InventoryActionType, RelatedEntityType


class InventoryLogResponse(BaseModel):
    """Response schema for a single inventory log."""
    id: UUID
    actor_customer_id: Optional[UUID] = None
    actor_employee_id: Optional[UUID] = None
    actor_name: Optional[str] = None
    actor_email: Optional[str] = None
    actor_type: Optional[str] = None  # 'customer' or 'employee'
    action_type: InventoryActionType
    description: str
    related_entity_type: Optional[RelatedEntityType] = None
    related_entity_id: Optional[UUID] = None
    related_entity_summary: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InventoryLogListResponse(BaseModel):
    """Response schema for a list of inventory logs."""
    items: List[InventoryLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class InventoryLogFilter(BaseModel):
    """Filter schema for inventory logs."""
    action_type: Optional[InventoryActionType] = None
    related_entity_type: Optional[RelatedEntityType] = None
    actor_type: Optional[str] = None  # 'customer' or 'employee'
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)
