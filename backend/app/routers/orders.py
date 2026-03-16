"""Orders router for order management."""

import os
import hashlib
from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, OrderItem, Product, Customer, Employee, OrderStatusHistory, InventoryTransaction, ReturnRequest
from app.models.order import OrderStatus, DeliveryMethod, SalesChannel, PaymentStatus
from app.models.inventory_transaction import TransactionType
from app.services.audit_service import log_inventory_event
from app.models.inventory_log import InventoryActionType, RelatedEntityType
from app.schemas.order import (
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderItemResponse,
    OrderListResponse,
    OfflineSaleCreate,
    OfflineSaleResponse,
    InitiateCheckoutRequest,
    InitiateCheckoutResponse,
    PayHereFormData,
    CheckoutCalculation,
    ReturnItemSummary,
    get_delivery_fee,
    SRI_LANKA_DISTRICTS,
)
from app.models.system_settings import SystemSetting
from app.schemas.order_status_history import (
    OrderStatusHistoryResponse,
    OrderStatusHistoryListResponse,
)
from app.utils.deps import get_current_user, get_current_customer, require_manager_or_admin, require_manager, require_manager_only, CurrentUser
from app.models.audit_log import AuditLog
from app.services.notification_service import notify_order_status_change, notify_managers_new_order, notify_admins_low_stock, LOW_STOCK_THRESHOLD

# PayHere configuration - loaded from settings
from app.config import settings
PAYHERE_MERCHANT_ID = settings.PAYHERE_MERCHANT_ID
PAYHERE_MERCHANT_SECRET = settings.PAYHERE_MERCHANT_SECRET
PAYHERE_SANDBOX = settings.PAYHERE_SANDBOX
FRONTEND_URL = settings.FRONTEND_URL
BACKEND_URL = settings.BACKEND_URL


# District → tier mapping for DB-backed delivery fee lookup
_DISTRICT_TO_TIER = {
    "Matara": "tier1",
    "Galle": "tier2", "Hambantota": "tier2",
    "Ratnapura": "tier3", "Kalutara": "tier3", "Nuwara Eliya": "tier3", "Monaragala": "tier3",
    "Colombo": "tier4", "Gampaha": "tier4", "Kegalle": "tier4", "Badulla": "tier4", "Kandy": "tier4",
    "Kurunegala": "tier5", "Matale": "tier5", "Polonnaruwa": "tier5", "Anuradhapura": "tier5",
    "Ampara": "tier5", "Batticaloa": "tier5", "Trincomalee": "tier5",
    "Puttalam": "tier6", "Vavuniya": "tier6", "Mannar": "tier6",
    "Mullaitivu": "tier6", "Kilinochchi": "tier6", "Jaffna": "tier6",
}


def get_delivery_fee_from_db(district: str, db: Session) -> Decimal:
    """Read delivery fee from system_settings table. Falls back to hardcoded values."""
    tier = _DISTRICT_TO_TIER.get(district, "tier6")
    setting = db.query(SystemSetting).filter(
        SystemSetting.key == f"delivery_fee_{tier}"
    ).first()
    if setting:
        return Decimal(setting.value)
    return get_delivery_fee(district)  # fallback to hardcoded


def generate_payhere_hash(merchant_id: str, order_id: str, amount: str, currency: str, merchant_secret: str) -> str:
    """
    Generate PayHere MD5 hash for payment authentication.

    Hash formula: MD5(merchant_id + order_id + amount + currency + strtoupper(MD5(merchant_secret)))

    Args:
        merchant_id: PayHere merchant ID
        order_id: Unique order identifier
        amount: Payment amount (formatted to 2 decimal places)
        currency: Currency code (e.g., LKR)
        merchant_secret: PayHere merchant secret from dashboard

    Returns:
        Uppercase MD5 hash string
    """
    # First, hash the merchant secret and convert to uppercase
    secret_hash = hashlib.md5(merchant_secret.encode()).hexdigest().upper()

    # Concatenate all values
    hash_string = merchant_id + order_id + amount + currency + secret_hash

    # Generate final hash and convert to uppercase
    final_hash = hashlib.md5(hash_string.encode()).hexdigest().upper()

    return final_hash

