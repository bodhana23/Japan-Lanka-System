"""Pydantic schemas for employee authentication and profile management."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.employee import EmployeeRole


# Request schemas
class EmployeeLogin(BaseModel):
    """Schema for employee login."""
    email: EmailStr
    password: str


class EmployeeUpdate(BaseModel):
    """Schema for updating employee profile."""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)


class EmployeeCreate(BaseModel):
    """Schema for creating an employee (admin only)."""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=6, max_length=100)
    role: EmployeeRole


class EmployeeRoleUpdate(BaseModel):
    """Schema for updating employee role."""
    role: EmployeeRole


class EmployeeStatusUpdate(BaseModel):
    """Schema for updating employee status."""
    is_active: bool


# Response schemas
class EmployeeResponse(BaseModel):
    """Schema for employee response."""
    id: UUID
    email: str
    full_name: str
    role: EmployeeRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeTokenResponse(BaseModel):
    """Schema for employee authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user_type: str = "employee"
    role: str
    user: EmployeeResponse


class EmployeeListResponse(BaseModel):
    """Schema for employee list response."""
    id: UUID
    email: str
    full_name: str
    role: EmployeeRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Generic message response schema."""
    message: str
