# Claude.md - Japan Lanka System Reference

## Project Overview
**Japan Lanka Enterprises** - Automobile Parts Management System
- E-commerce platform for vehicle parts in Sri Lanka
- Multi-role system: Customer, Manager, Admin, Auditor
- Full-stack application with React frontend and FastAPI backend
- PostgreSQL database with SQLAlchemy ORM (3NF normalized)
- JWT authentication with bcrypt password hashing
- Google OAuth integration via Firebase

## Tech Stack

### Frontend
- React 18.2.0
- TypeScript 4.9.5
- React Router DOM 6.22.3
- Vite 5.1.4 (build tool)
- Axios (HTTP client)
- Firebase (Google Auth)
- Context API for state management
- Pure CSS styling

### Backend
- Python 3.11+
- FastAPI 0.109.0
- SQLAlchemy 2.0 (ORM)
- PostgreSQL (database, timezone: Asia/Colombo)
- Alembic (migrations)
- python-jose (JWT tokens)
- passlib + bcrypt (password hashing)
- Pydantic (validation)

## Project Structure
```
Japan-Lanka-System/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ProfileModal.tsx
│   │   │   ├── NotificationBell.tsx    # Notification dropdown
│   │   │   ├── NotificationBell.css
│   │   │   └── Toast.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # JWT auth + Google OAuth
│   │   │   └── CartContext.tsx         # Shopping cart (guest + DB)
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── EmployeeLogin.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── CustomerDashboard.tsx
│   │   │   ├── MyOrders.tsx
│   │   │   ├── ManagerDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AuditorDashboard.tsx
│   │   │   ├── Shop.tsx
│   │   │   ├── Checkout.tsx
│   │   │   └── ManageUsers.tsx
│   │   ├── services/
│   │   │   └── api.ts                  # API client with axios
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── dateUtils.ts            # Date formatting (Sri Lanka TZ)
│   │   ├── config/
│   │   │   └── firebase.ts             # Firebase configuration
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI app entry
│   │   ├── database.py                 # DB connection
│   │   ├── config.py                   # Settings/config
│   │   ├── init_db.py                  # Database seeding
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   ├── order_item.py
│   │   │   ├── cart.py                 # Cart & CartItem
│   │   │   ├── notification.py
│   │   │   ├── order_status_history.py
│   │   │   ├── inventory_transaction.py
│   │   │   ├── return_request.py
│   │   │   └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   ├── cart.py
│   │   │   ├── notification.py
│   │   │   ├── order_status_history.py
│   │   │   └── inventory_transaction.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                 # Authentication endpoints
│   │   │   ├── products.py             # Product CRUD
│   │   │   ├── orders.py               # Order management
│   │   │   ├── users.py                # User management
│   │   │   ├── cart.py                 # Shopping cart API
│   │   │   ├── notifications.py        # Notifications API
│   │   │   ├── inventory.py            # Inventory transactions
│   │   │   └── returns.py              # Return requests
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── notification_service.py # Notification helpers
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── security.py             # JWT & password utils
│   ├── alembic/                        # Database migrations
│   ├── requirements.txt
│   └── alembic.ini
│
└── CLAUDE.md
```

## API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new customer |
| POST | `/login` | Login and get JWT token |
| POST | `/google` | Google OAuth login |
| GET | `/me` | Get current user profile |
| PUT | `/me` | Update current user profile |

### Products (`/api/v1/products`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List products (with filters) |
| GET | `/{id}` | Get product by ID |
| POST | `/` | Create product (manager+) |
| PUT | `/{id}` | Update product (manager+) |
| DELETE | `/{id}` | Soft delete product (manager+) |

### Orders (`/api/v1/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all orders (manager+) |
| GET | `/my-orders` | Get current user's orders |
| GET | `/{id}` | Get order by ID |
| POST | `/` | Create new order |
| PUT | `/{id}/status` | Update order status (manager+) |

### Cart (`/api/v1/cart`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get current user's cart |
| POST | `/items` | Add item to cart |
| PUT | `/items/{id}` | Update cart item quantity |
| DELETE | `/items/{id}` | Remove item from cart |
| DELETE | `/` | Clear entire cart |

### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List user notifications |
| GET | `/unread-count` | Get unread notification count |
| PUT | `/{id}/read` | Mark notification as read |
| PUT | `/read-all` | Mark all notifications as read |
| DELETE | `/{id}` | Delete a notification |

### Inventory (`/api/v1/inventory`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List inventory transactions |
| GET | `/transactions/{product_id}` | Get product transaction history |
| POST | `/adjust` | Manual inventory adjustment (manager+) |

### Returns (`/api/v1/returns`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all return requests (manager+) |
| GET | `/my-requests` | Get current user's returns |
| POST | `/` | Create return request |
| PUT | `/{id}/status` | Update return status (manager+) |

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List users (admin only) |
| GET | `/{id}` | Get user by ID (admin only) |
| PUT | `/{id}/role` | Update user role (admin only) |
| PUT | `/{id}/status` | Activate/deactivate user (admin only) |

## Database Models (3NF Normalized)

