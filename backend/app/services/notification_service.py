"""Notification service for creating and managing notifications."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models import Notification
from app.models.notification import NotificationType


class NotificationService:
    """Service for creating and managing notifications."""

    def __init__(self, db: Session):
        self.db = db

    def create_customer_notification(
        self,
        customer_id: UUID,
        title: str,
        message: str,
        notification_type: NotificationType,
        related_order_id: Optional[UUID] = None,
        related_return_id: Optional[UUID] = None
    ) -> Notification:
        """Create a new notification for a customer."""
        notification = Notification(
            customer_id=customer_id,
            title=title,
            message=message,
            type=notification_type,
            related_order_id=related_order_id,
            related_return_id=related_return_id
        )
        self.db.add(notification)
        return notification

    def create_employee_notification(
        self,
        employee_id: UUID,
        title: str,
        message: str,
        notification_type: NotificationType,
        related_order_id: Optional[UUID] = None,
        related_return_id: Optional[UUID] = None
    ) -> Notification:
        """Create a new notification for an employee."""
        notification = Notification(
            employee_id=employee_id,
            title=title,
            message=message,
            type=notification_type,
            related_order_id=related_order_id,
            related_return_id=related_return_id
        )
        self.db.add(notification)
        return notification

    def create_order_notification_for_customer(
        self,
        customer_id: UUID,
        order_id: UUID,
        title: str,
        message: str
    ) -> Notification:
        """Create an order-related notification for a customer."""
        return self.create_customer_notification(
            customer_id=customer_id,
            title=title,
            message=message,
            notification_type=NotificationType.ORDER_UPDATE,
            related_order_id=order_id
        )

    def create_return_notification_for_customer(
        self,
        customer_id: UUID,
        return_id: UUID,
        title: str,
        message: str
    ) -> Notification:
        """Create a return request-related notification for a customer."""
        return self.create_customer_notification(
            customer_id=customer_id,
            title=title,
            message=message,
            notification_type=NotificationType.RETURN_UPDATE,
            related_return_id=return_id
        )

    def create_system_notification_for_customer(
        self,
        customer_id: UUID,
        title: str,
        message: str
    ) -> Notification:
        """Create a system notification for a customer."""
        return self.create_customer_notification(
            customer_id=customer_id,
            title=title,
            message=message,
            notification_type=NotificationType.SYSTEM
        )

    def create_system_notification_for_employee(
        self,
        employee_id: UUID,
        title: str,
        message: str
    ) -> Notification:
        """Create a system notification for an employee."""
        return self.create_employee_notification(
            employee_id=employee_id,
            title=title,
            message=message,
            notification_type=NotificationType.SYSTEM
        )


# Convenience functions for use without instantiating the service
def notify_order_status_change(
    db: Session,
    customer_id: UUID,
    order_id: UUID,
    old_status: str,
    new_status: str
) -> Notification:
    """Send notification to customer when order status changes."""
    service = NotificationService(db)

    status_messages = {
        "confirmed": "Your order has been confirmed and is being processed.",
        "shipped": "Your order has been shipped and is on its way!",
        "ready_to_pickup": "Your order is ready for pickup at our store.",
        "delivered": "Your order has been delivered. Thank you for shopping with us!",
        "cancelled": "Your order has been cancelled."
    }

    message = status_messages.get(
        new_status,
        f"Your order status has been updated from {old_status} to {new_status}."
    )

    return service.create_order_notification_for_customer(
        customer_id=customer_id,
        order_id=order_id,
        title=f"Order Status: {new_status.replace('_', ' ').title()}",
        message=message
    )


def notify_return_status_change(
    db: Session,
    customer_id: UUID,
    return_id: UUID,
    new_status: str
) -> Notification:
    """Send notification to customer when return request status changes."""
    service = NotificationService(db)

    status_messages = {
        "approved": "Your return request has been approved. Please follow the return instructions.",
        "rejected": "Your return request has been rejected. Please contact support for more information.",
        "completed": "Your return has been processed and refund has been initiated."
    }

    message = status_messages.get(
        new_status,
        f"Your return request status has been updated to {new_status}."
    )

    return service.create_return_notification_for_customer(
        customer_id=customer_id,
        return_id=return_id,
        title=f"Return Request: {new_status.title()}",
        message=message
    )
