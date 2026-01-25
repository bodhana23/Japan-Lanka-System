"""Firebase Admin SDK initialization and token verification.

SECURITY: This module handles Firebase ID token verification.
All Google OAuth authentication MUST use verify_firebase_token() to ensure
tokens are cryptographically verified against Firebase's public keys.
"""

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

    credentials_path = settings.FIREBASE_CREDENTIALS_PATH

    if not credentials_path:
        logger.warning(
            "FIREBASE_CREDENTIALS_PATH not set. "
            "Google authentication will not work until this is configured."
        )
        return False

    try:
        cred = credentials.Certificate(credentials_path)
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
    except ValueError as e:
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
        decoded_token = auth.verify_id_token(token)
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
