"""System settings router — admin-only configuration endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.system_settings import SystemSetting
from app.models.employee import Employee
from app.utils.deps import require_admin
from app.schemas.system_settings import (
    SystemSettingResponse,
    DeliveryFeeTier,
    DeliveryFeesResponse,
    DeliveryFeeUpdate,
)
from app.utils.timezone import get_current_time

router = APIRouter(prefix="/system-settings", tags=["System Settings"])

# Static metadata for the 6 delivery fee tiers (districts never change, only fees do)
TIER_METADATA = {
    "tier1": {"districts": "Matara",                                                               "description": "Tier 1: Matara (origin/dispatch point)"},
    "tier2": {"districts": "Galle, Hambantota",                                                    "description": "Tier 2: Adjacent southern districts"},
    "tier3": {"districts": "Ratnapura, Kalutara, Nuwara Eliya, Monaragala",                        "description": "Tier 3: Mid-south districts"},
    "tier4": {"districts": "Colombo, Gampaha, Kegalle, Badulla, Kandy",                            "description": "Tier 4: Central and western districts"},
    "tier5": {"districts": "Kurunegala, Matale, Polonnaruwa, Anuradhapura, Ampara, Batticaloa, Trincomalee", "description": "Tier 5: Northern-central and eastern"},
    "tier6": {"districts": "Puttalam, Vavuniya, Mannar, Mullaitivu, Kilinochchi, Jaffna",          "description": "Tier 6: Far northern districts"},
}


@router.get("/delivery-fees", response_model=DeliveryFeesResponse)
async def get_delivery_fees(
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get all delivery fee tiers. Admin only."""
    tiers = []
    for tier_num in range(1, 7):
        tier_key = f"tier{tier_num}"
        setting = db.query(SystemSetting).filter(
            SystemSetting.key == f"delivery_fee_{tier_key}"
        ).first()
        fee = int(setting.value) if setting else 0
        meta = TIER_METADATA[tier_key]
        tiers.append(DeliveryFeeTier(
            tier=tier_key,
            fee=fee,
            districts=meta["districts"],
            description=meta["description"],
        ))
    return DeliveryFeesResponse(tiers=tiers)


@router.put("/delivery-fees/{tier}", response_model=SystemSettingResponse)
async def update_delivery_fee(
    tier: str,
    data: DeliveryFeeUpdate,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a delivery fee tier. Admin only."""
    if tier not in TIER_METADATA:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier. Must be one of: {list(TIER_METADATA.keys())}"
        )

    setting_key = f"delivery_fee_{tier}"
    setting = db.query(SystemSetting).filter(SystemSetting.key == setting_key).first()

    if not setting:
        # Seed row missing — create it gracefully
        setting = SystemSetting(
            key=setting_key,
            value=str(data.fee),
            description=TIER_METADATA[tier]["description"],
            updated_by_employee_id=current_user.id,
            updated_at=get_current_time()
        )
        db.add(setting)
    else:
        setting.value = str(data.fee)
        setting.updated_by_employee_id = current_user.id
        setting.updated_at = get_current_time()

    db.commit()
    db.refresh(setting)
    return SystemSettingResponse.model_validate(setting)
