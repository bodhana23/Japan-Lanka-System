# Claude.md - Japan Lanka System Reference
*Last updated: February 1, 2026*

## Project Overview
**Japan Lanka Enterprises** - Automobile Parts Management System
- E-commerce platform for vehicle parts in Sri Lanka
- Multi-role system: Customer, Manager, Admin, Auditor
- Full-stack application with React frontend and FastAPI backend
- PostgreSQL database with SQLAlchemy ORM (3NF normalized)
- JWT authentication with bcrypt password hashing
- Google OAuth integration via Firebase
- Return request system for order management
- Real-time notifications and audit logging

## Tech Stack

### Frontend
- React 18.2.0
- TypeScript 4.9.5
- React Router DOM 6.22.3
- Vite 5.1.4 (build tool)
- Axios (HTTP client)
- Firebase (Google Auth)
- Context API for state management
- Pure CSS styling with Design Tokens (`tokens.css`)
- Lucide React icons

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
│   │   │   ├── customer.py             # Customer model
│   │   │   ├── employee.py             # Employee model
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
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   ├── cart.py
│   │   │   ├── customer.py             # Customer model
│   │   │   ├── employee.py             # Employee model  
│   │   │   ├── return_request.py       # Return requests
│   │   │   ├── notification.py
│   │   │   ├── order_status_history.py
│   │   │   ├── audit_log.py            # System audit trails
│   │   │   └── inventory_transaction.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth_customer.py        # Customer authentication
│   │   │   ├── auth_employee.py        # Employee authentication
│   │   │   ├── products.py             # Product CRUD
│   │   │   ├── orders.py               # Order management
│   │   │   ├── users.py                # User management
│   │   │   ├── cart.py                 # Shopping cart API
│   │   │   ├── notifications.py        # Notifications API
│   │   │   ├── inventory.py            # Inventory transactions
│   │   │   └── returns.py              # Return requests
│   │   ├── schemas/
│   │   │   ├── customer.py             # Customer validation schemas
│   │   │   ├── employee.py             # Employee validation schemas
│   │   │   ├── product.py              # Product schemas
│   │   │   ├── order.py                # Order schemas
│   │   │   ├── return_request.py       # Return request schemas
│   │   │   └── notification.py         # Notification schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── notification_service.py # Notification helpers
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── deps.py                 # FastAPI dependencies
│   │       ├── security.py             # JWT & password utils
│   │       └── firebase.py             # Firebase token verification
│   ├── alembic/                        # Database migrations
│   ├── requirements.txt
│   └── alembic.ini
│
└── CLAUDE.md
```

## API Endpoints

### Customer Authentication (`/api/v1/auth/customer`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new customer |
| POST | `/login` | Customer login with JWT |
| POST | `/google` | Google OAuth login |
| POST | `/complete-registration` | Complete Google signup |
| GET | `/me` | Get current customer profile |
| PUT | `/me` | Update customer profile |

### Employee Authentication (`/api/v1/auth/employee`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Employee login with JWT |
| GET | `/me` | Get current employee profile |
| PUT | `/me` | Update employee profile |

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
| GET | `/my-orders` | Get customer's orders |
| GET | `/` | List all orders (employees) |
| POST | `/` | Create new order |
| GET | `/{id}` | Get order details |
| PUT | `/{id}/status` | Update order status (employees) |

### Returns (`/api/v1/returns`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/my-requests` | Get customer's return requests |
| GET | `/eligible-orders` | Get orders eligible for return |
| POST | `/` | Create return request |
| GET | `/` | List return requests (employees see all) |
| GET | `/{id}` | Get return request details |
| PUT | `/{id}/status` | Update return status (manager+) |

### Cart (`/api/v1/cart`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get current cart items |
| POST | `/items` | Add item to cart |
| PUT | `/items/{id}` | Update cart item quantity |
| DELETE | `/items/{id}` | Remove item from cart |
| DELETE | `/clear` | Clear entire cart |

### Notifications (`/api/v1/notifications`)
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

### Customer
```python
class Customer(Base):
    id: UUID
    email: str (unique)
    full_name: str
    phone_number: str (optional)
    address: str (optional)
    password_hash: str (optional)  # None for Google OAuth users
    firebase_uid: str (optional)   # For Google OAuth users
    email_verified: bool
    is_active: bool
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    orders: List[Order]
    cart_items: List[CartItem]
    notifications: List[Notification]
    return_requests: List[ReturnRequest]
```

