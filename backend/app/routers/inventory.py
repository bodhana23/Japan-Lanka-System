from datetime import datetime
from typing import Optional
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import InventoryTransaction, Product, User, AuditLog
from app.models.inventory_transaction import TransactionType
from app.schemas.inventory_transaction import (
    InventoryAdjustmentCreate,
    InventoryTransactionResponse,
    InventoryTransactionListResponse,
)
from app.utils.deps import get_current_user, require_manager_or_admin

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def transaction_to_response(transaction: InventoryTransaction) -> InventoryTransactionResponse:
    """Convert InventoryTransaction model to response."""
    return InventoryTransactionResponse(
        id=transaction.id,
        product_id=transaction.product_id,
        product_name=transaction.product.name if transaction.product else None,
        product_brand=transaction.product.brand if transaction.product else None,
        user_id=transaction.user_id,
        user_name=transaction.user.full_name if transaction.user else None,
        transaction_type=transaction.transaction_type,
        quantity_change=transaction.quantity_change,
        quantity_before=transaction.quantity_before,
        quantity_after=transaction.quantity_after,
        reason=transaction.reason,
        reference_order_id=transaction.reference_order_id,
        created_at=transaction.created_at
    )


@router.get("/transactions", response_model=InventoryTransactionListResponse)
async def list_transactions(
    product_id: Optional[UUID] = Query(None, description="Filter by product"),
    transaction_type: Optional[TransactionType] = Query(None, alias="type", description="Filter by transaction type"),
    from_date: Optional[datetime] = Query(None, description="Filter from this date"),
    to_date: Optional[datetime] = Query(None, description="Filter until this date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    """List all inventory transactions. Manager or Admin only."""
    query = db.query(InventoryTransaction)

    if product_id:
        query = query.filter(InventoryTransaction.product_id == product_id)
    if transaction_type:
        query = query.filter(InventoryTransaction.transaction_type == transaction_type)
    if from_date:
        query = query.filter(InventoryTransaction.created_at >= from_date)
    if to_date:
        query = query.filter(InventoryTransaction.created_at <= to_date)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    transactions = query.order_by(InventoryTransaction.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return InventoryTransactionListResponse(
        items=[transaction_to_response(t) for t in transactions],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/transactions/product/{product_id}", response_model=InventoryTransactionListResponse)
async def get_product_transactions(
    product_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Get inventory transactions for a specific product. Manager or Admin only."""
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    query = db.query(InventoryTransaction).filter(
        InventoryTransaction.product_id == product_id
    )

    total = query.count()
    offset = (page - 1) * page_size
    transactions = query.order_by(InventoryTransaction.created_at.desc()).offset(offset).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return InventoryTransactionListResponse(
        items=[transaction_to_response(t) for t in transactions],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.post("/adjustment", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_adjustment(
    adjustment: InventoryAdjustmentCreate,
    request: Request,
    current_user: User = Depends(require_manager_or_admin),
    db: Session = Depends(get_db)
):
    """Create a manual inventory adjustment. Manager or Admin only."""
    product = db.query(Product).filter(Product.id == adjustment.product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    quantity_before = product.quantity_available
    new_quantity = quantity_before + adjustment.quantity_change

    if new_quantity < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reduce stock below 0. Current stock: {quantity_before}"
        )

    # Update product quantity
    product.quantity_available = new_quantity

    # Determine transaction type
    if adjustment.quantity_change > 0:
        transaction_type = TransactionType.STOCK_IN
    elif adjustment.quantity_change < 0:
        transaction_type = TransactionType.STOCK_OUT
    else:
        transaction_type = TransactionType.ADJUSTMENT

    # Create inventory transaction
    transaction = InventoryTransaction(
        product_id=product.id,
        user_id=current_user.id,
        transaction_type=TransactionType.ADJUSTMENT,
        quantity_change=adjustment.quantity_change,
        quantity_before=quantity_before,
        quantity_after=new_quantity,
        reason=adjustment.reason
    )
    db.add(transaction)

    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="inventory_adjustment",
        entity_type="product",
        entity_id=str(product.id),
        details={
            "product_name": product.name,
            "quantity_change": adjustment.quantity_change,
            "quantity_before": quantity_before,
            "quantity_after": new_quantity,
            "reason": adjustment.reason
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(transaction)

    return transaction_to_response(transaction)
