# API routers
from app.routers.auth_customer import router as auth_customer_router
from app.routers.auth_employee import router as auth_employee_router
from app.routers.products import router as products_router
from app.routers.orders import router as orders_router
from app.routers.users import router as users_router
from app.routers.returns import router as returns_router
from app.routers.cart import router as cart_router
from app.routers.notifications import router as notifications_router
from app.routers.inventory import router as inventory_router
from app.routers.auditor import router as auditor_router

__all__ = [
    "auth_customer_router",
    "auth_employee_router",
    "products_router",
    "orders_router",
    "users_router",
    "returns_router",
    "cart_router",
    "notifications_router",
    "inventory_router",
    "auditor_router",
]
