# Pydantic schemas
from app.schemas.customer import (
    CustomerCreate,
    CustomerLogin,
    GoogleAuthRequest,
    CustomerUpdate,
    CustomerResponse,
    CustomerTokenResponse,
    MessageResponse,
)
from app.schemas.employee import (
    EmployeeLogin,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeTokenResponse,
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
from app.schemas.return_request import (
    ReturnItemCreate,
    ReturnItemResponse,
    ReturnRequestCreate,
    ReturnRequestStatusUpdate,
    ReturnRequestResponse,
    ReturnRequestListResponse,
    EligibleOrderItemResponse,
    EligibleOrderResponse,
    EligibleOrdersListResponse,
)

__all__ = [
    # Customer schemas
    "CustomerCreate",
    "CustomerLogin",
    "GoogleAuthRequest",
    "CustomerUpdate",
    "CustomerResponse",
    "CustomerTokenResponse",
    "MessageResponse",
    # Employee schemas
    "EmployeeLogin",
    "EmployeeUpdate",
    "EmployeeResponse",
    "EmployeeTokenResponse",
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
    # Return Request schemas
    "ReturnItemCreate",
    "ReturnItemResponse",
    "ReturnRequestCreate",
    "ReturnRequestStatusUpdate",
    "ReturnRequestResponse",
    "ReturnRequestListResponse",
    "EligibleOrderItemResponse",
    "EligibleOrderResponse",
    "EligibleOrdersListResponse",
    # Audit schemas
    "AuditLogResponse",
    "AuditLogListResponse",
    "AuditLogFilter",
]