router = APIRouter(prefix="/orders", tags=["Orders"])


def order_to_response(order: Order, db: Session = None) -> OrderResponse:
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

    # Determine customer info (from customer relationship or offline fields)
    customer_name = None
    customer_email = None
    customer_phone = None

    if order.customer:
        customer_name = order.customer.full_name
        customer_email = order.customer.email
        customer_phone = order.customer.phone_number
    elif order.sales_channel == SalesChannel.OFFLINE:
        # Use offline customer info for offline sales
        customer_name = order.offline_customer_name
        customer_phone = order.offline_customer_phone

    # Check if a return request exists for this order and get its status
    has_return_request = False
    return_status = None
    return_admin_notes = None
    return_items_summary = None
    if db is not None:
        latest_return = db.query(ReturnRequest).filter(
            ReturnRequest.order_id == order.id
        ).order_by(ReturnRequest.created_at.desc()).first()
        if latest_return:
            has_return_request = True
            return_status = latest_return.status.value if hasattr(latest_return.status, 'value') else str(latest_return.status)
            return_admin_notes = latest_return.admin_notes
            # Build return items summary so front-end can show what was returned
            return_items_summary = []
            for ri in latest_return.return_items:
                order_item = ri.order_item
                product = order_item.product if order_item else None
                return_items_summary.append(ReturnItemSummary(
                    order_item_id=ri.order_item_id,
                    product_name=product.name if product else None,
                    returned_quantity=ri.quantity,
                    original_quantity=order_item.quantity if order_item else ri.quantity,
                    unit_price=order_item.unit_price if order_item else 0,
                ))

    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        status=order.status,
        delivery_method=order.delivery_method,
        sales_channel=order.sales_channel,
        total_amount=order.total_amount,
        subtotal=order.subtotal,
        delivery_fee=order.delivery_fee,
        paid_amount=order.paid_amount,
        remaining_amount=order.remaining_amount,
        payment_status=order.payment_status,
        shipping_district=order.shipping_district,
        shipping_address=order.shipping_address,
        shipping_city=order.shipping_city,
        shipping_postal_code=order.shipping_postal_code,
        offline_customer_name=order.offline_customer_name,
        offline_customer_phone=order.offline_customer_phone,
        payhere_payment_id=order.payhere_payment_id,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=items,
        customer_name=customer_name,
        customer_email=customer_email,
        customer_phone=customer_phone,
        is_billable=order.is_billable,
        has_return_request=has_return_request,
        return_status=return_status,
        return_admin_notes=return_admin_notes,
        return_items=return_items_summary,
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
        items=[order_to_response(o, db) for o in orders],
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
        items=[order_to_response(o, db) for o in orders],
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

    return order_to_response(order, db)


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

        # Notify admins if stock has just dropped to or below the low stock threshold
        if quantity_before > LOW_STOCK_THRESHOLD and product.quantity_available <= LOW_STOCK_THRESHOLD:
            notify_admins_low_stock(db, product.name, product.quantity_available)

    # Log inventory event for order placement
    log_inventory_event(
        db=db,
        action_type=InventoryActionType.ORDER_PLACED,
        description=f"Order placed by {current_customer.email} - Rs. {total_amount:.2f} ({len(order_items)} items)",
        actor_customer_id=current_customer.id,
        related_entity_type=RelatedEntityType.ORDER,
        related_entity_id=order.id
    )

    # Notify managers about the new order
    notify_managers_new_order(db=db, order=order)

    db.commit()
    db.refresh(order)

    return order_to_response(order, db)


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

    # COD collection: shipping order delivered → collect remaining COD amount
    if (
        status_update.status == OrderStatus.DELIVERED
        and order.delivery_method == DeliveryMethod.SHIPPING
        and old_status != OrderStatus.DELIVERED
    ):
        from decimal import Decimal
        remaining = Decimal(str(order.remaining_amount or 0))
        if remaining > 0:
            order.paid_amount = Decimal(str(order.paid_amount or 0)) + remaining
            order.remaining_amount = Decimal("0")
            order.update_payment_status()

    # COD collection: pickup order picked up → collect remaining amount
    if (
        status_update.status == OrderStatus.PICKED_UP
        and order.delivery_method == DeliveryMethod.PICKUP
        and old_status != OrderStatus.PICKED_UP
    ):
        from decimal import Decimal
        remaining = Decimal(str(order.remaining_amount or 0))
        if remaining > 0:
            order.paid_amount = Decimal(str(order.paid_amount or 0)) + remaining
            order.remaining_amount = Decimal("0")
            order.update_payment_status()

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

    # Create notification for the customer (only if customer exists)
    if order.customer_id:
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

    return order_to_response(order, db)


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


