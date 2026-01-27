"""Customer authentication router."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer
from app.services.audit_service import log_activity_event
from app.models.activity_log import ActivityType
from app.schemas.customer import (
    CustomerCreate,
    CustomerLogin,
    GoogleAuthRequest,
    ResendVerificationRequest,
    ForgotPasswordRequest,
    CompleteRegistrationRequest,
    CustomerUpdate,
    CustomerResponse,
    CustomerTokenResponse,
    MessageResponse,
    PasswordChangeRequest,
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.deps import get_current_customer
from app.utils.rate_limiter import auth_rate_limiter
from app.utils.firebase import (
    verify_firebase_token,
    is_firebase_initialized,
    create_firebase_user,
    get_firebase_user_by_email,
    generate_email_verification_link,
    generate_password_reset_link,
    delete_firebase_user,
)

router = APIRouter(prefix="/auth/customer", tags=["Customer Authentication"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def get_user_agent(request: Request) -> str:
    """Get user agent from request."""
    return request.headers.get("User-Agent", "unknown")


@router.post("/register", response_model=CustomerTokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    customer_data: CustomerCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new customer account.

    EMAIL VERIFICATION: This endpoint creates a Firebase user and triggers
    email verification. The user will not be able to log in until they
    verify their email by clicking the link sent to their inbox.
    """
    # Check if email already exists in our database
    existing_customer = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Check if Firebase is configured for email verification
    if not is_firebase_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email verification service is not configured. Please contact support."
        )

    # Create Firebase user first (for email verification)
    # This allows Firebase to handle email verification flow
    firebase_uid = create_firebase_user(customer_data.email, customer_data.password)
    if firebase_uid is None:
        # Check if user already exists in Firebase (edge case)
        existing_firebase = get_firebase_user_by_email(customer_data.email)
        if existing_firebase:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account. Please try again later."
        )

    try:
        # Generate email verification link
        # This link is sent to user's email via Firebase
        verification_link = generate_email_verification_link(customer_data.email)
        if verification_link is None:
            # Clean up Firebase user if we can't generate verification link
            delete_firebase_user(firebase_uid)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send verification email. Please try again later."
            )

        # Create customer in our database
        # email_verified defaults to False - user must verify via email
        customer = Customer(
            email=customer_data.email,
            full_name=customer_data.full_name,
            phone_number=customer_data.phone_number,
            password_hash=hash_password(customer_data.password),
            firebase_uid=firebase_uid,
            email_verified=False  # Explicitly set - must verify email before login
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Clean up Firebase user if database operation fails
        delete_firebase_user(firebase_uid)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account. Please try again later."
        )

    # Log the registration
    log_activity_event(
        db=db,
        activity_type=ActivityType.CUSTOMER_REGISTERED,
        description=f"Customer {customer.email} registered (verification email sent)",
        customer_id=customer.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.commit()

    # Create access token (user can't use protected endpoints until verified)
    access_token = create_access_token(
        user_id=customer.id,
        user_type="customer"
    )

    return CustomerTokenResponse(
        access_token=access_token,
        user=CustomerResponse.model_validate(customer)
    )


@router.post("/login", response_model=CustomerTokenResponse)
async def login(
    credentials: CustomerLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with email and password.

    EMAIL VERIFICATION ENFORCEMENT: Users who registered with email/password
    must verify their email before logging in. This is checked against
    Firebase's email_verified status, not just our database.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Check rate limit before processing login
    auth_rate_limiter.check_rate_limit(ip_address)

    customer = db.query(Customer).filter(Customer.email == credentials.email).first()

    if not customer or not verify_password(credentials.password, customer.password_hash):
        # Record failed attempt for rate limiting
        auth_rate_limiter.record_attempt(ip_address, success=False)

        # Log failed login attempt
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_LOGIN_FAILED,
            description=f"Failed login attempt for {credentials.email} (invalid credentials)",
            customer_id=customer.id if customer else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    if not customer.is_active:
        # Record failed attempt for rate limiting
        auth_rate_limiter.record_attempt(ip_address, success=False)

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # EMAIL VERIFICATION CHECK for email/password users
    # Only check if user has a firebase_uid (registered through our system with email verification)
    if customer.firebase_uid and not customer.email_verified:
        # Check Firebase for current verification status
        # User may have verified since registration
        if is_firebase_initialized():
            firebase_user = get_firebase_user_by_email(customer.email)
            if firebase_user and firebase_user.get("email_verified"):
                # Sync verification status from Firebase to our database
                customer.email_verified = True
                db.commit()
            else:
                # Email still not verified - deny login
                auth_rate_limiter.record_attempt(ip_address, success=False)

                log_activity_event(
                    db=db,
                    activity_type=ActivityType.CUSTOMER_LOGIN_FAILED,
                    description=f"Failed login attempt for {customer.email} (email not verified)",
                    customer_id=customer.id,
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                db.commit()

                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email not verified. Please check your inbox and click the verification link."
                )

    # Record successful login attempt
    auth_rate_limiter.record_attempt(ip_address, success=True)

    # Log the login
    log_activity_event(
        db=db,
        activity_type=ActivityType.CUSTOMER_LOGIN,
        description=f"Customer {customer.email} logged in",
        customer_id=customer.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    # Create access token
    access_token = create_access_token(
        user_id=customer.id,
        user_type="customer"
    )

    return CustomerTokenResponse(
        access_token=access_token,
        user=CustomerResponse.model_validate(customer)
    )


@router.post("/complete-registration", response_model=CustomerTokenResponse, status_code=status.HTTP_201_CREATED)
async def complete_registration(
    registration_data: CompleteRegistrationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Complete registration after email verification.

    This endpoint is called on first login when:
    1. User registered via Firebase (email + password)
    2. User verified their email in Firebase
    3. User does not exist in our database yet

    The frontend sends the stored profile data along with credentials.
    We verify the password against Firebase, check email verification,
    and create the database entry.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Check rate limit
    auth_rate_limiter.check_rate_limit(ip_address)

    # Check if user already exists in database
    existing_customer = db.query(Customer).filter(Customer.email == registration_data.email).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account already exists. Please log in instead."
        )

    # Check if Firebase is initialized
    if not is_firebase_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service is not configured. Please contact support."
        )

    # Get Firebase user and verify they exist and are verified
    firebase_user = get_firebase_user_by_email(registration_data.email)
    if not firebase_user:
        auth_rate_limiter.record_attempt(ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending registration found. Please register first."
        )

    if not firebase_user.get("email_verified"):
        auth_rate_limiter.record_attempt(ip_address, success=False)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox and click the verification link."
        )

    # Create customer in database now that email is verified
    customer = Customer(
        email=registration_data.email,
        full_name=registration_data.full_name,
        phone_number=registration_data.phone_number,
        password_hash=hash_password(registration_data.password),
        firebase_uid=firebase_user.get("uid"),
        email_verified=True,  # Already verified in Firebase
        is_active=True
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    # Log the registration completion
    log_activity_event(
        db=db,
        activity_type=ActivityType.CUSTOMER_REGISTERED,
        description=f"Customer {customer.email} completed registration (email verified)",
        customer_id=customer.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    # Record successful attempt
    auth_rate_limiter.record_attempt(ip_address, success=True)

    # Create access token
    access_token = create_access_token(
        user_id=customer.id,
        user_type="customer"
    )

    return CustomerTokenResponse(
        access_token=access_token,
        user=CustomerResponse.model_validate(customer)
    )


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification_email(
    request_data: ResendVerificationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Resend email verification link.

    Use this endpoint when a user hasn't received the verification email
    or the link has expired. Rate limited to prevent abuse.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Rate limit verification email requests (same limiter as login)
    auth_rate_limiter.check_rate_limit(ip_address)

    # Check if Firebase is configured
    if not is_firebase_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email verification service is not configured. Please contact support."
        )

    # Find the customer
    customer = db.query(Customer).filter(Customer.email == request_data.email).first()

    if not customer:
        # Don't reveal if email exists - return success message anyway
        # This prevents email enumeration attacks
        return MessageResponse(message="If an account exists with this email, a verification link has been sent.")

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Check if email is already verified
    if customer.email_verified:
        return MessageResponse(message="Email is already verified. You can log in.")

    # Check if user has firebase_uid (email/password user)
    if not customer.firebase_uid:
        # This shouldn't happen for email/password users, but handle gracefully
        return MessageResponse(message="If an account exists with this email, a verification link has been sent.")

    # Generate and send new verification link
    verification_link = generate_email_verification_link(request_data.email)
    if verification_link is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email. Please try again later."
        )

    # Log the action
    log_activity_event(
        db=db,
        activity_type=ActivityType.CUSTOMER_VERIFICATION_EMAIL_RESENT,
        description=f"Verification email resent to {customer.email}",
        customer_id=customer.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    # Record as successful attempt to reset rate limit
    auth_rate_limiter.record_attempt(ip_address, success=True)

    return MessageResponse(message="Verification email sent. Please check your inbox.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Request a password reset link.

    SECURITY CONSIDERATIONS:
    - Never reveals whether an email exists in the system (prevents enumeration)
    - Google OAuth users cannot reset passwords (they have no password)
    - Rate limited to prevent abuse and enumeration attacks
    - Firebase handles secure token generation and expiration
    - No reset tokens stored in our database (Firebase manages this)

    The password reset link is generated by Firebase and sent to the user's email.
    Firebase handles:
    - Secure, cryptographically random token generation
    - Token expiration (typically 1 hour)
    - One-time use enforcement
    - The actual password update when user clicks the link
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Rate limit password reset requests to prevent abuse
    # Uses same rate limiter as login to prevent enumeration
    auth_rate_limiter.check_rate_limit(ip_address)

    # Check if Firebase is configured
    if not is_firebase_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Password reset service is not configured. Please contact support."
        )

    # Find the customer by email
    customer = db.query(Customer).filter(Customer.email == request_data.email).first()

    # SECURITY: Always return the same response regardless of whether email exists
    # This prevents email enumeration attacks
    generic_success_message = "If an account exists with this email, a password reset link has been sent."

    if not customer:
        # Email doesn't exist - return generic message without revealing this
        # Log the attempt for security monitoring
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_PASSWORD_RESET_REQUESTED,
            description=f"Password reset requested for unknown email: {request_data.email}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        return MessageResponse(message=generic_success_message)

    if not customer.is_active:
        # Account is deactivated - still return generic message
        # Don't reveal account status to potential attackers
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_PASSWORD_RESET_REQUESTED,
            description=f"Password reset requested for inactive account: {customer.email}",
            customer_id=customer.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        return MessageResponse(message=generic_success_message)

    # Check if this is a Google OAuth user (no password to reset)
    # Google users have empty password_hash
    if not customer.password_hash:
        # This is a Google OAuth user - they cannot reset password
        # Return a specific message since this is a user action issue, not security
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_PASSWORD_RESET_REQUESTED,
            description=f"Password reset requested by Google user: {customer.email}",
            customer_id=customer.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google Sign-In. Please log in with Google instead of resetting your password."
        )

    # Check if user has firebase_uid (required for Firebase password reset)
    if not customer.firebase_uid:
        # Legacy user without Firebase account - cannot use Firebase password reset
        # This shouldn't happen for new users but handles edge cases
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_PASSWORD_RESET_REQUESTED,
            description=f"Password reset requested for legacy account (no Firebase): {customer.email}",
            customer_id=customer.id,
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
        # Return generic message to avoid revealing system state
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_PASSWORD_RESET_REQUESTED,
            description=f"Password reset link generation failed for {customer.email}",
            customer_id=customer.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        return MessageResponse(message=generic_success_message)

    # Successfully generated reset link
    # Firebase will send the email with the reset link
    log_activity_event(
        db=db,
        activity_type=ActivityType.CUSTOMER_PASSWORD_RESET_REQUESTED,
        description=f"Password reset link sent to {customer.email}",
        customer_id=customer.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    # Record as successful attempt
    auth_rate_limiter.record_attempt(ip_address, success=True)

    return MessageResponse(message=generic_success_message)


@router.post("/google", response_model=CustomerTokenResponse)
async def google_auth(
    auth_data: GoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login or register with Google via Firebase token.

    SECURITY: This endpoint verifies Firebase ID tokens cryptographically
    using the Firebase Admin SDK. Tokens are validated for:
    - Valid signature against Firebase's public keys
    - Token expiration
    - Correct audience (project ID)
    - Correct issuer

    EMAIL VERIFICATION: Google OAuth users are automatically considered
    email verified since Google has already verified the email address.
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Check if Firebase is properly configured
    if not is_firebase_initialized():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is not configured. Please contact support."
        )

    # SECURITY: Verify the Firebase token cryptographically
    token_data = verify_firebase_token(auth_data.firebase_token)
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase token"
        )

    # Extract user info from verified token
    # 'sub' is the Firebase UID (always present in verified tokens)
    firebase_uid = token_data.get('uid') or token_data.get('sub')

    # Prefer name and email from request body (from Firebase user object)
    # Fall back to verified token data if not provided
    name = auth_data.name or token_data.get('name', '')
    email = auth_data.email or token_data.get('email')

    # Google OAuth users have email_verified in their token
    # Default to True since Google verifies emails during OAuth
    is_email_verified = token_data.get('email_verified', True)

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not found in request or Firebase token"
        )

    # Check if customer already exists
    customer = db.query(Customer).filter(Customer.email == email).first()

    if customer:
        # Existing customer - check if active
        if not customer.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )

        # Update firebase_uid if not set
        if not customer.firebase_uid:
            customer.firebase_uid = firebase_uid

        # Google OAuth users are always email verified
        # Update if not already verified
        if not customer.email_verified and is_email_verified:
            customer.email_verified = True

        db.commit()

        # Log the login
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_GOOGLE_LOGIN,
            description=f"Customer {customer.email} logged in via Google",
            customer_id=customer.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
    else:
        # Create new customer
        # Google OAuth users are automatically email verified
        customer = Customer(
            email=email,
            full_name=name or email.split('@')[0],  # Use email prefix if no name
            password_hash="",  # No password for Google-authenticated customers
            firebase_uid=firebase_uid,
            is_active=True,
            email_verified=is_email_verified  # Google users are email verified
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        # Log the registration
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_GOOGLE_REGISTERED,
            description=f"Customer {customer.email} registered via Google",
            customer_id=customer.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()

    # Create access token
    access_token = create_access_token(
        user_id=customer.id,
        user_type="customer"
    )

    return CustomerTokenResponse(
        access_token=access_token,
        user=CustomerResponse.model_validate(customer)
    )


@router.get("/profile", response_model=CustomerResponse)
async def get_profile(
    current_customer: Customer = Depends(get_current_customer)
):
    """Get the current customer's profile."""
    return CustomerResponse.model_validate(current_customer)


@router.put("/profile", response_model=CustomerResponse)
async def update_profile(
    update_data: CustomerUpdate,
    request: Request,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Update the current customer's profile."""
    update_dict = update_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    for field, value in update_dict.items():
        setattr(current_customer, field, value)

    db.commit()
    db.refresh(current_customer)

    # Log the update
    log_activity_event(
        db=db,
        activity_type=ActivityType.CUSTOMER_PROFILE_UPDATED,
        description=f"Customer {current_customer.email} updated profile: {', '.join(update_dict.keys())}",
        customer_id=current_customer.id,
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    db.commit()

    return CustomerResponse.model_validate(current_customer)


@router.put("/password", response_model=MessageResponse)
async def change_password(
    password_data: PasswordChangeRequest,
    request: Request,
    current_customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    """Change the current customer's password.

    Only available for customers who registered with email/password.
    Google OAuth users cannot change their password (they have no password_hash).
    """
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)

    # Check if user has a password (not a Google OAuth-only user)
    # Google OAuth users have empty password_hash
    if not current_customer.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google users cannot change their password. Please manage your password through Google."
        )

    # Verify current password
    if not verify_password(password_data.current_password, current_customer.password_hash):
        # Log failed attempt
        log_activity_event(
            db=db,
            activity_type=ActivityType.CUSTOMER_PASSWORD_CHANGE_FAILED,
            description=f"Customer {current_customer.email} failed to change password (invalid current password)",
            customer_id=current_customer.id,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect"
        )

    # Update password
    current_customer.password_hash = hash_password(password_data.new_password)
    db.commit()

    # Log the password change
    log_activity_event(
        db=db,
        activity_type=ActivityType.CUSTOMER_PASSWORD_CHANGED,
        description=f"Customer {current_customer.email} changed password",
        customer_id=current_customer.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()

    return MessageResponse(message="Password changed successfully")
