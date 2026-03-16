from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


# Base schemas
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    brand: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year_from: Optional[int] = Field(None, ge=1900, le=2100)
    year_to: Optional[int] = Field(None, ge=1900, le=2100)
    category: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    quantity_available: int = Field(..., ge=0)
    image_url: Optional[str] = Field(None, max_length=500)


# Request schemas
class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    brand: Optional[str] = Field(None, min_length=1, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    year_from: Optional[int] = Field(None, ge=1900, le=2100)
    year_to: Optional[int] = Field(None, ge=1900, le=2100)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    quantity_available: Optional[int] = Field(None, ge=0)
    image_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)


class ProductDiscountUpdate(BaseModel):
    discount_percentage: Optional[Decimal] = Field(None, ge=0, le=100)


# Response schemas
class ProductResponse(ProductBase):
    id: UUID
    is_active: bool
    discount_percentage: Optional[Decimal] = None
    effective_price: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode='after')
    def compute_effective_price(self) -> 'ProductResponse':
        if self.discount_percentage and self.discount_percentage > 0:
            self.effective_price = self.price * (1 - self.discount_percentage / 100)
        else:
            self.effective_price = self.price
        return self

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Query parameters
class ProductFilter(BaseModel):
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    search: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