### User
```python
class User(Base):
    id: UUID
    email: str (unique)
    hashed_password: str
    full_name: str
    phone_number: str (optional)
    role: Enum['customer', 'manager', 'admin', 'auditor']
    is_active: bool
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    orders: List[Order]
    cart: Cart
    notifications: List[Notification]
    return_requests: List[ReturnRequest]
```

### Product
```python
class Product(Base):
    id: UUID
    name: str
    description: str (optional)
    brand: str
    model: str
    year_from: int (optional)
    year_to: int (optional)
    category: str
    price: Decimal
    quantity_available: int
    image_url: str (optional)
    is_active: bool
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    inventory_transactions: List[InventoryTransaction]
```

### Order
```python
class Order(Base):
    id: UUID
    user_id: UUID (FK)
    status: Enum['pending', 'confirmed', 'shipped', 'ready_to_pickup', 'delivered', 'cancelled']
    delivery_method: Enum['pickup', 'shipping']
    total_amount: Decimal
    shipping_address: str (optional)
    shipping_city: str (optional)
    shipping_postal_code: str (optional)
    notes: str (optional)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    items: List[OrderItem]
    status_history: List[OrderStatusHistory]
    user: User  # Customer phone fetched from user.phone_number
```

### OrderItem
```python
class OrderItem(Base):
    id: UUID
    order_id: UUID (FK)
    product_id: UUID (FK)
    quantity: int
    unit_price: Decimal
    created_at: datetime (UTC)
```

### Cart
```python
class Cart(Base):
    id: UUID
    user_id: UUID (FK, unique)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    items: List[CartItem]
```

### CartItem
```python
class CartItem(Base):
    id: UUID
    cart_id: UUID (FK)
    product_id: UUID (FK)
    quantity: int
    created_at: datetime (UTC)
```

### Notification
```python
class Notification(Base):
    id: UUID
    user_id: UUID (FK)
    title: str
    message: str
    type: Enum['order_update', 'return_update', 'system', 'promotion']
    is_read: bool (default: False)
    related_order_id: UUID (optional)
    related_return_id: UUID (optional)
    created_at: datetime (UTC)
```

### OrderStatusHistory
```python
class OrderStatusHistory(Base):
    id: UUID
    order_id: UUID (FK)
    old_status: str (optional)
    new_status: str
    changed_by_id: UUID (FK to User)
    notes: str (optional)
    created_at: datetime (UTC)
```

### InventoryTransaction
```python
class InventoryTransaction(Base):
    id: UUID
    product_id: UUID (FK)
    transaction_type: Enum['stock_in', 'stock_out', 'adjustment', 'return_in']
    quantity_change: int
    quantity_before: int
    quantity_after: int
    reference_id: UUID (optional)  # order_id or return_id
    notes: str (optional)
    created_by_id: UUID (FK to User)
    created_at: datetime (UTC)
```

### ReturnRequest
```python
class ReturnRequest(Base):
    id: UUID
    order_id: UUID (FK)
    user_id: UUID (FK)
    reason: str
    status: Enum['pending', 'approved', 'rejected', 'completed']
    admin_notes: str (optional)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
```

### AuditLog
```python
class AuditLog(Base):
    id: UUID
    user_id: UUID (FK, optional)
    action: str
    entity_type: str
    entity_id: UUID (optional)
    old_values: JSON (optional)
    new_values: JSON (optional)
    ip_address: str (optional)
    user_agent: str (optional)
    created_at: datetime (UTC)
```

## Frontend API Client (`services/api.ts`)

### Available API Objects
```typescript
// Authentication
authApi.register(email, fullName, password, phoneNumber?)
authApi.login(email, password)
authApi.googleAuth(firebaseToken, displayName, email)
authApi.getMe()
authApi.updateMe(data)

// Products
productsApi.getProducts(filters?)
productsApi.getProduct(id)
productsApi.createProduct(product)
productsApi.updateProduct(id, product)
productsApi.deleteProduct(id)

// Orders
ordersApi.getOrders(params?)
ordersApi.getMyOrders(status?, page?, pageSize?)
ordersApi.getOrder(id)
ordersApi.createOrder(order)
ordersApi.updateOrderStatus(id, status)

// Cart
cartApi.getCart()
cartApi.addItem(productId, quantity)
cartApi.updateItem(itemId, quantity)
cartApi.removeItem(itemId)
cartApi.clearCart()

// Notifications
notificationsApi.getNotifications(params?)
notificationsApi.getUnreadCount()
notificationsApi.markAsRead(id)
notificationsApi.markAllAsRead()
notificationsApi.deleteNotification(id)

// Returns
returnsApi.getReturns(params?)
returnsApi.getMyReturns()
returnsApi.createReturn(orderId, reason)
returnsApi.updateReturnStatus(id, status, adminNotes?)

// Users
usersApi.getUsers(params?)
usersApi.getUser(id)
usersApi.updateUserRole(id, role)
usersApi.updateUserStatus(id, isActive)
```

## Date/Time Handling

### Backend
- All timestamps stored in **UTC** using `datetime.utcnow`
- PostgreSQL timezone set to `Asia/Colombo`

