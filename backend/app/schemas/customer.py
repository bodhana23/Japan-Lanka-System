"""Pydantic schemas for customer authentication and profile management."""

import re
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


# Request schemas
class CustomerCreate(BaseModel):
    """Schema for customer registration."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Validate full name contains no numbers and has at least 2 characters."""
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        if re.search(r'\d', v):
            raise ValueError('Full name cannot contain numbers')
        # Only allow letters, spaces, hyphens, and apostrophes
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", v):
            raise ValueError('Full name can only contain letters, spaces, hyphens, and apostrophes')
        return v

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        """Validate Sri Lankan phone number format (10 digits starting with 0)."""
        if v is None or v.strip() == '':
            return None
        # Remove spaces, dashes, and parentheses
        cleaned = re.sub(r'[\s\-()]', '', v)
        if not re.match(r'^0\d{9}$', cleaned):
            raise ValueError('Phone number must be 10 digits starting with 0 (e.g., 0771234567)')
        return cleaned

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password strength requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>/?]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class CustomerLogin(BaseModel):
    """Schema for customer login."""
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authentication."""
    firebase_token: str
    name: Optional[str] = None
    email: Optional[str] = None


class CustomerUpdate(BaseModel):
    """Schema for updating customer profile."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone_number: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)

    @field_validator('full_name')
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate full name if provided."""
        if v is None:
            return None
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Full name must be at least 2 characters long')
        if re.search(r'\d', v):
            raise ValueError('Full name cannot contain numbers')
        if not re.match(r"^[a-zA-Z\s\-'\.]+$", v):
            raise ValueError('Full name can only contain letters, spaces, hyphens, and apostrophes')
        return v

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        """Validate Sri Lankan phone number format if provided."""
        if v is None or v.strip() == '':
            return None
        cleaned = re.sub(r'[\s\-()]', '', v)
        if not re.match(r'^0\d{9}$', cleaned):
            raise ValueError('Phone number must be 10 digits starting with 0 (e.g., 0771234567)')
        return cleaned


# Response schemas
class CustomerResponse(BaseModel):
    """Schema for customer response."""
    id: UUID
    email: str
    full_name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerTokenResponse(BaseModel):
    """Schema for customer authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user_type: str = "customer"
    user: CustomerResponse


class MessageResponse(BaseModel):
    """Generic message response schema."""
    message: str