### Employee
```python
class Employee(Base):
    id: UUID
    email: str (unique)
    full_name: str
    password_hash: str
    role: Enum['manager', 'admin', 'auditor']
    is_active: bool
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    audit_logs: List[AuditLog]
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
    customer_id: UUID (FK)
    status: Enum['pending', 'confirmed', 'shipped', 'ready_to_pickup', 'delivered', 'cancelled']
    delivery_method: Enum['pickup', 'shipping']
    total_amount: Decimal
    shipping_address: str (optional)
    shipping_city: str (optional)
    payment_status: Enum['pending', 'paid', 'failed']
    notes: str (optional)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    customer: Customer
    items: List[OrderItem]
    status_history: List[OrderStatusHistory]
    return_requests: List[ReturnRequest]
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
    # Relationships
    order: Order
    product: Product
    return_items: List[ReturnItem]
```

### Cart & CartItem
```python
class Cart(Base):
    id: UUID
    customer_id: UUID (FK)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)

class CartItem(Base):
    id: UUID
    cart_id: UUID (FK)
    product_id: UUID (FK)
    quantity: int
    created_at: datetime (UTC)
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
    customer_id: UUID (FK, optional)
    employee_id: UUID (FK, optional)
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
    changed_by_employee_id: UUID (FK to Employee)
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
    employee_id: UUID (FK to Employee)
    created_at: datetime (UTC)
```

### ReturnRequest & ReturnItem
```python
class ReturnRequest(Base):
    id: UUID
    order_id: UUID (FK)
    customer_id: UUID (FK)
    reason: str
    description: str (optional)
    status: Enum['pending', 'approved', 'rejected', 'completed']
    admin_notes: str (optional)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Relationships
    order: Order
    customer: Customer
    return_items: List[ReturnItem]

class ReturnItem(Base):
    id: UUID
    return_request_id: UUID (FK)
    order_item_id: UUID (FK)
    quantity: int
    created_at: datetime (UTC)
```

### AuditLog
```python
class AuditLog(Base):
    id: UUID
    customer_id: UUID (FK, optional)
    employee_id: UUID (FK, optional)
    action: str
    entity_type: str
    entity_id: str (optional)
    details: JSON (optional)
    ip_address: str (optional)
    created_at: datetime (UTC)
```

### Notification
```python
class Notification(Base):
    id: UUID
    customer_id: UUID (FK, optional)
    employee_id: UUID (FK, optional)
    title: str
    message: str
    type: Enum['order_update', 'return_update', 'system', 'promotion']
    is_read: bool (default: False)
    related_order_id: UUID (optional)
    related_return_id: UUID (optional)
    created_at: datetime (UTC)
```

## Business Rules & Validation

### Authentication
- **Customer Registration**: Email + password OR Google OAuth
- **Email Verification**: Required for email/password users via Firebase
- **Password Rules (Customers)**: 8+ chars, uppercase, lowercase, number, special char
- **Password Rules (Employees)**: 8+ chars, uppercase, lowercase, number, special char
- **Email Format**: Must contain @ and valid domain (validated via Pydantic EmailStr)
- **Full Name**: Letters, spaces, hyphens, apostrophes only (no numbers)
- **Phone**: Sri Lankan format (10 digits starting with 0)
- **Employee Creation**: Admin-only, no Firebase UID required initially

### Validation Implementation
**Customer Validation** (`backend/app/schemas/customer.py`):
- Line 14: `EmailStr` for email format
- Lines 19-30: `validate_full_name` - no numbers allowed
- Lines 32-43: `validate_phone_number` - Sri Lankan format (10 digits, starts with 0)
- Lines 45-61: `validate_password_strength` - 8+ chars, mixed case, number, special char

**Employee Validation** (`backend/app/routers/users.py`):
- Line 608: `EmailStr` for email format validation
- Lines 612-625: `validate_password_strength` - same rules as customers
- Lines 647-660: Email uniqueness check (employees and customers tables)

