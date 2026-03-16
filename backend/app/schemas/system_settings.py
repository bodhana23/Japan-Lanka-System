from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class SystemSettingResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_by_employee_id: Optional[UUID] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class DeliveryFeeTier(BaseModel):
    tier: str        # e.g. "tier1"
    fee: int
    districts: str   # e.g. "Matara"
    description: str


class DeliveryFeesResponse(BaseModel):
    tiers: List[DeliveryFeeTier]


class DeliveryFeeUpdate(BaseModel):
    fee: int = Field(..., ge=0, le=99999, description="Delivery fee in LKR")
