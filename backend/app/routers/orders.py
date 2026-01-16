from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, OrderItem, Product, User, AuditLog
from app.models.order import OrderStatus, DeliveryMethod
from app.schemas.order import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderItemResponse,
    OrderListResponse,
)
from app.utils.deps import get_current_user, require_manager_or_admin

router = APIRouter(prefix="/orders", tags=["Orders"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def order_to_response(order: Order) -> OrderResponse:
    """Convert Order model to OrderResponse with related data."""
    items = []
    for item in order.items:
        item_response = OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else None,
            quantity=item.quantity,
            unit_price=item.unit_price,
            created_at=item.created_at
        )
        items.append(item_response)

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        delivery_method=order.delivery_method,
        total_amount=order.total_amount,
        shipping_address=order.shipping_address,
        shipping_city=order.shipping_city,
        shipping_postal_code=order.shipping_postal_code,
        customer_phone=order.customer_phone,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
        customer_name=order.user.full_name if order.user else None,
        customer_email=order.user.email if order.user else None
    )


@router.get("", response_model=OrderListResponse)
async def list_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status", description="Filter by status"),
    delivery_method: Optional[DeliveryMethod] = Query(None, description="Filter by delivery method"),
    from_date: Optional[datetime] = Query(None, description="Filter orders from this date"),
    to_date: Optional[datetime] = Query(None, description="Filter orders until this date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List orders.

    - Customers see only their own orders
    - Managers and Admins see all orders
    """
    query = db.query(Order)

    # Role-based filtering
    if current_user.role.value == "customer":
        query = query.filter(Order.user_id == current_user.id)

    # Apply filters
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if delivery_method:
        query = query.filter(Order.delivery_method == delivery_method)
    if from_date:
        query = query.filter(Order.created_at >= from_date)
    if to_date:
        query = query.filter(Order.created_at <= to_date)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return OrderListResponse(
        items=[order_to_response(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/my-orders", response_model=OrderListResponse)
async def get_my_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current customer's orders."""
    query = db.query(Order).filter(Order.user_id == current_user.id)

    if status_filter:
        query = query.filter(Order.status == status_filter)

    total = query.count()
    offset = (page - 1) * page_size
    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return OrderListResponse(
        items=[order_to_response(o) for o in orders],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a single order by ID."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Customers can only view their own orders
    if current_user.role.value == "customer" and order.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return order_to_response(order)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new order."""
    # Validate shipping info for shipping orders
    if order_data.delivery_method == DeliveryMethod.SHIPPING:
        if not order_data.shipping_address or not order_data.shipping_city:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shipping address and city are required for shipping orders"
            )

    # Validate products and calculate total
    total_amount = Decimal("0")
    order_items = []

    for item_data in order_data.items:
        product = db.query(Product).filter(
            Product.id == item_data.product_id,
            Product.is_active == True
        ).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product {item_data.product_id} not found or inactive"
            )

        if product.quantity_available < item_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for {product.name}. Available: {product.quantity_available}"
            )

        # Calculate item total
        item_total = product.price * item_data.quantity
        total_amount += item_total

        order_items.append({
            "product": product,
            "quantity": item_data.quantity,
            "unit_price": product.price
        })

    # Create order
    order = Order(
        user_id=current_user.id,
        status=OrderStatus.PENDING,
        delivery_method=order_data.delivery_method,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        shipping_city=order_data.shipping_city,
        shipping_postal_code=order_data.shipping_postal_code,
        customer_phone=order_data.customer_phone,
        notes=order_data.notes
    )
    db.add(order)
    db.flush()  # Get order ID

    # Create order items and update product quantities
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"]
        )
        db.add(order_item)

        # Reduce product quantity
        item_data["product"].quantity_available -= item_data["quantity"]

    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="order_created",
        entity_type="order",
        entity_id=str(order.id),
        details={"total_amount": str(total_amount), "items_count": len(order_items)},
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(order)

    return order_to_response(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    request: Request,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Update order status. Manager or Admin only."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    old_status = order.status
    order.status = status_update.status

    # If cancelled, restore product quantities
    if status_update.status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
        for item in order.items:
            if item.product:
                item.product.quantity_available += item.quantity

    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="order_status_updated",
        entity_type="order",
        entity_id=str(order.id),
        details={"old_status": old_status.value, "new_status": status_update.status.value},
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(order)

    return order_to_response(order)