**Error Handling** (`backend/app/main.py`):
- Lines 62-101: Custom RequestValidationError handler
- Lines 104-124: Pydantic ValidationError handler
- Transforms 422 → 400 with user-friendly messages

### Orders
- **Eligible Status**: Only `delivered` or `ready_to_pickup` orders can be returned
- **Return Window**: No time limit enforced (business decision)
- **Partial Returns**: Supported - customers can return specific items/quantities
- **Return Reasons**: Damaged/Defective, Wrong Item, Not As Described, Changed Mind, Other

### Inventory
- **Stock Tracking**: Real-time quantity updates via `InventoryTransaction`
- **Return Processing**: Approved returns add stock back via `return_in` transaction
- **Audit Trail**: All inventory changes logged with reference to order/return
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
returnsApi.getEligibleOrders()               // Orders that can be returned
returnsApi.getMyReturns(status?, page?, pageSize?)
returnsApi.createReturn(data)                // Create return request
returnsApi.getAllReturns(status?, page?, pageSize?)  // Admin/Manager view
returnsApi.getReturn(id)                     // Get specific return
returnsApi.updateReturnStatus(id, status, adminNotes?)

// Users/Employees
usersApi.getUsers(params?)
usersApi.getUser(id)
usersApi.updateUserRole(id, role)
usersApi.updateUserStatus(id, isActive)
```

## Recent Fixes & Updates

### Performance Optimization (Jan 26-27, 2026)
- **Backend Performance**: Added `watchfiles` to prevent high CPU usage during development
- **Database Optimization**: Configured connection pooling with proper timeouts
- **Firebase Clock Skew**: Added `FIREBASE_CLOCK_SKEW_SECONDS=10` to handle token timing issues

### UI Improvements
- **Icon Consistency**: Replaced all emojis with `lucide-react` icons across dashboards
- **Return Request UI**: Enhanced with proper status indicators and item selection
- **Error Handling**: Improved error messages and user feedback

### Validation Fixes
- **Regex Patterns**: Fixed Python 3.14 compatibility issues in name validation
- **Full Name Validation**: Now properly allows spaces between names
- **Phone Validation**: Sri Lankan format (10 digits starting with 0)
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

## Recent Changes (January-February 2026)

### Validation & Error Handling (Jan 28 - Feb 1)
**Backend Improvements:**
- Added employee creation validation (email + password strength)
  - Email validation using `EmailStr` (requires @ and valid domain)
  - Password strength: 8+ characters, uppercase, lowercase, number, special character
  - Located in: `backend/app/routers/users.py` (CreateStaffRequest schema, lines 606-625)
- Custom validation exception handlers in `backend/app/main.py` (lines 62-124)
  - Transforms Pydantic 422 errors → user-friendly 400 errors with clear messages
  - Returns structured error responses with field-specific details
- Fixed orphaned Firebase user cleanup in customer registration
  - Auto-detects and removes Firebase users without database records
  - Located in: `backend/app/routers/auth_customer.py` (lines 80-96)
- Customer validation (existing):
  - Password strength (8+ chars, mixed case, number, special character)
  - Phone number format validation (Sri Lankan: 10 digits starting with 0)
  - Full name validation (no numbers, letters/spaces/hyphens only)

**Frontend Improvements:**
- Admin dashboard form enhancements (`frontend/src/pages/AdminDashboard.tsx`)
  - Added helpful hints for email format ("Must include @ and valid domain")
  - Added password requirements hint ("Min 8 chars: uppercase, lowercase, number, special")
  - Updated placeholder text for better UX
  - Frontend validation now matches backend requirements (8 chars min, complexity checks)

**Branch Created:** `Admins-Validation-Updated` (committed Jan 31, 2026)

### TypeScript Type Fixes (Feb 1)
**DashboardLayout.tsx Fixes:**
- Fixed `DashboardUser` interface to match `User` type from `api.ts`
  - Removed non-existent properties `fullName` and `name`
  - Changed `full_name` from optional to required (matches API response)
- Updated `displayName` resolution to use only `full_name` property (line 97)
- Updated ProfileModal user prop to use `full_name` only (line 240)
- Located in: `frontend/src/components/shared/DashboardLayout.tsx`

**CustomerDashboard.tsx Fixes:**
- Added `'order-details'` to `CustomerNavId` type union
  - Fixes type mismatch with `NavItemId` expected by dashboard components
  - Dashboard components (DashboardOrders, DashboardReturns, etc.) define `NavItemId` with `'order-details'`
- Located in: `frontend/src/pages/CustomerDashboard.tsx` (line 20)

**Branch:** `UI/UX_Audit_Fix`

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

### Environment Setup
```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Environment variables (.env)
DATABASE_URL=postgresql://user:pass@localhost/japanlanka
JWT_SECRET_KEY=your-secret-key-here
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
FIREBASE_CLOCK_SKEW_SECONDS=10