@router.post("/offline", response_model=OfflineSaleResponse, status_code=status.HTTP_201_CREATED)
async def create_offline_sale(
    sale_data: OfflineSaleCreate,
    request: Request,
    current_employee: Employee = Depends(require_manager_only),
    db: Session = Depends(get_db)
):
    """Create an offline sale (Manager only).

    Offline sales are for walk-in or phone orders that bypass the cart/checkout flow.
    - Creates an Order with sales_channel=offline
    - Status is set to 'delivered' and payment_status='paid' immediately
    - Reduces inventory with proper audit trail
    - Customer is optional (no customer_id required)
    """
    # Validate products and calculate total
    total_amount = Decimal("0")
    order_items_data = []

    for item_data in sale_data.items:
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
                detail=f"Insufficient stock for {product.name}. Available: {product.quantity_available}, Requested: {item_data.quantity}"
            )

        # Calculate item total using provided unit_price
        item_total = item_data.unit_price * item_data.quantity
        total_amount += item_total

        order_items_data.append({
            "product": product,
            "quantity": item_data.quantity,
            "unit_price": item_data.unit_price
        })

    # Create order for offline sale
    order = Order(
        customer_id=None,  # No customer for offline sales
        status=OrderStatus.DELIVERED,  # Offline sales are immediately delivered
        delivery_method=DeliveryMethod.PICKUP,  # Offline = pickup
        sales_channel=SalesChannel.OFFLINE,
        total_amount=total_amount,
        offline_customer_name=sale_data.customer_name,
        offline_customer_phone=sale_data.customer_phone,
        notes=sale_data.notes
    )
    db.add(order)
    db.flush()  # Get order ID

    # Create initial order status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        old_status=None,
        new_status=OrderStatus.DELIVERED,
        changed_by_employee_id=current_employee.id,
        notes="Offline sale created"
    )
    db.add(status_history)

    # Create order items and update product quantities with inventory tracking
    for item_data in order_items_data:
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
            employee_id=current_employee.id,
            transaction_type=TransactionType.STOCK_OUT,
            quantity_change=-item_data["quantity"],
            quantity_before=quantity_before,
            quantity_after=product.quantity_available,
            reason=f"Offline Sale #{str(order.id)[:8]}",
            reference_order_id=order.id
        )
        db.add(inventory_transaction)

        # Notify admins if stock has just dropped to or below the low stock threshold
        if quantity_before > LOW_STOCK_THRESHOLD and product.quantity_available <= LOW_STOCK_THRESHOLD:
            notify_admins_low_stock(db, product.name, product.quantity_available)

    # Log inventory event for offline sale
    customer_info = sale_data.customer_name or "Walk-in customer"
    log_inventory_event(
        db=db,
        action_type=InventoryActionType.ORDER_PLACED,
        description=f"Offline sale by {current_employee.email} for {customer_info} - Rs. {total_amount:.2f} ({len(order_items_data)} items)",
        actor_employee_id=current_employee.id,
        related_entity_type=RelatedEntityType.ORDER,
        related_entity_id=order.id
    )

    # Create audit log entry for the offline sale
    audit_log = AuditLog(
        employee_id=current_employee.id,
        action="CREATE_OFFLINE_SALE",
        entity_type="Order",
        entity_id=str(order.id),
        details={
            "total_amount": str(total_amount),
            "items_count": len(order_items_data),
            "customer_name": sale_data.customer_name,
            "customer_phone": sale_data.customer_phone
        }
    )
    db.add(audit_log)

    db.commit()
    db.refresh(order)

    # Build response
    items_response = []
    for item in order.items:
        items_response.append(OrderItemResponse(
            id=item.id,
            product_id=item.product_id,
            product_name=item.product.name if item.product else None,
            quantity=item.quantity,
            unit_price=item.unit_price,
            created_at=item.created_at
        ))

    return OfflineSaleResponse(
        id=order.id,
        status=order.status,
        delivery_method=order.delivery_method,
        sales_channel=order.sales_channel,
        total_amount=order.total_amount,
        offline_customer_name=order.offline_customer_name,
        offline_customer_phone=order.offline_customer_phone,
        notes=order.notes,
        created_at=order.created_at,
        items=items_response,
        message=f"Offline sale created successfully. Order ID: {str(order.id)[:8].upper()}"
    )


