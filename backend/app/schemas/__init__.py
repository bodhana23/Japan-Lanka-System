# Pydantic schemas
from app.schemas.user import (
    UserCreate,
    UserLogin,
    GoogleAuthRequest,
    UserUpdate,
    UserRoleUpdate,
    UserStatusUpdate,
    UserResponse,
    UserListResponse,
    TokenResponse,
    MessageResponse,
)
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductFilter,
)
from app.schemas.order import (
    OrderItemCreate,
    OrderItemResponse,
    OrderCreate,
    OrderStatusUpdate,
    OrderResponse,
    OrderListResponse,
    OrderFilter,
)
from app.schemas.audit import (
    AuditLogResponse,
    AuditLogListResponse,
    AuditLogFilter,
)
from app.schemas.cart import (
    CartItemCreate,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
)
from app.schemas.order_status_history import (
    OrderStatusHistoryResponse,
    OrderStatusHistoryListResponse,
)
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    UnreadCountResponse,
)
from app.schemas.inventory_transaction import (
    InventoryAdjustmentCreate,
    InventoryTransactionResponse,
    InventoryTransactionListResponse,
)

__all__ = [
    # User schemas
    "UserCreate",
    "UserLogin",
    "GoogleAuthRequest",
    "UserUpdate",
    "UserRoleUpdate",
    "UserStatusUpdate",
    "UserResponse",
    "UserListResponse",
    "TokenResponse",
    "MessageResponse",
    # Product schemas
    "ProductCreate",
    "ProductUpdate",
    "ProductResponse",
    "ProductListResponse",
    "ProductFilter",
    # Order schemas
    "OrderItemCreate",
    "OrderItemResponse",
    "OrderCreate",
    "OrderStatusUpdate",
    "OrderResponse",
    "OrderListResponse",
    "OrderFilter",
    # Order Status History schemas
    "OrderStatusHistoryResponse",
    "OrderStatusHistoryListResponse",
    # Cart schemas
    "CartItemCreate",
    "CartItemUpdate",
    "CartItemResponse",
    "CartResponse",
    # Notification schemas
    "NotificationResponse",
    "NotificationListResponse",
    "UnreadCountResponse",
    # Inventory Transaction schemas
    "InventoryAdjustmentCreate",
    "InventoryTransactionResponse",
    "InventoryTransactionListResponse",
    # Audit schemas
    "AuditLogResponse",
    "AuditLogListResponse",
    "AuditLogFilter",
]
