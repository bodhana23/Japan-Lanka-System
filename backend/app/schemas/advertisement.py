from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class AdvertisementCreate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    media_url: str = Field(..., max_length=500)
    media_type: str = Field(..., pattern="^(image|video)$")
    display_order: int = Field(0, ge=0)


class AdvertisementUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None


class AdvertisementResponse(BaseModel):
    id: UUID
    title: Optional[str] = None
    media_url: str
    media_type: str
    display_order: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdvertisementListResponse(BaseModel):
    items: List[AdvertisementResponse]
    total: int
