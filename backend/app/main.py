import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.utils.firebase import init_firebase

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import all models to register them with Base
from app.models import (  # noqa: F401
    Customer, Employee, Product, Order, OrderItem, AuditLog, ReturnRequest,
    Cart, CartItem, OrderStatusHistory, Notification, InventoryTransaction
)

# Import routers
from app.routers import (
    auth_customer_router, auth_employee_router, products_router, orders_router,
    users_router, returns_router, cart_router, notifications_router, inventory_router
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
