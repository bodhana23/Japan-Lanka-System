from typing import Optional
from uuid import UUID
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, AuditLog
from app.schemas.user import (
    UserRoleUpdate,
    UserStatusUpdate,
    UserResponse,
    UserListResponse,
    MessageResponse,
)
from app.utils.deps import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["User Management"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("", response_model=dict)
async def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users. Admin only."""
    query = db.query(User)

    # Apply filters
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_term)) |
            (User.email.ilike(search_term))
        )

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * page_size
    users = query.order_by(User.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": [UserListResponse.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get a single user by ID. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.model_validate(user)


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    role_update: UserRoleUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update a user's role. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent admin from changing their own role
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )

    old_role = user.role
    user.role = role_update.role

    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="user_role_updated",
        entity_type="user",
        entity_id=str(user.id),
        details={"old_role": old_role.value, "new_role": role_update.role.value},
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


@router.put("/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: UUID,
    status_update: UserStatusUpdate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user. Admin only."""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent admin from deactivating themselves
    if user.id == current_user.id and not status_update.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    old_status = user.is_active
    user.is_active = status_update.is_active

    # Create audit log
    audit_log = AuditLog(
        user_id=current_user.id,
        action="user_status_updated",
        entity_type="user",
        entity_id=str(user.id),
        details={
            "old_status": "active" if old_status else "inactive",
            "new_status": "active" if status_update.is_active else "inactive"
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)
