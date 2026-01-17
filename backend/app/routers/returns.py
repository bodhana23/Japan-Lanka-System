from typing import Optional
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Order, ReturnRequest, AuditLog
from app.models.return_request import ReturnStatus
from app.models.order import OrderStatus
from app.schemas.return_request import (
    ReturnRequestCreate,
    ReturnRequestStatusUpdate,
    ReturnRequestResponse,
    ReturnRequestListResponse,
)
from app.utils.deps import get_current_user, require_manager_or_admin

router = APIRouter(prefix="/returns", tags=["Return Requests"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def return_request_to_response(return_req: ReturnRequest) -> ReturnRequestResponse:
    """Convert ReturnRequest model to ReturnRequestResponse with related data."""
    order = return_req.order
    user = return_req.user

    return ReturnRequestResponse(
        id=return_req.id,
        order_id=return_req.order_id,
        user_id=return_req.user_id,
        reason=return_req.reason,
        status=return_req.status,
        admin_notes=return_req.admin_notes,
        created_at=return_req.created_at,
        updated_at=return_req.updated_at,
        order_total=float(order.total_amount) if order else None,
        order_status=order.status.value if order else None,
        order_date=order.created_at if order else None,
        customer_name=user.full_name if user else None,
        customer_email=user.email if user else None
    )


@router.get("/my-requests", response_model=ReturnRequestListResponse)
async def get_my_return_requests(
    status_filter: Optional[ReturnStatus] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current customer's return requests."""
    query = db.query(ReturnRequest).filter(ReturnRequest.user_id == current_user.id)

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


@router.post("", response_model=ReturnRequestResponse, status_code=status.HTTP_201_CREATED)
async def create_return_request(
    return_data: ReturnRequestCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new return request for an order."""
    # Get the order
    order = db.query(Order).filter(Order.id == return_data.order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Verify the order belongs to the current user
    if order.user_id != current_user.id:
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

    # Check if there's already a pending/approved return request for this order
    existing_request = db.query(ReturnRequest).filter(
        ReturnRequest.order_id == return_data.order_id,
        ReturnRequest.status.in_([ReturnStatus.PENDING, ReturnStatus.APPROVED])
    ).first()

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A return request already exists for this order"
        )

    # Create return request
    return_request = ReturnRequest(
        order_id=return_data.order_id,
        user_id=current_user.id,
        reason=return_data.reason,
        status=ReturnStatus.PENDING
    )
    db.add(return_request)
    db.flush()

    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="return_request_created",
        entity_type="return_request",
        entity_id=str(return_request.id),
        details={"order_id": str(return_data.order_id), "reason": return_data.reason[:100]},
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(return_request)

    return return_request_to_response(return_request)


@router.get("", response_model=ReturnRequestListResponse)
async def list_return_requests(
    status_filter: Optional[ReturnStatus] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List return requests.

    - Customers see only their own return requests
    - Managers and Admins see all return requests
    """
    query = db.query(ReturnRequest)

    # Role-based filtering
    if current_user.role.value == "customer":
        query = query.filter(ReturnRequest.user_id == current_user.id)

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
    current_user: User = Depends(get_current_user),
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
    if current_user.role.value == "customer" and return_request.user_id != current_user.id:
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
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Update return request status. Manager or Admin only."""
    return_request = db.query(ReturnRequest).filter(ReturnRequest.id == return_id).first()

    if not return_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Return request not found"
        )

    old_status = return_request.status
    return_request.status = status_update.status

    if status_update.admin_notes:
        return_request.admin_notes = status_update.admin_notes

    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="return_request_status_updated",
        entity_type="return_request",
        entity_id=str(return_request.id),
        details={
            "old_status": old_status.value,
            "new_status": status_update.status.value,
            "admin_notes": status_update.admin_notes or ""
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(return_request)

    return return_request_to_response(return_request)
