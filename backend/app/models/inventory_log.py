"""Inventory log model for tracking inventory-related events."""

import uuid
from enum import Enum as PyEnum

from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base
from app.utils.timezone import get_current_time


class InventoryActionType(str, PyEnum):
    """Enum for inventory action types."""
    ORDER_PLACED = "order_placed"
    ORDER_STATUS_CHANGED = "order_status_changed"
    PRODUCT_CREATED = "product_created"
    PRODUCT_UPDATED = "product_updated"
    PRODUCT_DELETED = "product_deleted"
    STOCK_ADJUSTED = "stock_adjusted"
    RETURN_CREATED = "return_created"
    RETURN_APPROVED = "return_approved"
    RETURN_REJECTED = "return_rejected"
    RETURN_COMPLETED = "return_completed"


class RelatedEntityType(str, PyEnum):
    """Enum for related entity types."""
    ORDER = "order"
    PRODUCT = "product"
    RETURN_REQUEST = "return_request"


class InventoryLog(Base):
    """Inventory log model for tracking inventory-related events.

    This includes:
    - Order placement
    - Order status changes
    - New product/part additions
    - Stock updates
    - Return request creation, approval, rejection
    """

    __tablename__ = "inventory_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Actor: who triggered the action (customer or employee)
    actor_customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True, index=True)
    actor_employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=True, index=True)

    # Action details
    action_type = Column(
        Enum(InventoryActionType, name="inventory_action_type", create_type=True),
        nullable=False,
        index=True
    )
    description = Column(Text, nullable=False)

    # Related entity
    related_entity_type = Column(
        Enum(RelatedEntityType, name="related_entity_type", create_type=True),
        nullable=True,
        index=True
    )
    related_entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Timestamp
    created_at = Column(DateTime, default=get_current_time, nullable=False, index=True)

    # Relationships
    actor_customer = relationship("Customer", foreign_keys=[actor_customer_id])
    actor_employee = relationship("Employee", foreign_keys=[actor_employee_id])

    def __repr__(self):
        actor_id = self.actor_customer_id or self.actor_employee_id or "system"
        return f"<InventoryLog {self.action_type.value} by {actor_id}>"
