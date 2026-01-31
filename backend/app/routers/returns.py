"""Returns router for return request management."""

from typing import Optional
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Customer, Employee, Order, ReturnRequest, OrderItem, ReturnItem
from app.models.return_request import ReturnStatus
from app.models.order import OrderStatus
from app.services.audit_service import log_inventory_event
from app.models.inventory_log import InventoryActionType, RelatedEntityType
from app.schemas.return_request import (
    ReturnRequestCreate,
    ReturnRequestStatusUpdate,
    ReturnRequestResponse,
    ReturnRequestListResponse,
    ReturnItemResponse,
    EligibleOrderResponse,
    EligibleOrderItemResponse,
    EligibleOrdersListResponse,
)
from app.utils.deps import get_current_user, get_current_customer, require_manager_or_admin, CurrentUser

router = APIRouter(prefix="/returns", tags=["Return Requests"])


def return_item_to_response(return_item: ReturnItem) -> ReturnItemResponse:
    """Convert ReturnItem model to ReturnItemResponse with related data."""
    order_item = return_item.order_item
    product = order_item.product if order_item else None

    return ReturnItemResponse(
        id=return_item.id,
        order_item_id=return_item.order_item_id,
        quantity=return_item.quantity,
        created_at=return_item.created_at,
        product_id=order_item.product_id if order_item else None,
        product_name=product.name if product else None,
        product_image=product.image_url if product else None,
        unit_price=float(order_item.unit_price) if order_item else None,
        original_quantity=order_item.quantity if order_item else None
    )


def return_request_to_response(return_req: ReturnRequest) -> ReturnRequestResponse:
    """Convert ReturnRequest model to ReturnRequestResponse with related data."""
    order = return_req.order
    customer = return_req.customer

    return ReturnRequestResponse(
        id=return_req.id,
        order_id=return_req.order_id,
        customer_id=return_req.customer_id,
        reason=return_req.reason,
        description=return_req.description,
        status=return_req.status,
        admin_notes=return_req.admin_notes,
        created_at=return_req.created_at,
        updated_at=return_req.updated_at,
        order_total=float(order.total_amount) if order else None,
        order_status=order.status.value if order else None,
        order_date=order.created_at if order else None,
        customer_name=customer.full_name if customer else None,
        customer_email=customer.email if customer else None,
        items=[return_item_to_response(item) for item in return_req.return_items]
    )


