"""Firebase Admin SDK initialization and token verification.

SECURITY: This module handles Firebase ID token verification.
All Google OAuth authentication MUST use verify_firebase_token() to ensure
tokens are cryptographically verified against Firebase's public keys.
"""

import json
import logging
from typing import Optional

import firebase_admin
from firebase_admin import auth, credentials

from app.config import settings

logger = logging.getLogger(__name__)

# Track initialization state
_firebase_initialized = False


def init_firebase() -> bool:
    """Initialize Firebase Admin SDK.

    This function should be called once during application startup.
    It uses the service account credentials file specified by the
    FIREBASE_CREDENTIALS_PATH environment variable.

    Returns:
        True if initialization succeeded or was already done, False otherwise.
    """
    global _firebase_initialized

    if _firebase_initialized:
        return True

    credentials_json = settings.FIREBASE_CREDENTIALS_JSON
    credentials_path = settings.FIREBASE_CREDENTIALS_PATH

    if not credentials_json and not credentials_path:
        logger.warning(
            "Neither FIREBASE_CREDENTIALS_JSON nor FIREBASE_CREDENTIALS_PATH is set. "
            "Google authentication will not work until one of these is configured."
        )
        return False

    try:
        if credentials_json:
            # Cloud deployment path: credentials provided as JSON string env var
            cred = credentials.Certificate(json.loads(credentials_json))
            logger.info("Firebase Admin SDK initializing from FIREBASE_CREDENTIALS_JSON env var")
        else:
            # Local development path: credentials provided as a file path
            cred = credentials.Certificate(credentials_path)
            logger.info(f"Firebase Admin SDK initializing from file: {credentials_path}")

        firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        logger.info("Firebase Admin SDK initialized successfully")
        return True
    except FileNotFoundError:
        logger.error(
            f"Firebase credentials file not found at: {credentials_path}. "
            "Please ensure FIREBASE_CREDENTIALS_PATH points to a valid service account JSON file."
        )
        return False
    except (ValueError, json.JSONDecodeError) as e:
        logger.error(f"Invalid Firebase credentials: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        return False


def is_firebase_initialized() -> bool:
    """Check if Firebase Admin SDK has been initialized."""
    return _firebase_initialized


def verify_firebase_token(token: str) -> Optional[dict]:
    """Verify a Firebase ID token and return decoded claims.

    SECURITY: This function performs cryptographic signature verification
    using Firebase's public keys. It validates:
    - Token signature
    - Token expiration
    - Token audience (project ID)
    - Token issuer

    Args:
        token: The Firebase ID token to verify.

    Returns:
        Decoded token claims dict if valid, None if verification fails.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        # SECURITY: verify_id_token performs full cryptographic verification
        # including signature, expiration, audience, and issuer checks
        decoded_token = auth.verify_id_token(
            token,
            clock_skew_seconds=settings.FIREBASE_CLOCK_SKEW_SECONDS,
        )
        return decoded_token
    except auth.ExpiredIdTokenError:
        logger.warning("Firebase token has expired")
        return None
    except auth.RevokedIdTokenError:
        logger.warning("Firebase token has been revoked")
        return None
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase token: {e}")
        return None
    except auth.CertificateFetchError as e:
        logger.error(f"Failed to fetch Firebase certificates: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error verifying Firebase token: {e}")
        return None


def create_firebase_user(email: str, password: str) -> Optional[str]:
    """Create a new Firebase user for email/password authentication.

    This creates a user in Firebase Auth which enables:
    - Email verification via Firebase's built-in system
    - Password reset functionality
    - Consistent auth state between Firebase and backend

    Args:
        email: The user's email address.
        password: The user's password.

    Returns:
        The Firebase UID if successful, None if creation fails.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        user = auth.create_user(
            email=email,
            password=password,
            email_verified=False  # User must verify email
        )
        logger.info(f"Created Firebase user with UID: {user.uid}")
        return user.uid
    except auth.EmailAlreadyExistsError:
        logger.warning(f"Firebase user with email {email} already exists")
        return None
    except Exception as e:
        logger.error(f"Failed to create Firebase user: {e}")
        return None


def get_firebase_user(uid: str) -> Optional[dict]:
    """Get Firebase user information by UID.

    Args:
        uid: The Firebase user ID.

    Returns:
        Dict with user info (email, email_verified, etc.) if found, None otherwise.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        user = auth.get_user(uid)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified,
            "display_name": user.display_name,
            "disabled": user.disabled,
        }
    except auth.UserNotFoundError:
        logger.warning(f"Firebase user not found: {uid}")
        return None
    except Exception as e:
        logger.error(f"Failed to get Firebase user: {e}")
        return None


def get_firebase_user_by_email(email: str) -> Optional[dict]:
    """Get Firebase user information by email.

    Args:
        email: The user's email address.

    Returns:
        Dict with user info (uid, email_verified, etc.) if found, None otherwise.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        user = auth.get_user_by_email(email)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified,
            "display_name": user.display_name,
            "disabled": user.disabled,
        }
    except auth.UserNotFoundError:
        logger.warning(f"Firebase user not found with email: {email}")
        return None
    except Exception as e:
        logger.error(f"Failed to get Firebase user by email: {e}")
        return None