@router.get("/{order_id}/bill")
async def get_order_bill(
    order_id: UUID,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate and download a PDF bill for an order.

    Access:
    - Customers can download bills for their own orders
    - Managers/Admins can download bills for any order

    Returns 403 if:
    - Customer tries to access another customer's order
    - Order is not eligible for bill generation (cancelled)
    """
    from app.services.bill_service import generate_bill_pdf

    order = db.query(Order).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Access control: Customers can only download their own orders
    if isinstance(current_user, Customer):
        if order.customer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only download bills for your own orders."
            )

    if not order.is_billable:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This order is not eligible for bill generation"
        )

    # Generate PDF
    pdf_buffer = generate_bill_pdf(order)

    # Return as downloadable PDF
    order_id_short = str(order.id)[:8].upper()
    filename = f"bill_{order_id_short}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# ============ CHECKOUT & PAYMENT ENDPOINTS ============

@router.post("/checkout/calculate", response_model=CheckoutCalculation)
async def calculate_checkout(
    checkout_data: InitiateCheckoutRequest,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Calculate checkout totals including delivery fee.
    Returns breakdown of costs and payment options.
    """
    # Validate products and calculate subtotal
    subtotal = Decimal("0")

    for item_data in checkout_data.items:
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

        subtotal += product.price * item_data.quantity

    # Calculate delivery fee
    delivery_fee = Decimal("0")
    if checkout_data.delivery_method == DeliveryMethod.SHIPPING:
        if not checkout_data.shipping_district:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="District is required for delivery orders"
            )
        delivery_fee = get_delivery_fee_from_db(checkout_data.shipping_district, db)

    total_amount = subtotal + delivery_fee

    # For delivery: minimum 30% payment required
    # For pickup: payment is optional
    minimum_payment = (total_amount * Decimal("0.30")).quantize(Decimal("0.01"))
    requires_payment = checkout_data.delivery_method == DeliveryMethod.SHIPPING

    return CheckoutCalculation(
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=total_amount,
        minimum_payment=minimum_payment,
        full_payment=total_amount,
        delivery_method=checkout_data.delivery_method,
        district=checkout_data.shipping_district,
        requires_payment=requires_payment
    )


@router.get("/checkout/districts")
async def get_districts():
    """Get list of Sri Lanka districts with delivery fees."""
    districts = []
    for district, fee in SRI_LANKA_DISTRICTS.items():
        districts.append({
            "name": district,
            "delivery_fee": fee
        })
    return {"districts": districts}


