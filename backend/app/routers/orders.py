"""Orders router for order management."""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, OrderItem, Product, Customer, Employee, OrderStatusHistory, InventoryTransaction
from app.models.order import OrderStatus, DeliveryMethod
from app.models.inventory_transaction import TransactionType
from app.services.audit_service import log_inventory_event
from app.models.inventory_log import InventoryActionType, RelatedEntityType
from app.schemas.order import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderItemResponse,
    OrderListResponse,
)
from app.schemas.order_status_history import (
    OrderStatusHistoryResponse,
    OrderStatusHistoryListResponse,
)
from app.utils.deps import get_current_user, get_current_customer, require_manager_or_admin, CurrentUser
from app.services.notification_service import notify_order_status_change

router = APIRouter(prefix="/orders", tags=["Orders"])


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
        customer_id=order.customer_id,
        status=order.status,
        delivery_method=order.delivery_method,
        total_amount=order.total_amount,
        shipping_address=order.shipping_address,
        shipping_city=order.shipping_city,
        shipping_postal_code=order.shipping_postal_code,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
        customer_name=order.customer.full_name if order.customer else None,
        customer_email=order.customer.email if order.customer else None,
        customer_phone=order.customer.phone_number if order.customer else None
    )


@router.get("", response_model=OrderListResponse)
async def list_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status", description="Filter by status"),
    delivery_method: Optional[DeliveryMethod] = Query(None, description="Filter by delivery method"),
    from_date: Optional[datetime] = Query(None, description="Filter orders from this date"),
    to_date: Optional[datetime] = Query(None, description="Filter orders until this date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List orders.

    - Customers see only their own orders
    - Managers and Admins see all orders
    """
    query = db.query(Order)

    # Role-based filtering: customers see only their orders
    if isinstance(current_user, Customer):
        query = query.filter(Order.customer_id == current_user.id)

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
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Get current customer's orders."""
    query = db.query(Order).filter(Order.customer_id == current_customer.id)

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
    current_user: CurrentUser = Depends(get_current_user),
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
    if isinstance(current_user, Customer) and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return order_to_response(order)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    request: Request,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Create a new order (customers only)."""
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
        customer_id=current_customer.id,
        status=OrderStatus.PENDING,
        delivery_method=order_data.delivery_method,
        total_amount=total_amount,
        shipping_address=order_data.shipping_address,
        shipping_city=order_data.shipping_city,
        shipping_postal_code=order_data.shipping_postal_code,
        notes=order_data.notes
    )
    db.add(order)
    db.flush()  # Get order ID

    # Create initial order status history (no employee, customer-initiated)
    status_history = OrderStatusHistory(
        order_id=order.id,
        old_status=None,
        new_status=OrderStatus.PENDING,
        changed_by_employee_id=None,  # Customer-initiated
        notes="Order created"
    )
    db.add(status_history)

    # Create order items and update product quantities with inventory tracking
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"]
        )
        db.add(order_item)

        # Reduce product quantity and track inventory
        product = item_data["product"]
        quantity_before = product.quantity_available
        product.quantity_available -= item_data["quantity"]

        inventory_transaction = InventoryTransaction(
            product_id=product.id,
            employee_id=None,  # Customer-initiated, no employee
            transaction_type=TransactionType.STOCK_OUT,
            quantity_change=-item_data["quantity"],
            quantity_before=quantity_before,
            quantity_after=product.quantity_available,
            reason=f"Order #{str(order.id)[:8]}",
            reference_order_id=order.id
        )
        db.add(inventory_transaction)

    # Log inventory event for order placement
    log_inventory_event(
        db=db,
        action_type=InventoryActionType.ORDER_PLACED,
        description=f"Order placed by {current_customer.email} - Rs. {total_amount:.2f} ({len(order_items)} items)",
        actor_customer_id=current_customer.id,
        related_entity_type=RelatedEntityType.ORDER,
        related_entity_id=order.id
    )

    db.commit()
    db.refresh(order)

    return order_to_response(order)


@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    status_update: OrderStatusUpdate,
    request: Request,
    current_employee: Employee = Depends(require_manager_or_admin),
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

    # Create status history record
    status_history = OrderStatusHistory(
        order_id=order.id,
        old_status=old_status,
        new_status=status_update.status,
        changed_by_employee_id=current_employee.id,
        notes=status_update.notes if hasattr(status_update, 'notes') else None
    )
    db.add(status_history)

    # If cancelled, restore product quantities with inventory tracking
    if status_update.status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
        for item in order.items:
            if item.product:
                quantity_before = item.product.quantity_available
                item.product.quantity_available += item.quantity

                # Track inventory restoration
                inventory_transaction = InventoryTransaction(
                    product_id=item.product.id,
                    employee_id=current_employee.id,
                    transaction_type=TransactionType.RETURN_IN,
                    quantity_change=item.quantity,
                    quantity_before=quantity_before,
                    quantity_after=item.product.quantity_available,
                    reason=f"Order #{str(order.id)[:8]} cancelled",
                    reference_order_id=order.id
                )
                db.add(inventory_transaction)

    # Create notification for the customer
    notify_order_status_change(
        db=db,
        customer_id=order.customer_id,
        order_id=order.id,
        old_status=old_status.value,
        new_status=status_update.status.value
    )

    # Log inventory event for order status change
    log_inventory_event(
        db=db,
        action_type=InventoryActionType.ORDER_STATUS_CHANGED,
        description=f"Order status changed from {old_status.value} to {status_update.status.value} by {current_employee.email}",
        actor_employee_id=current_employee.id,
        related_entity_type=RelatedEntityType.ORDER,
        related_entity_id=order.id
    )

    db.commit()
    db.refresh(order)

    return order_to_response(order)


@router.get("/{order_id}/history", response_model=OrderStatusHistoryListResponse)
async def get_order_status_history(
    order_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get status change history for an order."""
    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Customers can only view their own orders
    if isinstance(current_user, Customer) and order.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    history = db.query(OrderStatusHistory).filter(
        OrderStatusHistory.order_id == order_id
    ).order_by(OrderStatusHistory.created_at.desc()).all()

    items = []
    for h in history:
        items.append(OrderStatusHistoryResponse(
            id=h.id,
            order_id=h.order_id,
            old_status=h.old_status,
            new_status=h.new_status,
            changed_by_employee_id=h.changed_by_employee_id,
            changed_by_name=h.changed_by.full_name if h.changed_by else None,
            notes=h.notes,
            created_at=h.created_at
        ))

    return OrderStatusHistoryListResponse(
        items=items,
        total=len(items)
    )