### Frontend Date Utilities (`utils/dateUtils.ts`)
```typescript
// Convert UTC to Sri Lanka time (Asia/Colombo, UTC+5:30)
formatDateTime(dateString)    // "17 Jan 2026, 10:57 pm"
formatDate(dateString)        // "17 Jan 2026"
formatTime(dateString)        // "10:57 pm"
formatRelativeTime(dateString) // "2 hours ago" or "3 days ago"
formatOrderDate(dateString)   // "17/01/2026 22:57"
formatFullDate(dateString)    // "17 January 2026"
```

## Cart System

### Dual Cart Architecture
- **Guest Users**: Cart stored in `sessionStorage`
- **Logged-in Users**: Cart stored in database via API
- **On Login**: Guest cart automatically merges with database cart

### CartContext Functions
```typescript
addToCart(item)           // Add item to cart
removeFromCart(id)        // Remove item
updateQuantity(id, qty)   // Update quantity
clearCart()               // Clear all items
getTotalPrice()           // Calculate total
syncCartFromApi()         // Fetch cart from server
mergeLocalCartToServer()  // Merge guest cart on login
```

## Authentication Flow

1. User submits login credentials (or uses Google OAuth)
2. Backend validates and returns JWT token + user data
3. Frontend stores token in `localStorage.token`
4. Frontend stores user in `localStorage.currentUser`
5. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
6. **On login**: CartSyncManager merges local cart to server
7. Backend validates JWT on protected routes
8. 401 responses trigger automatic logout and redirect

## Running the Application

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Initialize database with seed data
python -m app.init_db

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/japanlanka
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

## User Roles & Permissions

| Role | Products | Orders | Users | Analytics | Returns | Inventory |
|------|----------|--------|-------|-----------|---------|-----------|
| Customer | View | Create, View Own | - | - | Create, View Own | - |
| Manager | CRUD | View All, Update Status | - | - | View All, Update | Adjust |
| Admin | View | View All | CRUD | View | View All | View |
| Auditor | View | View All | View | View | View All | View |

## Current Features

### Implemented
- JWT authentication with login/register
- Google OAuth integration
- Product catalog with filtering
- Shopping cart (sessionStorage for guests, database for logged-in)
- Cart merge on login
- Order creation and tracking
- Order status history tracking
- Customer order history with My Orders page
- Manager inventory management
- Manager order processing
- Admin user management
- Notification system with bell dropdown
- Return request management
- Inventory transaction audit trail
- Role-based access control
- Responsive design
- Window shopper flow (browse without login)
- Local timezone display (Sri Lanka)

### TODO / Future Enhancements
- Email notifications
- Payment integration
- Advanced analytics dashboard
- Product reviews and ratings
- Wishlist functionality

## Recent Changes (January 2026)

### Database Normalization to 3NF (Jan 17)
- Created new tables: `carts`, `cart_items`, `notifications`, `order_status_history`, `inventory_transactions`
- Removed redundant `customer_phone` from orders table (now fetched from `user.phone_number`)
- Added proper foreign key relationships and cascading deletes

### New API Endpoints (Jan 17)
- Cart API (`/api/v1/cart`) - Full CRUD for shopping cart
- Notifications API (`/api/v1/notifications`) - User notification management
- Inventory API (`/api/v1/inventory`) - Inventory transaction tracking

### Frontend Updates (Jan 17)
- Rewrote `CartContext.tsx` for dual cart support (guest + database)
- Created `NotificationBell.tsx` component with dropdown
- Added `CartSyncManager` in `App.tsx` for login cart sync
- Created `dateUtils.ts` for Sri Lanka timezone formatting
- Updated all dashboard components to use date utilities

### Files Created
- `backend/app/models/cart.py`
- `backend/app/models/notification.py`
- `backend/app/models/order_status_history.py`
- `backend/app/models/inventory_transaction.py`
- `backend/app/routers/cart.py`
- `backend/app/routers/notifications.py`
- `backend/app/routers/inventory.py`
- `backend/app/schemas/cart.py`
- `backend/app/schemas/notification.py`
- `backend/app/schemas/inventory_transaction.py`
- `backend/app/services/notification_service.py`
- `frontend/src/components/NotificationBell.tsx`
- `frontend/src/components/NotificationBell.css`
- `frontend/src/utils/dateUtils.ts`

### Files Modified
- `backend/app/models/order.py` - Removed customer_phone, added relationships
- `backend/app/routers/orders.py` - Added status history tracking
- `frontend/src/services/api.ts` - Added cart, notifications APIs
- `frontend/src/context/CartContext.tsx` - Complete rewrite for dual cart
- `frontend/src/context/AuthContext.tsx` - Added setOnLoginSuccess callback
- `frontend/src/App.tsx` - Added CartSyncManager component
- `frontend/src/pages/CustomerDashboard.tsx` - Uses formatDateTime
- `frontend/src/pages/MyOrders.tsx` - Uses formatDateTime
- `frontend/src/pages/ManagerDashboard.tsx` - Uses formatDateTime
- `frontend/src/pages/AdminDashboard.tsx` - Uses formatDate
- `frontend/src/pages/Checkout.tsx` - Uses ordersApi.createOrder()
