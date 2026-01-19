"""Notifications router for user notifications."""

from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Notification, Customer, Employee
from app.models.notification import NotificationType
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.utils.deps import get_current_user, CurrentUser

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_user_notification_filter(current_user: CurrentUser):
    """Get the appropriate notification filter based on user type."""
    if isinstance(current_user, Customer):
        return Notification.customer_id == current_user.id
    else:  # Employee
        return Notification.employee_id == current_user.id


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    type_filter: NotificationType = Query(None, alias="type", description="Filter by notification type"),
    unread_only: bool = Query(False, description="Show only unread notifications"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's notifications (paginated)."""
    user_filter = get_user_notification_filter(current_user)
    query = db.query(Notification).filter(user_filter)

    if type_filter:
        query = query.filter(Notification.type == type_filter)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    # Get total and unread counts
    total = query.count()
    unread_count = db.query(Notification).filter(
        user_filter,
        Notification.is_read == False
    ).count()

    # Apply pagination
    offset = (page - 1) * page_size
    notifications = query.order_by(Notification.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications."""
    user_filter = get_user_notification_filter(current_user)
    unread_count = db.query(Notification).filter(
        user_filter,
        Notification.is_read == False
    ).count()

    return UnreadCountResponse(unread_count=unread_count)


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_as_read(
    notification_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    user_filter = get_user_notification_filter(current_user)
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        user_filter
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notification.is_read = True
    db.commit()
    db.refresh(notification)

    return NotificationResponse.model_validate(notification)


@router.put("/read-all")
async def mark_all_as_read(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read."""
    user_filter = get_user_notification_filter(current_user)
    updated_count = db.query(Notification).filter(
        user_filter,
        Notification.is_read == False
    ).update({"is_read": True})

    db.commit()

    return {"message": f"Marked {updated_count} notifications as read"}


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification."""
    user_filter = get_user_notification_filter(current_user)
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        user_filter
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted"}