@router.get("/my-requests", response_model=ReturnRequestListResponse)
async def get_my_return_requests(
    status_filter: Optional[ReturnStatus] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get current customer's return requests."""
    query = db.query(ReturnRequest).filter(ReturnRequest.customer_id == current_customer.id)

    if status_filter:
        query = query.filter(ReturnRequest.status == status_filter)

    total = query.count()
    offset = (page - 1) * page_size
    return_requests = query.order_by(ReturnRequest.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ReturnRequestListResponse(
        items=[return_request_to_response(r) for r in return_requests],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/eligible-orders", response_model=EligibleOrdersListResponse)
async def get_eligible_orders(
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get orders eligible for return (delivered or ready_to_pickup) for the current customer."""
    # Get delivered or ready_to_pickup orders for this customer
    eligible_statuses = [OrderStatus.DELIVERED, OrderStatus.READY_TO_PICKUP]
    orders = db.query(Order).filter(
        Order.customer_id == current_customer.id,
        Order.status.in_(eligible_statuses)
    ).order_by(Order.created_at.desc()).all()

    result_orders = []
    for order in orders:
        # Check if there's a pending/approved return request for this order
        pending_return = db.query(ReturnRequest).filter(
            ReturnRequest.order_id == order.id,
            ReturnRequest.status.in_([ReturnStatus.PENDING, ReturnStatus.APPROVED])
        ).first()

        order_items = []
        for item in order.items:
            # Calculate already returned quantity for this item
            already_returned = db.query(func.coalesce(func.sum(ReturnItem.quantity), 0)).join(
                ReturnRequest
            ).filter(
                ReturnItem.order_item_id == item.id,
                ReturnRequest.status.in_([ReturnStatus.PENDING, ReturnStatus.APPROVED, ReturnStatus.COMPLETED])
            ).scalar()

            returnable_qty = item.quantity - already_returned

            order_items.append(EligibleOrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name if item.product else f"Product {item.product_id}",
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                already_returned_quantity=already_returned,
                returnable_quantity=returnable_qty
            ))

        # Only include order if it has items that can still be returned
        has_returnable_items = any(item.returnable_quantity > 0 for item in order_items)

        if has_returnable_items or not pending_return:
            result_orders.append(EligibleOrderResponse(
                id=order.id,
                created_at=order.created_at,
                total_amount=float(order.total_amount),
                status=order.status.value,
                delivery_method=order.delivery_method.value,
                items=order_items,
                has_pending_return=bool(pending_return)
            ))

    return EligibleOrdersListResponse(
        items=result_orders,
        total=len(result_orders)
    )


@router.post("", response_model=ReturnRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_return_request(
    return_data: ReturnRequestCreate,
    request: Request,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a new return request for an order with specific items."""
    # Get the order
    order = db.query(Order).filter(Order.id == return_data.order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Verify the order belongs to the current customer
    if order.customer_id != current_customer.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only request returns for your own orders"
        )

    # Check if order is eligible for return (delivered or ready_to_pickup)
    eligible_statuses = [OrderStatus.DELIVERED, OrderStatus.READY_TO_PICKUP]
    if order.status not in eligible_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order must be delivered or ready for pickup to request a return. Current status: {order.status.value}"
        )

    # Validate items
    order_item_ids = {str(item.id) for item in order.items}
    for return_item in return_data.items:
        if str(return_item.order_item_id) not in order_item_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order item {return_item.order_item_id} does not belong to this order"
            )

        # Get the order item
        order_item = db.query(OrderItem).filter(OrderItem.id == return_item.order_item_id).first()

        # Calculate already returned quantity
        already_returned = db.query(func.coalesce(func.sum(ReturnItem.quantity), 0)).join(
            ReturnRequest
        ).filter(
            ReturnItem.order_item_id == return_item.order_item_id,
            ReturnRequest.status.in_([ReturnStatus.PENDING, ReturnStatus.APPROVED, ReturnStatus.COMPLETED])
        ).scalar()

        returnable_qty = order_item.quantity - already_returned

        if return_item.quantity > returnable_qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot return {return_item.quantity} items. Only {returnable_qty} can be returned for this item."
            )

    # Create return request
    return_request = ReturnRequest(
        order_id=return_data.order_id,
        customer_id=current_customer.id,
        reason=return_data.reason,
        description=return_data.description,
        status=ReturnStatus.PENDING
    )
    db.add(return_request)
    db.flush()

    # Create return items
    for item_data in return_data.items:
        return_item = ReturnItem(
            return_request_id=return_request.id,
            order_item_id=item_data.order_item_id,
            quantity=item_data.quantity
        )
        db.add(return_item)

    # Log inventory event for return request creation
    log_inventory_event(
        db=db,
        action_type=InventoryActionType.RETURN_CREATED,
        description=f"Return request created by {current_customer.email} for Order #{str(order.id)[:8]} ({len(return_data.items)} items)",
        actor_customer_id=current_customer.id,
        related_entity_type=RelatedEntityType.RETURN_REQUEST,
        related_entity_id=return_request.id
    )

    db.commit()
    db.refresh(return_request)

    return return_request_to_response(return_request)


@router.get("", response_model=ReturnRequestListResponse)
async def list_return_requests(
    status_filter: Optional[ReturnStatus] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List return requests.

    - Customers see only their own return requests
    - Managers and Admins see all return requests
    """
    query = db.query(ReturnRequest)

    # Role-based filtering: customers see only their return requests
    if isinstance(current_user, Customer):
        query = query.filter(ReturnRequest.customer_id == current_user.id)

    if status_filter:
        query = query.filter(ReturnRequest.status == status_filter)

    total = query.count()
    offset = (page - 1) * page_size
    return_requests = query.order_by(ReturnRequest.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return ReturnRequestListResponse(
        items=[return_request_to_response(r) for r in return_requests],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{return_id}", response_model=ReturnRequestResponse)
async def get_return_request(
    return_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single return request by ID."""
    return_request = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()

    if not return_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found"
        )

    # Customers can only view their own return requests
    if isinstance(current_user, Customer) and return_request.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return return_request_to_response(return_request)


@router.put("/{return_id}/status", response_model=ReturnRequestResponse)
async def update_return_request_status(
    return_id: UUID,
    status_update: ReturnRequestStatusUpdate,
    request: Request,
    current_employee: Employee = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Update return request status. Manager or Admin only.

    Business rules:
    - A return request can only be approved or rejected once (from PENDING status)
    - Approved requests cannot be modified again
    - Rejected requests must include a reason message (admin_notes)
    """
    return_request = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()

    if not return_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found"
        )

    old_status = return_request.status

    # Business rule: Only PENDING requests can be approved or rejected
    if old_status != ReturnStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot modify return request. Current status is '{old_status.value}'. Only pending requests can be approved or rejected."
        )

    # Business rule: Rejected requests must include a reason message
    if status_update.status == ReturnStatus.REJECTED:
        if not status_update.admin_notes or not status_update.admin_notes.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A reason message is required when rejecting a return request."
            )

    return_request.status = status_update.status

    if status_update.admin_notes:
        return_request.admin_notes = status_update.admin_notes

    # Determine action type based on new status
    if status_update.status == ReturnStatus.APPROVED:
        action_type = InventoryActionType.RETURN_APPROVED
        description = f"Return request approved by {current_employee.email}"
    elif status_update.status == ReturnStatus.REJECTED:
        action_type = InventoryActionType.RETURN_REJECTED
        description = f"Return request rejected by {current_employee.email}: {status_update.admin_notes}"
    elif status_update.status == ReturnStatus.COMPLETED:
        action_type = InventoryActionType.RETURN_COMPLETED
        description = f"Return request completed by {current_employee.email}"
    else:
        action_type = InventoryActionType.RETURN_CREATED  # Fallback
        description = f"Return request status changed to {status_update.status.value} by {current_employee.email}"

    # Log inventory event for return status change
    log_inventory_event(
        db=db,
        action_type=action_type,
        description=description,
        actor_employee_id=current_employee.id,
        related_entity_type=RelatedEntityType.RETURN_REQUEST,
        related_entity_id=return_request.id
    )

    db.commit()
    db.refresh(return_request)

    return return_request_to_response(return_request)
