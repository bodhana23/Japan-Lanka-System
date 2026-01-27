"""Audit service for logging inventory and activity events."""

from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.inventory_log import InventoryLog, InventoryActionType, RelatedEntityType
from app.models.activity_log import ActivityLog, ActivityType


class AuditService:
    """Service for logging inventory and activity events."""

    def __init__(self, db: Session):
        self.db = db

    def log_inventory_event(
        self,
        action_type: InventoryActionType,
        description: str,
        actor_customer_id: Optional[UUID] = None,
        actor_employee_id: Optional[UUID] = None,
        related_entity_type: Optional[RelatedEntityType] = None,
        related_entity_id: Optional[UUID] = None
    ) -> InventoryLog:
        """Log an inventory-related event.

        Args:
            action_type: The type of inventory action
            description: Human-readable description of the event
            actor_customer_id: ID of the customer who triggered the action (if any)
            actor_employee_id: ID of the employee who triggered the action (if any)
            related_entity_type: Type of related entity (order, product, return_request)
            related_entity_id: ID of the related entity
        """
        log = InventoryLog(
            action_type=action_type,
            description=description,
            actor_customer_id=actor_customer_id,
            actor_employee_id=actor_employee_id,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id
        )
        self.db.add(log)
        return log

    def log_activity_event(
        self,
        activity_type: ActivityType,
        description: str,
        customer_id: Optional[UUID] = None,
        employee_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> ActivityLog:
        """Log a user account-related activity.

        Args:
            activity_type: The type of activity
            description: Human-readable description of the activity
            customer_id: ID of the customer (if applicable)
            employee_id: ID of the employee (if applicable)
            ip_address: IP address of the request
            user_agent: User agent string of the request
        """
        log = ActivityLog(
            activity_type=activity_type,
            description=description,
            customer_id=customer_id,
            employee_id=employee_id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(log)
        return log


# Convenience functions for use without instantiating the service

def log_inventory_event(
    db: Session,
    action_type: InventoryActionType,
    description: str,
    actor_customer_id: Optional[UUID] = None,
    actor_employee_id: Optional[UUID] = None,
    related_entity_type: Optional[RelatedEntityType] = None,
    related_entity_id: Optional[UUID] = None
) -> InventoryLog:
    """Log an inventory-related event.

    Args:
        db: Database session
        action_type: The type of inventory action
        description: Human-readable description of the event
        actor_customer_id: ID of the customer who triggered the action (if any)
        actor_employee_id: ID of the employee who triggered the action (if any)
        related_entity_type: Type of related entity (order, product, return_request)
        related_entity_id: ID of the related entity
    """
    service = AuditService(db)
    return service.log_inventory_event(
        action_type=action_type,
        description=description,
        actor_customer_id=actor_customer_id,
        actor_employee_id=actor_employee_id,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id
    )


def log_activity_event(
    db: Session,
    activity_type: ActivityType,
    description: str,
    customer_id: Optional[UUID] = None,
    employee_id: Optional[UUID] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> ActivityLog:
    """Log a user account-related activity.

    Args:
        db: Database session
        activity_type: The type of activity
        description: Human-readable description of the activity
        customer_id: ID of the customer (if applicable)
        employee_id: ID of the employee (if applicable)
        ip_address: IP address of the request
        user_agent: User agent string of the request
    """
    service = AuditService(db)
    return service.log_activity_event(
        activity_type=activity_type,
        description=description,
        customer_id=customer_id,
        employee_id=employee_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