# Frontend setup
cd frontend
npm install
npm run dev
```

### Known Issues & Solutions
- **Firebase Clock Skew**: Set `FIREBASE_CLOCK_SKEW_SECONDS=10` to handle timing issues
- **Regex Validation**: Updated for Python 3.14 compatibility (hyphen at end of character classes)
- **High CPU**: Added `watchfiles` dependency for efficient development server reloading
- **Memory Usage**: Configured database connection pooling with proper timeouts
- **403 Forbidden on Customer Profile**: Customer email not verified - must click verification link sent to email
- **"Email already registered" but user doesn't exist**: Orphaned Firebase user - system now auto-cleans up these cases

### Security Features
- JWT tokens with 24-hour expiry
- Password hashing with bcrypt (salt rounds: 12)
- Firebase token cryptographic verification
- SQL injection prevention via SQLAlchemy ORM
- Role-based access control (RBAC)
- Input validation and sanitization (Pydantic schemas)
- Custom validation exception handlers (user-friendly error messages)
- Audit logging for all critical actions
- Orphaned Firebase user cleanup on registration failure
- Rate limiting on authentication endpoints

### Performance Optimizations
- Database connection pooling (`pool_size=5, max_overflow=10, pool_recycle=1800`)
- Efficient file watching during development (`watchfiles`)
- Paginated API responses with configurable page sizes
- Indexed database columns for frequent queries
- Client-side caching for user authentication state

### Key Files for Validation (Recent Updates)
**Backend:**
- `backend/app/main.py` - Custom exception handlers (lines 62-124)
- `backend/app/schemas/customer.py` - Customer validation schemas (lines 12-61)
- `backend/app/routers/users.py` - Employee creation validation (lines 606-625)
- `backend/app/routers/auth_customer.py` - Customer registration with Firebase cleanup (lines 80-96)

**Frontend:**
- `frontend/src/pages/AdminDashboard.tsx` - Employee creation form with validation hints (lines 1226-1268)
- `frontend/src/pages/Register.tsx` - Customer registration form
- `frontend/src/services/api.ts` - API client with error handling

### Files Created (January 2026)
- `backend/app/schemas/notification.py`
- `backend/app/schemas/inventory_transaction.py`
- `backend/app/services/notification_service.py`
- `frontend/src/components/NotificationBell.tsx`
- `frontend/src/components/NotificationBell.css`
- `frontend/src/utils/dateUtils.ts`

### Files Modified (January-February 2026)
- `backend/app/models/order.py` - Removed customer_phone, added relationships
- `backend/app/routers/orders.py` - Added status history tracking
- `backend/app/main.py` - Added custom validation exception handlers
- `backend/app/routers/auth_customer.py` - Added orphaned Firebase cleanup
- `backend/app/routers/users.py` - Added employee creation validation
- `frontend/src/services/api.ts` - Added cart, notifications APIs
- `frontend/src/context/CartContext.tsx` - Complete rewrite for dual cart
- `frontend/src/context/AuthContext.tsx` - Added setOnLoginSuccess callback
- `frontend/src/App.tsx` - Added CartSyncManager component
- `frontend/src/pages/CustomerDashboard.tsx` - Uses formatDateTime, added 'order-details' to NavId type
- `frontend/src/pages/MyOrders.tsx` - Uses formatDateTime
- `frontend/src/pages/ManagerDashboard.tsx` - Uses formatDateTime
- `frontend/src/pages/AdminDashboard.tsx` - Uses formatDate, added validation hints
- `frontend/src/pages/Checkout.tsx` - Uses ordersApi.createOrder()
- `frontend/src/components/shared/DashboardLayout.tsx` - Fixed DashboardUser interface type alignment
