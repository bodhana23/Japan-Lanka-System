# API routers
from app.routers.auth import router as auth_router
from app.routers.products import router as products_router
from app.routers.orders import router as orders_router
from app.routers.users import router as users_router

__all__ = [
    "auth_router",
    "products_router",
    "orders_router",
    "users_router",
]
