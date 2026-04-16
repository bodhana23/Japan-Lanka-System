"""Delivery fee management router (admin only)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.delivery_fee import DeliveryFee
from app.schemas.delivery_fee import (
    DeliveryFeeCreate,
    DeliveryFeeUpdate,
    DeliveryFeeResponse,
    DeliveryFeeListResponse,
)
from app.utils.deps import require_manager_or_admin

router = APIRouter(prefix="/delivery-fees", tags=["Delivery Fees"])


@router.get("", response_model=DeliveryFeeListResponse)
def list_delivery_fees(db: Session = Depends(get_db)):
    """List all districts with their delivery fees. Public endpoint used by checkout."""
    items = db.query(DeliveryFee).order_by(DeliveryFee.district_name).all()
    return DeliveryFeeListResponse(items=items, total=len(items))


@router.post("", response_model=DeliveryFeeResponse, status_code=status.HTTP_201_CREATED)
def create_delivery_fee(
    data: DeliveryFeeCreate,
    db: Session = Depends(get_db),
    _employee=Depends(require_manager_or_admin),
):
    """Add a new district with its delivery fee. Admin only."""
    existing = db.query(DeliveryFee).filter(
        DeliveryFee.district_name == data.district_name.strip()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"District '{data.district_name}' already exists."
        )
    record = DeliveryFee(
        district_name=data.district_name.strip(),
        fee=data.fee,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.put("/{district_id}", response_model=DeliveryFeeResponse)
def update_delivery_fee(
    district_id: UUID,
    data: DeliveryFeeUpdate,
    db: Session = Depends(get_db),
    _employee=Depends(require_manager_or_admin),
):
    """Update the delivery fee for a district. Admin only."""
    record = db.query(DeliveryFee).filter(DeliveryFee.id == district_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found."
        )
    record.fee = data.fee
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{district_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_delivery_fee(
    district_id: UUID,
    db: Session = Depends(get_db),
    _employee=Depends(require_manager_or_admin),
):
    """Delete a district delivery fee entry. Admin only."""
    record = db.query(DeliveryFee).filter(DeliveryFee.id == district_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found."
        )
    db.delete(record)
    db.commit()
