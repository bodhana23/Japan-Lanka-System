"""Advertisements router — manages promotional media for the home page carousel."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.advertisement import Advertisement
from app.models.employee import Employee
from app.schemas.advertisement import (
    AdvertisementCreate,
    AdvertisementUpdate,
    AdvertisementResponse,
    AdvertisementListResponse,
)
from app.utils.deps import require_admin

router = APIRouter(prefix="/advertisements", tags=["Advertisements"])


@router.get("", response_model=AdvertisementListResponse)
async def list_active_advertisements(db: Session = Depends(get_db)):
    """Public — returns only active ads sorted by display_order for the home page carousel."""
    ads = (
        db.query(Advertisement)
        .filter(Advertisement.is_active == True)  # noqa: E712
        .order_by(Advertisement.display_order.asc(), Advertisement.created_at.asc())
        .all()
    )
    return AdvertisementListResponse(
        items=[AdvertisementResponse.model_validate(a) for a in ads],
        total=len(ads),
    )


@router.get("/all", response_model=AdvertisementListResponse)
async def list_all_advertisements(
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only — returns all ads (active and inactive) for the management panel."""
    ads = (
        db.query(Advertisement)
        .order_by(Advertisement.display_order.asc(), Advertisement.created_at.asc())
        .all()
    )
    return AdvertisementListResponse(
        items=[AdvertisementResponse.model_validate(a) for a in ads],
        total=len(ads),
    )


@router.post("", response_model=AdvertisementResponse, status_code=status.HTTP_201_CREATED)
async def create_advertisement(
    data: AdvertisementCreate,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only — save a new advertisement record (media already uploaded to Firebase)."""
    ad = Advertisement(
        title=data.title,
        media_url=data.media_url,
        media_type=data.media_type,
        display_order=data.display_order,
    )
    db.add(ad)
    db.commit()
    db.refresh(ad)
    return AdvertisementResponse.model_validate(ad)


@router.patch("/{ad_id}", response_model=AdvertisementResponse)
async def update_advertisement(
    ad_id: UUID,
    data: AdvertisementUpdate,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only — update title, display_order, or toggle is_active."""
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advertisement not found",
        )

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update",
        )

    for field, value in update_data.items():
        setattr(ad, field, value)

    db.commit()
    db.refresh(ad)
    return AdvertisementResponse.model_validate(ad)


@router.delete("/{ad_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_advertisement(
    ad_id: UUID,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin only — hard-delete an advertisement record."""
    ad = db.query(Advertisement).filter(Advertisement.id == ad_id).first()
    if not ad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advertisement not found",
        )

    db.delete(ad)
    db.commit()