def generate_email_verification_link(email: str) -> Optional[str]:
    """Generate an email verification link for a Firebase user.

    The link can be sent to the user via your own email service.
    When clicked, Firebase will mark the user's email as verified.

    Args:
        email: The user's email address.

    Returns:
        The verification link URL if successful, None otherwise.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        # Generate verification link using Firebase Admin SDK
        # The link redirects to Firebase's verification handler
        link = auth.generate_email_verification_link(email)
        logger.info(f"Generated email verification link for: {email}")
        return link
    except auth.UserNotFoundError:
        logger.warning(f"Cannot generate verification link - user not found: {email}")
        return None
    except Exception as e:
        logger.error(f"Failed to generate email verification link: {e}")
        return None


def delete_firebase_user(uid: str) -> bool:
    """Delete a Firebase user by UID.

    Use this to clean up Firebase users if backend registration fails.

    Args:
        uid: The Firebase user ID to delete.

    Returns:
        True if deletion succeeded, False otherwise.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        auth.delete_user(uid)
        logger.info(f"Deleted Firebase user: {uid}")
        return True
    except auth.UserNotFoundError:
        logger.warning(f"Firebase user not found for deletion: {uid}")
        return True  # Consider it success if user doesn't exist
    except Exception as e:
        logger.error(f"Failed to delete Firebase user: {e}")
        return False


def update_firebase_user_email_verified(uid: str, verified: bool) -> bool:
    """Update a Firebase user's email verification status.

    Args:
        uid: The Firebase user ID.
        verified: The new email verification status.

    Returns:
        True if update succeeded, False otherwise.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        auth.update_user(uid, email_verified=verified)
        logger.info(f"Updated email_verified={verified} for Firebase user: {uid}")
        return True
    except auth.UserNotFoundError:
        logger.warning(f"Firebase user not found: {uid}")
        return False
    except Exception as e:
        logger.error(f"Failed to update Firebase user: {e}")
        return False


def generate_password_reset_link(email: str) -> Optional[str]:
    """Generate a password reset link for a Firebase user.

    SECURITY: This function generates a secure, time-limited password reset link
    using Firebase's built-in password reset flow. Firebase handles:
    - Secure token generation
    - Token expiration (typically 1 hour)
    - One-time use enforcement
    - Email delivery (when using Firebase's email service)

    The link can be sent to the user via your own email service or
    Firebase's built-in email delivery.

    Args:
        email: The user's email address.

    Returns:
        The password reset link URL if successful, None otherwise.

    Raises:
        RuntimeError: If Firebase Admin SDK is not initialized.
    """
    if not _firebase_initialized:
        raise RuntimeError(
            "Firebase Admin SDK not initialized. "
            "Ensure FIREBASE_CREDENTIALS_PATH is set and init_firebase() was called."
        )

    try:
        # Generate password reset link using Firebase Admin SDK
        # Firebase handles token security, expiration, and one-time use
        link = auth.generate_password_reset_link(email)
        logger.info(f"Generated password reset link for: {email}")
        return link
    except auth.UserNotFoundError:
        # SECURITY: Log but don't expose that user doesn't exist
        logger.warning(f"Cannot generate password reset link - user not found: {email}")
        return None
    except Exception as e:
        logger.error(f"Failed to generate password reset link: {e}")
        return None
