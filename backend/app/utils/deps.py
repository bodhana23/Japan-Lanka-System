"""Authentication and authorization dependencies."""

from typing import Optional, List, Union
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer, Employee
from app.models.employee import EmployeeRole
from app.utils.security import decode_access_token

# HTTP Bearer token scheme
security = HTTPBearer()

# Type alias for current user (can be either Customer or Employee)
CurrentUser = Union[Customer, Employee]


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> CurrentUser:
    """Get the current authenticated user (customer or employee) from JWT token.

    EMAIL VERIFICATION ENFORCEMENT: For customers, this dependency enforces
    that email/password users must have verified their email.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user_type = payload.get("user_type")

    if user_id is None or user_type is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Query the appropriate table based on user_type
    if user_type == "customer":
        user = db.query(Customer).filter(Customer.id == UUID(user_id)).first()
    elif user_type == "employee":
        user = db.query(Employee).filter(Employee.id == UUID(user_id)).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    # EMAIL VERIFICATION ENFORCEMENT for customers
    # Deny access to unverified email/password customers
    if user_type == "customer":
        customer = user  # Type hint for clarity
        if customer.firebase_uid and not customer.email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email before accessing this resource."
            )

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[CurrentUser]:
    """Get the current user if authenticated, None otherwise."""
    if credentials is None:
        return None

    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        return None

    user_id = payload.get("sub")
    user_type = payload.get("user_type")

    if user_id is None or user_type is None:
        return None

    # Query the appropriate table based on user_type
    if user_type == "customer":
        user = db.query(Customer).filter(Customer.id == UUID(user_id)).first()
    elif user_type == "employee":
        user = db.query(Employee).filter(Employee.id == UUID(user_id)).first()
    else:
        return None

    if user is None or not user.is_active:
        return None

    return user


async def get_current_customer(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Customer:
    """Get the current authenticated customer only.

    EMAIL VERIFICATION ENFORCEMENT: This dependency enforces that
    email/password users must have verified their email before
    accessing protected endpoints.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user_type = payload.get("user_type")

    if user_id is None or user_type is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user_type != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer access required"
        )

    customer = db.query(Customer).filter(Customer.id == UUID(user_id)).first()

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer account is deactivated"
        )

    # EMAIL VERIFICATION ENFORCEMENT
    # Deny access to unverified email/password users
    # Users with firebase_uid are email/password users who must verify
    if customer.firebase_uid and not customer.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before accessing this resource."
        )

    return customer


async def get_current_employee(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Employee:
    """Get the current authenticated employee only."""
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    user_type = payload.get("user_type")

    if user_id is None or user_type is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user_type != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee access required"
        )

    employee = db.query(Employee).filter(Employee.id == UUID(user_id)).first()

    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Employee not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employee account is deactivated"
        )

    return employee


class EmployeeRoleChecker:
    """Dependency class to check if employee has required role(s)."""

    def __init__(self, allowed_roles: List[EmployeeRole]):
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
    ) -> Employee:
        employee = await get_current_employee(credentials, db)
        if employee.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in self.allowed_roles]}"
            )
        return employee


# Pre-configured role checkers for employees
require_admin = EmployeeRoleChecker([EmployeeRole.ADMIN])
require_manager = EmployeeRoleChecker([EmployeeRole.MANAGER, EmployeeRole.ADMIN])
require_manager_or_admin = EmployeeRoleChecker([EmployeeRole.MANAGER, EmployeeRole.ADMIN])
require_auditor = EmployeeRoleChecker([EmployeeRole.AUDITOR, EmployeeRole.ADMIN])
require_staff = EmployeeRoleChecker([EmployeeRole.MANAGER, EmployeeRole.ADMIN, EmployeeRole.AUDITOR])
