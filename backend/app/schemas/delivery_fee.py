from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class DeliveryFeeCreate(BaseModel):
    district_name: str = Field(..., min_length=1, max_length=100)
    fee: Decimal = Field(..., ge=0, description="Delivery fee in LKR")


class DeliveryFeeUpdate(BaseModel):
    fee: Decimal = Field(..., ge=0, description="Updated delivery fee in LKR")


class DeliveryFeeResponse(BaseModel):
    id: UUID
    district_name: str
    fee: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeliveryFeeListResponse(BaseModel):
    items: list[DeliveryFeeResponse]
    total: int
