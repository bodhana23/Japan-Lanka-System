"""Employee authentication router.

BUSINESS RULE: Employee accounts are provisioned exclusively by administrators.
Google Sign-In is used strictly for authentication, not onboarding.
Employees CANNOT self-register - they must be created by an Admin first.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee
from app.services.audit_service import log_activity_event
from app.models.activity_log import ActivityType
from app.schemas.employee import (
    EmployeeLogin,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeTokenResponse,
    EmployeeGoogleAuthRequest,
    EmployeeForgotPasswordRequest,
    EmployeeChangePasswordRequest,
    MessageResponse,
)
from app.utils.security import verify_password, create_access_token, get_password_hash
from app.utils.deps import get_current_employee, require_admin
from app.utils.rate_limiter import auth_rate_limiter
from app.utils.firebase import (
    verify_firebase_token,
    is_firebase_initialized,
    generate_password_reset_link,
    get_firebase_user_by_email,
    create_firebase_user,
)

router = APIRouter(prefix="/auth/employee", tags=["Employee Authentication"])



def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """Get user agent from request."""
    return request.headers.get("User-Agent", "unknown")


@router.post("/login", response_model=EmployeeTokenResponse)
async def login(
    credentials: EmployeeLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with email and password (employees only)."""
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Check rate limit before processing login
    auth_rate_limiter.check_rate_limit(ip_address)

    employee = db.query(Employee).filter(Employee.email == credentials.email).first()

    if not employee:
        auth_rate_limiter.record_attempt(ip_address, success=False)
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_LOGIN_FAILED,
            description=f"Failed login attempt for employee {credentials.email} (account not found)",
            employee_id=None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if employee.password_hash is None:
        auth_rate_limiter.record_attempt(ip_address, success=False)
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_LOGIN_FAILED,
            description=f"Failed login attempt for employee {credentials.email} (no password set — Google-only account)",
            employee_id=employee.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has no password set. Please sign in with Google or contact your administrator."
        )

    if not verify_password(credentials.password, employee.password_hash):
        # Record failed attempt for rate limiting
        auth_rate_limiter.record_attempt(ip_address, success=False)

        # Log failed login attempt
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_LOGIN_FAILED,
            description=f"Failed login attempt for employee {credentials.email} (invalid credentials)",
            employee_id=employee.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()

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
    log_activity_event(
        db=db,
        activity_type=ActivityType.EMPLOYEE_LOGIN,
        description=f"Employee {employee.email} ({employee.role.value}) logged in",
        employee_id=employee.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

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


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request_data: EmployeeForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Request a password reset link for employees.

    SECURITY CONSIDERATIONS:
    - Never reveals whether an email exists in the system (prevents enumeration)
    - Google-only auth employees are informed that password reset is not applicable
    - Rate limited to prevent abuse and enumeration attacks
    - Firebase handles secure token generation and expiration
    - No reset tokens stored in our database (Firebase manages this)

    BUSINESS RULE: Only employees created by Admin are eligible.
    Customers MUST use the customer forgot-password endpoint.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Rate limit password reset requests to prevent abuse
    auth_rate_limiter.check_rate_limit(ip_address)

    # Check if Firebase is configured
    if not is_firebase_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset service is not configured. Please contact support."
        )

    # SECURITY: Always return the same response regardless of whether email exists
    # This prevents email enumeration attacks
    generic_success_message = "If an employee account exists with this email, a password reset link has been sent."

    # Find the employee by email
    employee = db.query(Employee).filter(Employee.email == request_data.email).first()

    if not employee:
        # Email doesn't exist - return generic message without revealing this
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_PASSWORD_RESET_REQUESTED,
            description=f"Password reset requested for unknown employee email: {request_data.email}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        return MessageResponse(message=generic_success_message)

    if not employee.is_active:
        # Account is deactivated - still return generic message
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_PASSWORD_RESET_REQUESTED,
            description=f"Password reset requested for inactive employee: {employee.email}",
            employee_id=employee.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        return MessageResponse(message=generic_success_message)

    # Check if user exists in Firebase
    # If not, create a Firebase user so password reset can work
    firebase_user = get_firebase_user_by_email(request_data.email)
    if not firebase_user:
        # Employee exists in DB but not in Firebase
        # This can happen for employees created before Firebase was set up
        # Create a Firebase user with a temporary password so reset link works
        # The employee will set their own password via the reset link
        import secrets
        temp_password = secrets.token_urlsafe(32)
        firebase_uid = create_firebase_user(request_data.email, temp_password)

        if firebase_uid:
            # Update employee with firebase_uid
            employee.firebase_uid = firebase_uid
            db.commit()
        else:
            # Failed to create Firebase user
            log_activity_event(
                db=db,
                activity_type=ActivityType.EMPLOYEE_PASSWORD_RESET_REQUESTED,
                description=f"Password reset Firebase user creation failed for {employee.email}",
                employee_id=employee.id,
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.commit()
            return MessageResponse(message=generic_success_message)

    # Generate password reset link via Firebase
    # Firebase handles secure token generation and email delivery
    reset_link = generate_password_reset_link(request_data.email)

    if reset_link is None:
        # Failed to generate link - could be Firebase issue
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_PASSWORD_RESET_REQUESTED,
            description=f"Password reset link generation failed for {employee.email}",
            employee_id=employee.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        return MessageResponse(message=generic_success_message)

    # Successfully generated reset link
    log_activity_event(
        db=db,
        activity_type=ActivityType.EMPLOYEE_PASSWORD_RESET_REQUESTED,
        description=f"Password reset link sent to {employee.email}",
        employee_id=employee.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    # Record as successful attempt
    auth_rate_limiter.record_attempt(ip_address, success=True)

    return MessageResponse(message=generic_success_message)


@router.post("/google", response_model=EmployeeTokenResponse)
async def google_auth(
    auth_data: EmployeeGoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with Google via Firebase token (employees only).

    BUSINESS RULE: Employee accounts are provisioned exclusively by administrators.
    Google Sign-In is used strictly for authentication, NOT onboarding.

    CRITICAL CONSTRAINTS:
    - Employees MUST already exist in the database (created by Admin)
    - If employee is not found: DENY login with clear error
    - DO NOT auto-create employees
    - DO NOT allow Google sign-in to register employees

    SECURITY: This endpoint verifies Firebase ID tokens cryptographically
    using the Firebase Admin SDK. Tokens are validated for:
    - Valid signature against Firebase's public keys
    - Token expiration
    - Correct audience (project ID)
    - Correct issuer
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Check rate limit
    auth_rate_limiter.check_rate_limit(ip_address)

    # Check if Firebase is properly configured
    if not is_firebase_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is not configured. Please contact support."
        )

    # SECURITY: Verify the Firebase token cryptographically
    token_data = verify_firebase_token(auth_data.firebase_token)
    if token_data is None:
        auth_rate_limiter.record_attempt(ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token"
        )

    # Extract user info from verified token
    firebase_uid = token_data.get('uid') or token_data.get('sub')

    # Prefer email from request body (from Firebase user object), fall back to token
    email = auth_data.email or token_data.get('email')

    if not email:
        auth_rate_limiter.record_attempt(ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not found in request or Firebase token"
        )

    # CRITICAL: Look up employee by email - they MUST already exist
    # Employees are created ONLY by Admins, not via Google sign-in
    employee = db.query(Employee).filter(Employee.email == email).first()

    if not employee:
        # SECURITY: Employee not found - DO NOT CREATE
        # Log the failed attempt for security monitoring
        auth_rate_limiter.record_attempt(ip_address, success=False)
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_LOGIN_FAILED,
            description=f"Google login denied for {email} (employee not provisioned)",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No employee account found. Employee accounts must be created by an administrator. Please contact your administrator."
        )

    # Check if employee is active
    if not employee.is_active:
        auth_rate_limiter.record_attempt(ip_address, success=False)
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_LOGIN_FAILED,
            description=f"Google login denied for inactive employee {employee.email}",
            employee_id=employee.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your administrator."
        )

    # Update firebase_uid if not set (first Google login)
    if not employee.firebase_uid:
        employee.firebase_uid = firebase_uid
        db.commit()

    # Record successful login
    auth_rate_limiter.record_attempt(ip_address, success=True)

    # Log the successful login
    log_activity_event(
        db=db,
        activity_type=ActivityType.EMPLOYEE_GOOGLE_LOGIN,
        description=f"Employee {employee.email} ({employee.role.value}) logged in via Google",
        employee_id=employee.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    # Create access token with employee role
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
    log_activity_event(
        db=db,
        activity_type=ActivityType.EMPLOYEE_PROFILE_UPDATED,
        description=f"Employee {current_employee.email} updated profile: {', '.join(update_dict.keys())}",
        employee_id=current_employee.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.commit()

    return EmployeeResponse.model_validate(current_employee)


@router.put("/password", response_model=MessageResponse)
async def change_password(
    password_data: EmployeeChangePasswordRequest,
    request: Request,
    current_employee: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """Change the current employee's password.

    Validates the current password before allowing the change.
    Requires the new password to meet complexity requirements.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Verify current password
    if not verify_password(password_data.current_password, current_employee.password_hash):
        log_activity_event(
            db=db,
            activity_type=ActivityType.EMPLOYEE_PASSWORD_CHANGE_FAILED,
            description=f"Employee {current_employee.email} failed password change (incorrect current password)",
            employee_id=current_employee.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Validate new password strength
    new_password = password_data.new_password
    if len(new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    if not any(c.isupper() for c in new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )
    if not any(c.islower() for c in new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter"
        )
    if not any(c.isdigit() for c in new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number"
        )
    special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
    if not any(c in special_chars for c in new_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one special character"
        )

    # Check that new password is different from current
    if verify_password(new_password, current_employee.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )

    # Update password
    current_employee.password_hash = get_password_hash(new_password)
    db.commit()

    # Log successful password change
    log_activity_event(
        db=db,
        activity_type=ActivityType.EMPLOYEE_PASSWORD_CHANGED,
        description=f"Employee {current_employee.email} successfully changed password",
        employee_id=current_employee.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    return MessageResponse(message="Password changed successfully")
