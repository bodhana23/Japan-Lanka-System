"""Customer authentication router."""

import base64
import json

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer, AuditLog
from app.schemas.customer import (
    CustomerCreate,
    CustomerLogin,
    GoogleAuthRequest,
    CustomerUpdate,
    CustomerResponse,
    CustomerTokenResponse,
    MessageResponse,
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.deps import get_current_customer
from app.utils.rate_limiter import auth_rate_limiter

router = APIRouter(prefix="/auth/customer", tags=["Customer Authentication"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def log_action(db: Session, customer_id, action: str, entity_type: str = None,
               entity_id: str = None, details: dict = None, ip_address: str = None):
    """Create an audit log entry for a customer action."""
    audit_log = AuditLog(
        customer_id=customer_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()


def decode_firebase_token(token: str) -> dict:
    """Decode Firebase ID token without verification.

    Note: This is a simplified implementation that decodes the JWT payload
    without cryptographic verification. For production, use firebase-admin SDK
    with proper token verification.
    """
    try:
        # Firebase tokens are JWTs with 3 parts: header.payload.signature
        parts = token.split('.')
        if len(parts) != 3:
            raise ValueError("Invalid token format")

        # Decode the payload (second part)
        payload = parts[1]
        # Add padding if needed for base64 decoding
        padding = 4 - len(payload) % 4
        if padding != 4:
            payload += '=' * padding

        decoded_bytes = base64.urlsafe_b64decode(payload)
        payload_data = json.loads(decoded_bytes.decode('utf-8'))

        return payload_data
    except Exception as e:
        raise ValueError(f"Failed to decode token: {str(e)}")


@router.post("/register", response_model=CustomerTokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    customer_data: CustomerCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new customer account."""
    # Check if email already exists
    existing_customer = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    # Create new customer
    customer = Customer(
        email=customer_data.email,
        full_name=customer_data.full_name,
        phone_number=customer_data.phone_number,
        password_hash=hash_password(customer_data.password)
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    # Log the registration
    log_action(
        db=db,
        customer_id=customer.id,
        action="customer_registered",
        entity_type="customer",
        entity_id=str(customer.id),
        ip_address=get_client_ip(request)
    )

    # Create access token
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
    """Login with email and password."""
    ip_address = get_client_ip(request)

    # Check rate limit before processing login
    auth_rate_limiter.check_rate_limit(ip_address)

    customer = db.query(Customer).filter(Customer.email == credentials.email).first()

    if not customer or not verify_password(credentials.password, customer.password_hash):
        # Record failed attempt for rate limiting
        auth_rate_limiter.record_attempt(ip_address, success=False)

        # Log failed login attempt
        log_action(
            db=db,
            customer_id=None,
            action="customer_login_failed",
            entity_type="customer",
            details={"email": credentials.email, "reason": "invalid_credentials"},
            ip_address=ip_address
        )

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

    # Record successful login attempt
    auth_rate_limiter.record_attempt(ip_address, success=True)

    # Log the login
    log_action(
        db=db,
        customer_id=customer.id,
        action="customer_login",
        entity_type="customer",
        entity_id=str(customer.id),
        ip_address=ip_address
    )

    # Create access token
    access_token = create_access_token(
        user_id=customer.id,
        user_type="customer"
    )

    return CustomerTokenResponse(
        access_token=access_token,
        user=CustomerResponse.model_validate(customer)
    )


@router.post("/google", response_model=CustomerTokenResponse)
async def google_auth(
    auth_data: GoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login or register with Google via Firebase token."""
    try:
        # Decode the Firebase token to extract user info
        token_data = decode_firebase_token(auth_data.firebase_token)
        firebase_uid = token_data.get('user_id') or token_data.get('sub')

        # Prefer name and email from request body (from Firebase user object)
        # Fall back to token data if not provided
        name = auth_data.name or token_data.get('name', '')
        email = auth_data.email or token_data.get('email')

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in request or Firebase token"
            )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {str(e)}"
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
            db.commit()

        # Log the login
        log_action(
            db=db,
            customer_id=customer.id,
            action="customer_google_login",
            entity_type="customer",
            entity_id=str(customer.id),
            details={"firebase_uid": firebase_uid},
            ip_address=get_client_ip(request)
        )
    else:
        # Create new customer
        customer = Customer(
            email=email,
            full_name=name or email.split('@')[0],  # Use email prefix if no name
            password_hash="",  # No password for Google-authenticated customers
            firebase_uid=firebase_uid,
            is_active=True
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        # Log the registration
        log_action(
            db=db,
            customer_id=customer.id,
            action="customer_google_registered",
            entity_type="customer",
            entity_id=str(customer.id),
            details={"firebase_uid": firebase_uid},
            ip_address=get_client_ip(request)
        )

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
    log_action(
        db=db,
        customer_id=current_customer.id,
        action="customer_profile_updated",
        entity_type="customer",
        entity_id=str(current_customer.id),
        details={"updated_fields": list(update_dict.keys())},
        ip_address=get_client_ip(request)
    )

    return CustomerResponse.model_validate(current_customer)
