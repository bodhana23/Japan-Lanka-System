from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# CartItem schemas
class CartItemCreate(BaseModel):
    product_id: UUID
    quantity: int = Field(1, gt=0)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)


class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_name: str
    product_brand: str
    product_image_url: Optional[str] = None
    unit_price: Decimal
    quantity: int
    subtotal: Decimal
    available_stock: int
    created_at: datetime

    class Config:
        from_attributes = True


# Cart schemas
class CartResponse(BaseModel):
    id: UUID
    user_id: UUID
    items: List[CartItemResponse] = []
    total_items: int
    total_price: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
