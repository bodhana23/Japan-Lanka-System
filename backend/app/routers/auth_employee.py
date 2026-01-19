"""Employee authentication router."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee, AuditLog
from app.schemas.employee import (
    EmployeeLogin,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeTokenResponse,
    MessageResponse,
)
from app.utils.security import verify_password, create_access_token
from app.utils.deps import get_current_employee
from app.utils.rate_limiter import auth_rate_limiter

router = APIRouter(prefix="/auth/employee", tags=["Employee Authentication"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def log_action(db: Session, employee_id, action: str, entity_type: str = None,
               entity_id: str = None, details: dict = None, ip_address: str = None):
    """Create an audit log entry for an employee action."""
    audit_log = AuditLog(
        employee_id=employee_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()


@router.post("/login", response_model=EmployeeTokenResponse)
async def login(
    credentials: EmployeeLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with email and password (employees only)."""
    ip_address = get_client_ip(request)

    # Check rate limit before processing login
    auth_rate_limiter.check_rate_limit(ip_address)

    employee = db.query(Employee).filter(Employee.email == credentials.email).first()

    if not employee or not verify_password(credentials.password, employee.password_hash):
        # Record failed attempt for rate limiting
        auth_rate_limiter.record_attempt(ip_address, success=False)

        # Log failed login attempt
        log_action(
            db=db,
            employee_id=None,
            action="employee_login_failed",
            entity_type="employee",
            details={"email": credentials.email, "reason": "invalid_credentials"},
            ip_address=ip_address
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not employee.is_active:
        # Record failed attempt for rate limiting
        auth_rate_limiter.record_attempt(ip_address, success=False)

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Record successful login attempt
    auth_rate_limiter.record_attempt(ip_address, success=True)

    # Log the login
    log_action(
        db=db,
        employee_id=employee.id,
        action="employee_login",
        entity_type="employee",
        entity_id=str(employee.id),
        details={"role": employee.role.value},
        ip_address=ip_address
    )

    # Create access token
    access_token = create_access_token(
        user_id=employee.id,
        user_type="employee",
        role=employee.role.value
    )

    return EmployeeTokenResponse(
        access_token=access_token,
        role=employee.role.value,
        user=EmployeeResponse.model_validate(employee)
    )


@router.get("/profile", response_model=EmployeeResponse)
async def get_profile(
    current_employee: Employee = Depends(get_current_employee)
):
    """Get the current employee's profile."""
    return EmployeeResponse.model_validate(current_employee)


@router.put("/profile", response_model=EmployeeResponse)
async def update_profile(
    update_data: EmployeeUpdate,
    request: Request,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Update the current employee's profile (name only)."""
    update_dict = update_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    for field, value in update_dict.items():
        setattr(current_employee, field, value)

    db.commit()
    db.refresh(current_employee)

    # Log the update
    log_action(
        db=db,
        employee_id=current_employee.id,
        action="employee_profile_updated",
        entity_type="employee",
        entity_id=str(current_employee.id),
        details={"updated_fields": list(update_dict.keys())},
        ip_address=get_client_ip(request)
    )

    return EmployeeResponse.model_validate(current_employee)
