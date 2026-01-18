from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel

from app.models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    message: str
    type: NotificationType
    is_read: bool
    related_order_id: Optional[UUID] = None
    related_return_id: Optional[UUID] = None
    created_at: datetime

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
