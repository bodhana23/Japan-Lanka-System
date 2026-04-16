import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.config import settings
from app.database import engine, Base
from app.utils.firebase import init_firebase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import all models to register them with Base
from app.models import (  # noqa: F401
    Customer, Employee, Product, Order, OrderItem, AuditLog, ReturnRequest,
    Cart, CartItem, OrderStatusHistory, Notification, InventoryTransaction,
    InventoryLog, ActivityLog, Advertisement
)

# Import routers
from app.routers import (
    auth_customer_router, auth_employee_router, products_router, orders_router,
    users_router, returns_router, cart_router, notifications_router, inventory_router,
    auditor_router, payments_router, analytics_router, advertisements_router,
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize Firebase Admin SDK for Google OAuth token verification
# SECURITY: This must be initialized before handling any Google auth requests
if init_firebase():
    logger.info("Firebase Admin SDK ready for Google authentication")
else:
    logger.warning(
        "Firebase Admin SDK not initialized. "
        "Set FIREBASE_CREDENTIALS_PATH environment variable to enable Google authentication."
    )

app = FastAPI(
    title="Japan Lanka API",
    description="Backend API for Japan Lanka Automobile Parts E-commerce System",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom exception handlers for better validation error messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors and return user-friendly messages.

    """
    # Log the full validation error for debugging
    logger.error(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")

    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"][1:])  # Skip 'body'
        message = error["msg"]
        error_type = error["type"]
        
        # Customize error messages based on error type
        if error_type == "string_too_short":
            min_length = error.get("ctx", {}).get("min_length", "required")
            message = f"{field} must be at least {min_length} characters long"
        elif error_type == "string_too_long":
            max_length = error.get("ctx", {}).get("max_length", "allowed")
            message = f"{field} must not exceed {max_length} characters"
        elif error_type == "value_error":
            # Use the custom validation message from our validators
            message = error.get("msg", message)
        elif error_type == "missing":
            message = f"{field} is required"
        elif "email" in error_type.lower():
            message = f"{field} must be a valid email address"
        
        errors.append({
            "field": field,
            "message": message,
            "type": error_type
        })
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


@app.exception_handler(ValidationError)
async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
    """
    Handle direct Pydantic validation errors.
    """
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        
        errors.append({
            "field": field,
            "message": message,
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": "Validation error",
            "errors": errors
        }
    )


# Register routers with API prefix
# Auth routers - separate endpoints for customers and employees
app.include_router(auth_customer_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_employee_router, prefix=settings.API_V1_PREFIX)

# Other routers
app.include_router(products_router, prefix=settings.API_V1_PREFIX)
app.include_router(orders_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(returns_router, prefix=settings.API_V1_PREFIX)
app.include_router(cart_router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications_router, prefix=settings.API_V1_PREFIX)
app.include_router(inventory_router, prefix=settings.API_V1_PREFIX)
app.include_router(auditor_router, prefix=settings.API_V1_PREFIX)
app.include_router(payments_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(advertisements_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    """Health check endpoint to verify the API is running."""
    return {"status": "healthy"}


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to Japan Lanka API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "api_prefix": settings.API_V1_PREFIX
    }