@router.post("/checkout/initiate", response_model=InitiateCheckoutResponse)
async def initiate_checkout(
    checkout_data: InitiateCheckoutRequest,
    request: Request,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """
    Initiate checkout process.

    For DELIVERY orders:
    - Payment is REQUIRED (minimum 30%)
    - Creates a PENDING order and returns PayHere form data
    - Order becomes CONFIRMED only after PayHere notification

    For PICKUP orders:
    - Payment is OPTIONAL
    - If skip_payment=True: Creates order immediately as PENDING (NOT_PAID)
    - If skip_payment=False: Returns PayHere form data for optional payment
    """
    # Validate delivery orders require district
    if checkout_data.delivery_method == DeliveryMethod.SHIPPING:
        if not checkout_data.shipping_district:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="District is required for delivery orders"
            )
        if not checkout_data.shipping_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Shipping address is required for delivery orders"
            )

    # Validate products and calculate totals
    subtotal = Decimal("0")
    order_items = []

    for item_data in checkout_data.items:
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

        item_total = product.price * item_data.quantity
        subtotal += item_total

        order_items.append({
            "product": product,
            "quantity": item_data.quantity,
            "unit_price": product.price
        })

    # Calculate delivery fee
    delivery_fee = Decimal("0")
    if checkout_data.delivery_method == DeliveryMethod.SHIPPING:
        delivery_fee = get_delivery_fee_from_db(checkout_data.shipping_district, db)

    total_amount = subtotal + delivery_fee

    # Determine payment amounts
    is_pickup = checkout_data.delivery_method == DeliveryMethod.PICKUP
    requires_payment = not is_pickup or not checkout_data.skip_payment

    if checkout_data.pay_full_amount:
        pay_now_amount = total_amount
    else:
        # 30% minimum for delivery, full amount if pickup with payment
        if is_pickup:
            pay_now_amount = total_amount
        else:
            pay_now_amount = (total_amount * Decimal("0.30")).quantize(Decimal("0.01"))

    remaining_cod_amount = total_amount - pay_now_amount

    # For pickup orders without payment, create order immediately
    if is_pickup and checkout_data.skip_payment:
        order = Order(
            customer_id=current_customer.id,
            status=OrderStatus.PENDING,
            delivery_method=DeliveryMethod.PICKUP,
            sales_channel=SalesChannel.ONLINE,
            subtotal=subtotal,
            delivery_fee=Decimal("0"),
            total_amount=total_amount,
            paid_amount=Decimal("0"),
            remaining_amount=total_amount,
            payment_status=PaymentStatus.NOT_PAID,
            notes=checkout_data.notes
        )
        db.add(order)
        db.flush()

        # Create order items and reduce stock
        for item_data in order_items:
            order_item = OrderItem(
                order_id=order.id,
                product_id=item_data["product"].id,
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"]
            )
            db.add(order_item)

            product = item_data["product"]
            quantity_before = product.quantity_available
            product.quantity_available -= item_data["quantity"]

            inventory_transaction = InventoryTransaction(
                product_id=product.id,
                employee_id=None,
                transaction_type=TransactionType.STOCK_OUT,
                quantity_change=-item_data["quantity"],
                quantity_before=quantity_before,
                quantity_after=product.quantity_available,
                reason=f"Order #{str(order.id)[:8]}",
                reference_order_id=order.id
            )
            db.add(inventory_transaction)

            # Notify admins if stock has just dropped to or below the low stock threshold
            if quantity_before > LOW_STOCK_THRESHOLD and product.quantity_available <= LOW_STOCK_THRESHOLD:
                notify_admins_low_stock(db, product.name, product.quantity_available)

        # Create status history
        status_history = OrderStatusHistory(
            order_id=order.id,
            old_status=None,
            new_status=OrderStatus.PENDING,
            changed_by_employee_id=None,
            notes="Pickup order created without advance payment"
        )
        db.add(status_history)

        log_inventory_event(
            db=db,
            action_type=InventoryActionType.ORDER_PLACED,
            description=f"Pickup order placed by {current_customer.email} - Rs. {total_amount:.2f} (No advance payment)",
            actor_customer_id=current_customer.id,
            related_entity_type=RelatedEntityType.ORDER,
            related_entity_id=order.id
        )

        # Notify managers about the new order
        notify_managers_new_order(db=db, order=order)

        db.commit()

        return InitiateCheckoutResponse(
            order_id=str(order.id),
            subtotal=subtotal,
            delivery_fee=Decimal("0"),
            total_amount=total_amount,
            pay_now_amount=Decimal("0"),
            remaining_cod_amount=total_amount,
            payment_status=PaymentStatus.NOT_PAID,
            delivery_method=DeliveryMethod.PICKUP,
            requires_payment=False,
            payhere_form_data=None,
            message="Order placed successfully. Pay when you pick up."
        )

    # For payment orders, create order in PENDING state
    order = Order(
        customer_id=current_customer.id,
        status=OrderStatus.PENDING,
        delivery_method=checkout_data.delivery_method,
        sales_channel=SalesChannel.ONLINE,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=total_amount,
        paid_amount=Decimal("0"),
        remaining_amount=total_amount,
        payment_status=PaymentStatus.NOT_PAID,
        shipping_district=checkout_data.shipping_district,
        shipping_address=checkout_data.shipping_address,
        shipping_city=checkout_data.shipping_city,
        shipping_postal_code=checkout_data.shipping_postal_code,
        notes=checkout_data.notes
    )
    db.add(order)
    db.flush()

    # Create order items and reduce stock
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"]
        )
        db.add(order_item)

        product = item_data["product"]
        quantity_before = product.quantity_available
        product.quantity_available -= item_data["quantity"]

        inventory_transaction = InventoryTransaction(
            product_id=product.id,
            employee_id=None,
            transaction_type=TransactionType.STOCK_OUT,
            quantity_change=-item_data["quantity"],
            quantity_before=quantity_before,
            quantity_after=product.quantity_available,
            reason=f"Order #{str(order.id)[:8]}",
            reference_order_id=order.id
        )
        db.add(inventory_transaction)

        # Notify admins if stock has just dropped to or below the low stock threshold
        if quantity_before > LOW_STOCK_THRESHOLD and product.quantity_available <= LOW_STOCK_THRESHOLD:
            notify_admins_low_stock(db, product.name, product.quantity_available)

    # Create status history
    status_history = OrderStatusHistory(
        order_id=order.id,
        old_status=None,
        new_status=OrderStatus.PENDING,
        changed_by_employee_id=None,
        notes="Order created, awaiting payment"
    )
    db.add(status_history)

    log_inventory_event(
        db=db,
        action_type=InventoryActionType.ORDER_PLACED,
        description=f"Order placed by {current_customer.email} - Rs. {total_amount:.2f} (Awaiting payment)",
        actor_customer_id=current_customer.id,
        related_entity_type=RelatedEntityType.ORDER,
        related_entity_id=order.id
    )

    # Notify managers about the new order
    notify_managers_new_order(db=db, order=order)

    db.commit()

    # Generate PayHere form data
    # Parse customer name into first/last
    name_parts = current_customer.full_name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Build item description
    item_descriptions = [f"{item['product'].name} x{item['quantity']}" for item in order_items]
    items_str = ", ".join(item_descriptions)
    if len(items_str) > 200:
        items_str = items_str[:197] + "..."

    # Format amount with exactly 2 decimal places (required by PayHere)
    amount_str = str(pay_now_amount.quantize(Decimal("0.01")))

    # Generate PayHere hash for authentication
    payhere_hash = generate_payhere_hash(
        merchant_id=PAYHERE_MERCHANT_ID,
        order_id=str(order.id),
        amount=amount_str,
        currency="LKR",
        merchant_secret=PAYHERE_MERCHANT_SECRET
    )

    payhere_form_data = PayHereFormData(
        merchant_id=PAYHERE_MERCHANT_ID,
        return_url=f"{FRONTEND_URL}/payment/success",
        cancel_url=f"{FRONTEND_URL}/payment/cancel",
        notify_url=f"{BACKEND_URL}/api/v1/payments/payhere/notify",
        order_id=str(order.id),
        items=items_str,
        currency="LKR",
        amount=amount_str,
        first_name=first_name,
        last_name=last_name,
        email=current_customer.email,
        phone=current_customer.phone_number or "",
        address=checkout_data.shipping_address or "N/A",
        city=checkout_data.shipping_city or "N/A",
        country="Sri Lanka",
        hash=payhere_hash
    )

    payment_type = "full" if checkout_data.pay_full_amount else "30% advance"
    message = f"Order created. Complete {payment_type} payment of Rs. {pay_now_amount:.2f} to confirm."

    return InitiateCheckoutResponse(
        order_id=str(order.id),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total_amount=total_amount,
        pay_now_amount=pay_now_amount,
        remaining_cod_amount=remaining_cod_amount,
        payment_status=PaymentStatus.NOT_PAID,
        delivery_method=checkout_data.delivery_method,
        requires_payment=True,
        payhere_form_data=payhere_form_data,
        message=message
    )
