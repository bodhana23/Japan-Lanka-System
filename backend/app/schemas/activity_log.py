"""Pydantic schemas for activity logs."""

from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.activity_log import ActivityType


class ActivityLogResponse(BaseModel):
    """Response schema for a single activity log."""
    id: UUID
    customer_id: Optional[UUID] = None
    employee_id: Optional[UUID] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_type: Optional[str] = None  # 'customer' or 'employee'
    activity_type: ActivityType
    description: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ActivityLogListResponse(BaseModel):
    """Response schema for a list of activity logs."""
    items: List[ActivityLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ActivityLogFilter(BaseModel):
    """Filter schema for activity logs."""
    activity_type: Optional[ActivityType] = None
    user_type: Optional[str] = None  # 'customer' or 'employee'
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=100)
