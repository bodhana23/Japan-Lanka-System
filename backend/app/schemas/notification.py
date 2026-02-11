from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, computed_field

from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    customer_id: Optional[UUID] = None
    employee_id: Optional[UUID] = None
    title: str
    message: str
    type: NotificationType
    is_read: bool
    related_order_id: Optional[UUID] = None
    related_return_id: Optional[UUID] = None
    created_at: datetime

    @computed_field
    @property
    def user_id(self) -> UUID:
        """Return the user ID (either customer_id or employee_id)."""
        return self.customer_id or self.employee_id

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int
    page: int
    page_size: int
    total_pages: int


class UnreadCountResponse(BaseModel):
    unread_count: int
