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
        "in_progress": "Your order is now in progress and is being processed.",
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


def notify_managers_new_order(db: Session, order) -> None:
    """Send notifications to all managers when a new order is placed.

    This function is transaction-safe: it only calls db.add() and does NOT commit.
    The caller is responsible for committing the transaction.

    Args:
        db: Database session
        order: The newly created Order object
    """
    from app.models.employee import Employee, EmployeeRole

    service = NotificationService(db)

    # Get all active managers
    managers = db.query(Employee).filter(
        Employee.role == EmployeeRole.MANAGER,
        Employee.is_active == True
    ).all()

    # Create order display ID (first 8 chars of UUID)
    order_id_short = str(order.id)[:8].upper()

    for manager in managers:
        service.create_employee_notification(
            employee_id=manager.id,
            title="New Order Placed",
            message=f"Order #{order_id_short} has been placed. Total: Rs. {order.total_amount:.2f}",
            notification_type=NotificationType.ORDER_UPDATE,
            related_order_id=order.id
        )


def notify_managers_new_return(db: Session, return_request) -> None:
    """Send notifications to all managers when a new return request is submitted.

    This function is transaction-safe: it only calls db.add() and does NOT commit.
    The caller is responsible for committing the transaction.

    Args:
        db: Database session
        return_request: The newly created ReturnRequest object
    """
    from app.models.employee import Employee, EmployeeRole

    service = NotificationService(db)

    # Get all active managers
    managers = db.query(Employee).filter(
        Employee.role == EmployeeRole.MANAGER,
        Employee.is_active == True
    ).all()

    # Create order display ID from related order
    order_id_short = str(return_request.order_id)[:8].upper()

    for manager in managers:
        service.create_employee_notification(
            employee_id=manager.id,
            title="New Return Request",
            message=f"A return request has been submitted for Order #{order_id_short}.",
            notification_type=NotificationType.RETURN_UPDATE,
            related_return_id=return_request.id,
            related_order_id=return_request.order_id
        )


def notify_managers_order_cancelled(db: Session, order) -> None:
    """Send notifications to all managers when a customer cancels an order.

    This function is transaction-safe: it only calls db.add() and does NOT commit.
    The caller is responsible for committing the transaction.

    Args:
        db: Database session
        order: The cancelled Order object (with customer loaded)
    """
    from app.models.employee import Employee, EmployeeRole

    service = NotificationService(db)

    managers = db.query(Employee).filter(
        Employee.role == EmployeeRole.MANAGER,
        Employee.is_active == True
    ).all()

    order_id_short = str(order.id)[:8].upper()
    customer_name = order.customer.full_name if order.customer else "Unknown"

    for manager in managers:
        service.create_employee_notification(
            employee_id=manager.id,
            title="Order Cancelled by Customer",
            message=f"Order #{order_id_short} has been cancelled by {customer_name}. Stock has been restored.",
            notification_type=NotificationType.ORDER_UPDATE,
            related_order_id=order.id
        )


LOW_STOCK_THRESHOLD = 3


def notify_admins_low_stock(db: Session, product_name: str, current_qty: int) -> None:
    """Send low stock alert to all active admin employees when stock drops to threshold.

    This function is transaction-safe: it only calls db.add() and does NOT commit.
    The caller is responsible for committing the transaction.

    Args:
        db: Database session
        product_name: The name of the product that is low on stock
        current_qty: The current quantity remaining after the deduction
    """
    from app.models.employee import Employee, EmployeeRole

    service = NotificationService(db)

    admins = db.query(Employee).filter(
        Employee.role == EmployeeRole.ADMIN,
        Employee.is_active == True
    ).all()

    for admin in admins:
        service.create_system_notification_for_employee(
            employee_id=admin.id,
            title="Low Stock Alert",
            message=f"'{product_name}' is running low. Only {current_qty} unit(s) remaining."
        )


def notify_return_status_change(
    db: Session,
    customer_id: UUID,
    return_id: UUID,
    new_status: str
) -> Notification:
    """Send notification to customer when return request status changes.

    This function is transaction-safe: it only calls db.add() and does NOT commit.
    The caller is responsible for committing the transaction.

    Args:
        db: Database session
        customer_id: The customer to notify
        return_id: The related return request ID
        new_status: The new status value (pending, approved, rejected, completed)

    Returns:
        The created Notification object (not yet committed)
    """
    service = NotificationService(db)

    # Status → Message mapping for return request notifications
    status_messages = {
        "pending": "Your return request is under review.",
        "approved": "Your return request has been approved.",
        "rejected": "Your return request has been rejected.",
        "completed": "Your refund has been processed successfully."
    }

    # Status → Title mapping for cleaner titles
    status_titles = {
        "pending": "Return Status: Pending",
        "approved": "Return Status: Approved",
        "rejected": "Return Status: Rejected",
        "completed": "Return Status: Completed"
    }

    message = status_messages.get(
        new_status,
        f"Your return request status has been updated to {new_status}."
    )

    title = status_titles.get(
        new_status,
        f"Return Status: {new_status.replace('_', ' ').title()}"
    )

    return service.create_return_notification_for_customer(
        customer_id=customer_id,
        return_id=return_id,
        title=title,
        message=message
    )
