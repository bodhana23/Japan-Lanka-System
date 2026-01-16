from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, UserRole, AuditLog
from app.schemas.user import (
    UserCreate,
    UserLogin,
    GoogleAuthRequest,
    UserUpdate,
    UserResponse,
    TokenResponse,
    MessageResponse,
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def log_action(db: Session, user_id, action: str, entity_type: str = None,
               entity_id: str = None, details: dict = None, ip_address: str = None):
    """Create an audit log entry."""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new customer account."""
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        password_hash=hash_password(user_data.password),
        role=UserRole.CUSTOMER
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log the registration
    log_action(
        db=db,
        user_id=user.id,
        action="user_registered",
        entity_type="user",
        entity_id=str(user.id),
        ip_address=get_client_ip(request)
    )

    # Create access token
    access_token = create_access_token(user.id, user.role.value)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login with email and password."""
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Log the login
    log_action(
        db=db,
        user_id=user.id,
        action="user_login",
        entity_type="user",
        entity_id=str(user.id),
        ip_address=get_client_ip(request)
    )

    # Create access token
    access_token = create_access_token(user.id, user.role.value)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    auth_data: GoogleAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Login or register with Google via Firebase token.

    Note: This endpoint requires firebase-admin to be installed and configured.
    For now, it returns a placeholder error.
    """
    # TODO: Implement Firebase token verification when firebase-admin is installed
    # from firebase_admin import auth as firebase_auth
    # try:
    #     decoded_token = firebase_auth.verify_id_token(auth_data.firebase_token)
    #     firebase_uid = decoded_token['uid']
    #     email = decoded_token.get('email')
    #     name = decoded_token.get('name', '')
    # except Exception as e:
    #     raise HTTPException(status_code=401, detail="Invalid Firebase token")

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Google authentication requires Firebase Admin SDK configuration"
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get the current logged-in user's profile."""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the current user's profile."""
    update_dict = update_data.model_dump(exclude_unset=True)

    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )

    for field, value in update_dict.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    # Log the update
    log_action(
        db=db,
        user_id=current_user.id,
        action="user_profile_updated",
        entity_type="user",
        entity_id=str(current_user.id),
        details={"updated_fields": list(update_dict.keys())},
        ip_address=get_client_ip(request)
    )

    return UserResponse.model_validate(current_user)
