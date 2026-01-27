"""Auditor router for accessing inventory and activity logs."""

from datetime import datetime
from typing import Optional
import math

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee, Customer, Product, Order, ReturnRequest
from app.models.inventory_log import InventoryLog, InventoryActionType, RelatedEntityType
from app.models.activity_log import ActivityLog, ActivityType
from app.schemas.inventory_log import (
    InventoryLogResponse,
    InventoryLogListResponse,
)
from app.schemas.activity_log import (
    ActivityLogResponse,
    ActivityLogListResponse,
)
from app.utils.deps import require_auditor

router = APIRouter(prefix="/auditor", tags=["Auditor"])


def get_actor_info(log: InventoryLog, db: Session) -> tuple:
    """Get actor name, email, and type for an inventory log."""
    if log.actor_customer_id:
        customer = db.query(Customer).filter(Customer.id == log.actor_customer_id).first()
        if customer:
            return customer.full_name, customer.email, "customer"
    elif log.actor_employee_id:
        employee = db.query(Employee).filter(Employee.id == log.actor_employee_id).first()
        if employee:
            return employee.full_name, employee.email, "employee"
    return None, None, None


def get_user_info(log: ActivityLog, db: Session) -> tuple:
    """Get user name, email, and type for an activity log."""
    if log.customer_id:
        customer = db.query(Customer).filter(Customer.id == log.customer_id).first()
        if customer:
            return customer.full_name, customer.email, "customer"
    elif log.employee_id:
        employee = db.query(Employee).filter(Employee.id == log.employee_id).first()
        if employee:
            return employee.full_name, employee.email, "employee"
    return None, None, None


def get_related_entity_summary(log: InventoryLog, db: Session) -> Optional[str]:
    """Get a summary of the related entity for an inventory log."""
    if not log.related_entity_type or not log.related_entity_id:
        return None

    if log.related_entity_type == RelatedEntityType.ORDER:
        order = db.query(Order).filter(Order.id == log.related_entity_id).first()
        if order:
            return f"Order #{str(order.id)[:8]} - Rs. {order.total_amount:.2f}"
    elif log.related_entity_type == RelatedEntityType.PRODUCT:
        product = db.query(Product).filter(Product.id == log.related_entity_id).first()
        if product:
            return f"{product.name} ({product.brand})"
    elif log.related_entity_type == RelatedEntityType.RETURN_REQUEST:
        return_req = db.query(ReturnRequest).filter(ReturnRequest.id == log.related_entity_id).first()
        if return_req:
            return f"Return #{str(return_req.id)[:8]} - {return_req.reason}"

    return None


def inventory_log_to_response(log: InventoryLog, db: Session) -> InventoryLogResponse:
    """Convert InventoryLog model to InventoryLogResponse with related data."""
    actor_name, actor_email, actor_type = get_actor_info(log, db)
    related_entity_summary = get_related_entity_summary(log, db)

    return InventoryLogResponse(
        id=log.id,
        actor_customer_id=log.actor_customer_id,
        actor_employee_id=log.actor_employee_id,
        actor_name=actor_name,
        actor_email=actor_email,
        actor_type=actor_type,
        action_type=log.action_type,
        description=log.description,
        related_entity_type=log.related_entity_type,
        related_entity_id=log.related_entity_id,
        related_entity_summary=related_entity_summary,
        created_at=log.created_at
    )


def activity_log_to_response(log: ActivityLog, db: Session) -> ActivityLogResponse:
    """Convert ActivityLog model to ActivityLogResponse with related data."""
    user_name, user_email, user_type = get_user_info(log, db)

    return ActivityLogResponse(
        id=log.id,
        customer_id=log.customer_id,
        employee_id=log.employee_id,
        user_name=user_name,
        user_email=user_email,
        user_type=user_type,
        activity_type=log.activity_type,
        description=log.description,
        ip_address=log.ip_address,
        user_agent=log.user_agent,
        created_at=log.created_at
    )


@router.get("/inventory-logs", response_model=InventoryLogListResponse)
async def get_inventory_logs(
    action_type: Optional[InventoryActionType] = Query(None, description="Filter by action type"),
    related_entity_type: Optional[RelatedEntityType] = Query(None, description="Filter by related entity type"),
    actor_type: Optional[str] = Query(None, description="Filter by actor type (customer or employee)"),
    from_date: Optional[datetime] = Query(None, description="Filter from this date"),
    to_date: Optional[datetime] = Query(None, description="Filter until this date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_employee: Employee = Depends(require_auditor),
    db: Session = Depends(get_db)
):
    """Get paginated inventory logs. Auditor or Admin only.

    Returns inventory-related events including:
    - Order placement and status changes
    - Product creation, updates, and deletions
    - Stock adjustments
    - Return request lifecycle changes
    """
    query = db.query(InventoryLog)

    # Apply filters
    if action_type:
        query = query.filter(InventoryLog.action_type == action_type)
    if related_entity_type:
        query = query.filter(InventoryLog.related_entity_type == related_entity_type)
    if actor_type == "customer":
        query = query.filter(InventoryLog.actor_customer_id.isnot(None))
    elif actor_type == "employee":
        query = query.filter(InventoryLog.actor_employee_id.isnot(None))
    if from_date:
        query = query.filter(InventoryLog.created_at >= from_date)
    if to_date:
        query = query.filter(InventoryLog.created_at <= to_date)

    # Get total count
    total = query.count()

    # Apply pagination and sorting
    offset = (page - 1) * page_size
    logs = query.order_by(InventoryLog.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return InventoryLogListResponse(
        items=[inventory_log_to_response(log, db) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/activity-logs", response_model=ActivityLogListResponse)
async def get_activity_logs(
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    user_type: Optional[str] = Query(None, description="Filter by user type (customer or employee)"),
    from_date: Optional[datetime] = Query(None, description="Filter from this date"),
    to_date: Optional[datetime] = Query(None, description="Filter until this date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_employee: Employee = Depends(require_auditor),
    db: Session = Depends(get_db)
):
    """Get paginated activity logs. Auditor or Admin only.

    Returns user account-related activities including:
    - User registration
    - Login and logout
    - Password changes
    - Profile updates
    - Role changes
    - Account deletion
    """
    query = db.query(ActivityLog)

    # Apply filters
    if activity_type:
        query = query.filter(ActivityLog.activity_type == activity_type)
    if user_type == "customer":
        query = query.filter(ActivityLog.customer_id.isnot(None))
    elif user_type == "employee":
        query = query.filter(ActivityLog.employee_id.isnot(None))
    if from_date:
        query = query.filter(ActivityLog.created_at >= from_date)
    if to_date:
        query = query.filter(ActivityLog.created_at <= to_date)

    # Get total count
    total = query.count()

    # Apply pagination and sorting
    offset = (page - 1) * page_size
    logs = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ActivityLogListResponse(
        items=[activity_log_to_response(log, db) for log in logs],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
