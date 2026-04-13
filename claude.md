# Claude.md - Japan Lanka System Reference
*Last updated: April 13, 2026*

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
- Offline sales support for in-store transactions
- PayHere payment gateway integration (sandbox mode for demo)
- Island-wide delivery with DB-driven fee management per district tier
- CI/CD via GitHub Actions → Azure Container Apps

## Tech Stack

### Frontend
- React 18.2.0
- TypeScript 4.9.5
- React Router DOM 6.22.3
- Vite 5.1.4 (build tool)
- Axios (HTTP client)
- Firebase (Google Auth + Storage)
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

## Deployment

### Production URLs
- Frontend: https://japanlanka.app
- Backend API: https://api.japanlanka.app
- API Docs: https://api.japanlanka.app/docs

### Azure Infrastructure
- Frontend: Azure Container Apps (`japanlanka-frontend`)
- Backend: Azure Container Apps (`japanlanka-backend`)
- Registry: `japanlankaregistry.azurecr.io`
- Resource Group: `japanlanka-rg`
- Database: Azure PostgreSQL

### CI/CD (GitHub Actions)
- **deploy-frontend.yml**: triggers on push to `main` (paths: `frontend/**`) + `workflow_dispatch`
  - Builds Vite app with env vars baked in at build time
  - `VITE_API_URL` hardcoded to `https://api.japanlanka.app/api/v1`
  - `VITE_PAYHERE_SANDBOX=true` (sandbox mode — change to `false` before live launch)
  - Pushes Docker image → deploys to Container Apps
- **deploy-backend.yml**: triggers on push to `main` (paths: `backend/**`) + `workflow_dispatch`
  - Builds and pushes Docker image → deploys to Container Apps

### GitHub Secrets Required
| Secret | Purpose |
|--------|---------|
| `ACR_USERNAME` | Azure Container Registry username |
| `ACR_PASSWORD` | Azure Container Registry password |
| `AZURE_CREDENTIALS` | Service principal JSON |
| `VITE_PAYHERE_MERCHANT_ID` | PayHere live merchant ID |
| `VITE_FIREBASE_*` | Firebase config keys |

## Project Structure
```
Japan-Lanka-System/
├── .github/workflows/
│   ├── deploy-frontend.yml
│   └── deploy-backend.yml
├── postman/
│   ├── Japan_Lanka_API.postman_collection.json
│   └── Japan_Lanka_Local.postman_environment.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── ProfileModal.tsx
│   │   │   ├── NotificationBell.tsx    # Notification dropdown
│   │   │   ├── NotificationBell.css
│   │   │   ├── Toast.tsx               # Top-center slide-down toast
│   │   │   ├── AdsCarousel.tsx         # Home page ad carousel
│   │   │   ├── AdsCarousel.css
│   │   │   ├── admin/
│   │   │   │   ├── DashboardAds.tsx    # Admin ad management
│   │   │   │   └── DashboardAds.css
│   │   │   ├── manager/
│   │   │   │   └── DashboardReturns.tsx  # Manager return requests (no product images)
│   │   │   ├── auditor/
│   │   │   │   ├── DashboardInventoryLogs.tsx
│   │   │   │   ├── DashboardActivityLogs.tsx
│   │   │   │   ├── DashboardReports.tsx
│   │   │   │   └── DashboardProfile.tsx
│   │   │   └── shared/
│   │   │       ├── DashboardLayout.tsx   # Unified sidebar layout (all roles)
│   │   │       └── DashboardLayout.css
│   │   ├── context/
│   │   │   ├── AuthContext.tsx         # JWT auth + Google OAuth
│   │   │   └── CartContext.tsx         # Shopping cart (guest + DB)
│   │   ├── pages/
│   │   │   ├── Home.tsx                # Landing page (smooth-scroll nav, functional links)
│   │   │   ├── Login.tsx
│   │   │   ├── EmployeeLogin.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── CustomerDashboard.tsx
│   │   │   ├── MyOrders.tsx
│   │   │   ├── ManagerDashboard.tsx    # Includes Add/Edit product with year range
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AuditorDashboard.tsx
│   │   │   ├── Shop.tsx                # Displays year range on product cards
│   │   │   ├── Checkout.tsx            # PayHere integration, district delivery fees
│   │   │   ├── PaymentSuccess.tsx
│   │   │   ├── ManageUsers.tsx
│   │   │   ├── OfflineSales.tsx
│   │   │   └── OfflineSales.css
│   │   ├── services/
│   │   │   └── api.ts                  # API client with axios
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── dateUtils.ts            # Date formatting (Sri Lanka TZ)
│   │   ├── config/
│   │   │   ├── firebase.ts             # Firebase configuration
│   │   │   └── payhere.ts              # PayHere gateway config
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
│   │   ├── config.py                   # Settings/config (PayHere, SMTP, Firebase, etc.)
│   │   ├── init_db.py                  # Database seeding
│   │   ├── models/
│   │   │   ├── product.py              # Includes discount_percentage, year_from, year_to
│   │   │   ├── order.py                # Includes payment fields, sales_channel
│   │   │   ├── system_settings.py      # Key-value store (delivery fees, thresholds)
│   │   │   ├── advertisement.py
│   │   │   ├── customer.py
│   │   │   ├── employee.py
│   │   │   ├── order_item.py
│   │   │   ├── cart.py
│   │   │   ├── notification.py
│   │   │   ├── order_status_history.py
│   │   │   ├── inventory_transaction.py
│   │   │   ├── inventory_log.py
│   │   │   ├── return_request.py
│   │   │   └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── product.py              # Includes effective_price (discount-aware)
│   │   │   ├── order.py                # SRI_LANKA_DISTRICTS dict + checkout schemas
│   │   │   ├── cart.py
│   │   │   ├── customer.py
│   │   │   ├── employee.py
│   │   │   ├── return_request.py
│   │   │   ├── notification.py
│   │   │   ├── order_status_history.py
│   │   │   ├── audit_log.py
│   │   │   ├── inventory_transaction.py
│   │   │   └── system_settings.py
│   │   ├── routers/
│   │   │   ├── auth_customer.py
│   │   │   ├── auth_employee.py
│   │   │   ├── products.py             # Includes PATCH /{id}/discount endpoint
│   │   │   ├── orders.py               # Checkout, districts (DB-driven fees), PayHere
│   │   │   ├── users.py
│   │   │   ├── cart.py
│   │   │   ├── notifications.py
│   │   │   ├── inventory.py
│   │   │   ├── returns.py
│   │   │   ├── payments.py             # PayHere notify + status endpoints
│   │   │   ├── system_settings.py      # Delivery fee management (admin)
│   │   │   └── advertisements.py
│   │   ├── services/
│   │   │   ├── notification_service.py # Low-stock alerts, order notifications
│   │   │   ├── email_service.py        # SMTP order status emails
│   │   │   └── audit_service.py
│   │   └── utils/
│   │       ├── deps.py
│   │       ├── security.py
│   │       ├── firebase.py
│   │       └── timezone.py
│   ├── alembic/versions/               # All migrations
│   │   ├── add_discount_to_products.py
│   │   ├── add_year_fields_to_products.py   # Added Apr 2026
│   │   ├── add_system_settings_table.py
│   │   ├── c1d2e3f4a5b6_add_advertisements_table.py
│   │   ├── add_payment_fields_to_orders.py
│   │   ├── f1a7baf8f1fd_add_sales_channel_to_orders.py
│   │   └── ...
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
| GET | `/` | List products (filters: brand, category, year, search) |
| GET | `/{id}` | Get product by ID |
| POST | `/` | Create product (manager+) |
| PUT | `/{id}` | Update product (manager+) |
| DELETE | `/{id}` | Soft delete product (manager+) |
| PATCH | `/{id}/discount` | Set/clear discount percentage (admin only) |

### Orders (`/api/v1/orders`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/my-orders` | Get customer's orders |
| GET | `/` | List all orders (employees) |
| POST | `/offline` | Create offline sale (manager only) |
| GET | `/{id}` | Get order details |
| PUT | `/{id}/status` | Update order status (employees) |
| GET | `/checkout/districts` | List districts with live DB delivery fees |
| POST | `/checkout/calculate` | Calculate order total + delivery fee |
| POST | `/checkout/initiate` | Create order + get PayHere form data |

### Payments (`/api/v1/payments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payhere/notify` | PayHere server-to-server notification (public) |
| GET | `/payhere/status/{order_id}` | Get payment status for an order |

### Returns (`/api/v1/returns`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/my-requests` | Get customer's return requests |
| GET | `/eligible-orders` | Get orders eligible for return |
| POST | `/` | Create return request |
| GET | `/` | List all return requests (manager+) |
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

### System Settings (`/api/v1/system-settings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/delivery-fees` | Get all delivery fee tiers |
| PUT | `/delivery-fees/{tier}` | Update fee for a tier (admin only) |

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List users (admin only) |
| GET | `/{id}` | Get user by ID (admin only) |
| PUT | `/{id}/role` | Update user role (admin only) |
| PUT | `/{id}/status` | Activate/deactivate user (admin only) |

### Advertisements (`/api/v1/advertisements`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List active ads (public) |
| GET | `/all` | List all ads including inactive (admin only) |
| POST | `/` | Create advertisement record (admin only) |
| PATCH | `/{id}` | Update title, display_order, or is_active (admin only) |
| DELETE | `/{id}` | Delete advertisement (admin only) |

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
```

### Product
```python
class Product(Base):
    id: UUID
    name: str
    description: str (optional)
    brand: str
    model: str
    year_from: int (optional)       # e.g. 2010
    year_to: int (optional)         # e.g. 2020 — shown as "(2010-2020)" on shop cards
    category: str
    price: Decimal
    discount_percentage: Decimal (optional, 0–100)  # per-product discount
    quantity_available: int
    image_url: str (optional)
    is_active: bool
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
    # Schema computes effective_price = price * (1 - discount_percentage/100)
```

### Order
```python
class Order(Base):
    id: UUID
    customer_id: UUID (FK, optional)  # Null for offline sales
    status: Enum['pending', 'confirmed', 'shipped', 'ready_to_pickup', 'delivered', 'cancelled']
    delivery_method: Enum['pickup', 'shipping']
    sales_channel: Enum['online', 'offline']
    total_amount: Decimal
    delivery_fee: Decimal
    paid_amount: Decimal
    remaining_amount: Decimal
    payment_status: Enum['not_paid', 'partially_paid', 'paid']
    payhere_payment_id: str (optional)
    shipping_address: str (optional)
    shipping_city: str (optional)
    shipping_district: str (optional)
    shipping_postal_code: str (optional)
    offline_customer_name: str (optional)
    offline_customer_phone: str (optional)
    notes: str (optional)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
```

### SystemSetting
```python
class SystemSetting(Base):
    id: UUID
    key: str (unique)    # e.g. "delivery_fee_tier1" … "delivery_fee_tier6"
    value: str
    updated_by_employee_id: UUID (FK, optional)
    updated_at: datetime (UTC)
    # Tier → districts mapping defined in orders.py (_DISTRICT_TO_TIER dict)
    # Tier defaults: tier1=600, tier2=1400, tier3=2400, tier4=3200, tier5=4000, tier6=4800
```

### Advertisement
```python
class Advertisement(Base):
    id: UUID
    title: str (optional)
    media_url: str               # Firebase Storage download URL
    media_type: Enum['image', 'video']
    display_order: int (default: 0)
    is_active: bool (default: True)
    created_at: datetime (UTC)
    updated_at: datetime (UTC)
```

### Other Models (unchanged)
- `OrderItem`, `Cart`, `CartItem`, `Notification`, `OrderStatusHistory`
- `InventoryTransaction`, `ReturnRequest`, `ReturnItem`, `AuditLog`

## Business Rules & Validation

### Authentication
- **Customer Registration**: Email + password OR Google OAuth
- **Email Verification**: Required for email/password users via Firebase
- **Password Rules**: 8+ chars, uppercase, lowercase, number, special char (customers & employees)
- **Full Name**: Letters, spaces, hyphens, apostrophes only (no numbers)
- **Phone**: Sri Lankan format (10 digits starting with 0)
- **Employee Creation**: Admin-only

### Products
- **Year Range**: Optional `year_from` / `year_to` (1900–2100). Displayed as `"Model (2010-2020)"` on shop cards.
- **Discount**: Per-product `discount_percentage` (0–100). `effective_price` auto-computed in API response.
- **Year Filtering**: `GET /products?year=2015` filters to products whose range includes 2015.

### Orders & Payments
- **Payment Options**: Full payment OR 30% minimum advance via PayHere; remainder as cash on delivery
- **PayHere Mode**: Currently **sandbox** (`VITE_PAYHERE_SANDBOX=true`) — switch to `false` for live launch
- **Delivery Fees**: 6 tiers driven by district. Fees stored in `system_settings` table — admin changes reflect immediately in checkout dropdown (fixed Apr 2026).
- **Checkout Flow**: `POST /checkout/initiate` → creates order → returns PayHere form data → frontend auto-submits hidden form → PayHere redirects back

### Delivery Fee Tiers
| Tier | Districts | Default Fee (Rs.) |
|------|-----------|------------------|
| tier1 | Matara, Hambantota, Galle | 600 |
| tier2 | Ratnapura, Kalutara, Nuwara Eliya, Monaragala | 1400 |
| tier3 (tier4 in code) | Colombo, Gampaha, Kegalle, Badulla, Kandy | 3200 |
| tier4 (tier5 in code) | Kurunegala, Matale, Polonnaruwa, Anuradhapura, Ampara, Batticaloa, Trincomalee | 4000 |
| tier5 (tier6 in code) | Puttalam, Vavuniya, Mannar, Mullaitivu, Kilinochchi, Jaffna | 4800 |

### Inventory
- **Low Stock Threshold**: 3 units — admins notified when stock crosses this boundary
- **Return Processing**: Approved returns restore stock via `return_in` transaction

### Offline Sales
- **Manager Only**; `customer_id = null`; defaults to `pickup` delivery method

## Frontend API Client (`services/api.ts`)

```typescript
// Authentication
authApi.register(email, fullName, password, phoneNumber?)
authApi.login(email, password)
authApi.googleAuth(firebaseToken, displayName, email)
authApi.getMe() / authApi.updateMe(data)

// Products
productsApi.getProducts(filters?)   // filters: brand, category, year, search, page
productsApi.createProduct(product)  // includes year_from, year_to
productsApi.updateProduct(id, product)
productsApi.deleteProduct(id)

// Orders & Checkout
ordersApi.getDistricts()            // returns live DB-driven delivery fees
ordersApi.calculateCheckout(data)
ordersApi.initiateCheckout(data)    // returns PayHereFormData when payment required
ordersApi.getMyOrders(status?, page?, pageSize?)
ordersApi.getOrders(params?)
ordersApi.updateOrderStatus(id, status)
ordersApi.createOfflineSale(data)

// Cart, Notifications, Returns, Users — unchanged from previous

// Advertisements
adsApi.getAds()           // public, active only
adsApi.getAllAds()         // admin only
adsApi.createAd(data)
adsApi.updateAd(id, data)
adsApi.deleteAd(id)

// System Settings
systemSettingsApi.getDeliveryFees()
systemSettingsApi.updateDeliveryFee(tier, fee)
```

## PayHere Integration

### Config (`frontend/src/config/payhere.ts`)
- `VITE_PAYHERE_SANDBOX=true` → `https://sandbox.payhere.lk/pay/checkout`
- `VITE_PAYHERE_SANDBOX=false` → `https://www.payhere.lk/pay/checkout`
- **Currently set to `true` in `deploy-frontend.yml`** for client demo — change to `false` before real launch

### Flow
1. Customer selects items + delivery → clicks Pay
2. `POST /checkout/initiate` → backend creates order, generates MD5 hash, returns `PayHereFormData`
3. Frontend auto-submits hidden HTML form to PayHere
4. PayHere redirects to `/payment/success` or `/payment/cancel`
5. PayHere POSTs to `POST /payments/payhere/notify` (server-to-server) → backend updates `payment_status`

### Hash Formula
`MD5(merchant_id + order_id + amount + currency + strtoupper(MD5(merchant_secret)))`

## Date/Time Handling

### Backend
- All timestamps stored in **UTC**
- PostgreSQL timezone: `Asia/Colombo`

### Frontend (`utils/dateUtils.ts`)
```typescript
formatDateTime(dateString)    // "17 Jan 2026, 10:57 pm"
formatDate(dateString)        // "17 Jan 2026"
formatTime(dateString)        // "10:57 pm"
formatRelativeTime(dateString) // "2 hours ago"
formatOrderDate(dateString)   // "17/01/2026 22:57"
formatFullDate(dateString)    // "17 January 2026"
```

## Cart System

### Dual Cart Architecture
- **Guest Users**: Cart stored in `sessionStorage`
- **Logged-in Users**: Cart stored in database via API
- **On Login**: Guest cart automatically merges with database cart

## Authentication Flow

1. User submits credentials (or Google OAuth)
2. Backend validates → returns JWT + user data
3. Frontend stores in `localStorage` (`token`, `currentUser`)
4. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
5. On login: CartSyncManager merges local cart to server
6. 401 responses → automatic logout + redirect

## Running Locally

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
python -m app.init_db        # creates tables + seeds default admin
alembic upgrade head         # run any pending migrations
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Local URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=japanlanka
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
JWT_SECRET_KEY=your-secret-key
FIREBASE_CREDENTIALS_PATH=/path/to/service-account.json
FIREBASE_CLOCK_SKEW_SECONDS=10
PAYHERE_MERCHANT_ID=1233973
PAYHERE_MERCHANT_SECRET=your-merchant-secret
PAYHERE_SANDBOX=True
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email
EMAIL_NOTIFICATIONS_ENABLED=False
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_PAYHERE_MERCHANT_ID=1233973
VITE_PAYHERE_SANDBOX=true
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## User Roles & Permissions

| Role | Products | Orders | Users | Returns | Inventory | Discounts | Offline Sales | Ads | Delivery Fees |
|------|----------|--------|-------|---------|-----------|-----------|---------------|-----|---------------|
| Customer | View | Create, View Own | - | Create, View Own | - | - | - | - | - |
| Manager | CRUD | View All, Update Status | - | View All, Update | Adjust | - | Create | - | - |
| Admin | View | View All | CRUD | View All | View | Set | - | CRUD | Update |
| Auditor | View | View All | View | View All | View | - | - | - | - |

## Current Features

### Implemented
- JWT authentication + Google OAuth
- Product catalog with filtering (brand, category, year range, search)
- **Product year range** (`year_from`/`year_to`) — manager can set, shown on shop cards
- **Per-product discounts** (`discount_percentage`) — admin sets via `PATCH /products/{id}/discount`
- Shopping cart (sessionStorage for guests, DB for logged-in users, merge on login)
- Order creation + status tracking + history
- **PayHere payment gateway** (sandbox mode; 30% advance or full payment options)
- **Delivery fees managed in DB** — admin changes reflect live in checkout (fixed Apr 2026)
- Offline sales for in-store transactions (manager only)
- Advertisement carousel on home page (admin managed, Firebase Storage)
- Admin user management
- Notification system (bell dropdown, low-stock alerts)
- Return request management
- Inventory transaction audit trail + auditor dashboard
- Email notifications for order status (SMTP, opt-in via `EMAIL_NOTIFICATIONS_ENABLED`)
- Role-based access control
- Responsive / mobile-friendly design
- Island-wide delivery with district-tier pricing

### TODO / Future Enhancements
- Switch PayHere to live mode before customer launch (`VITE_PAYHERE_SANDBOX=false`)
- Product reviews and ratings
- Wishlist functionality
- Advanced analytics dashboard

## Recent Changes (April 2026)

### Product Year Range (Apr 12, 2026)
- **Backend**: `year_from` / `year_to` columns already in `Product` model — added Alembic migration `add_year_fields_to_products.py` (revision `d4e5f6a7b8c9`) so Azure DB gets the columns
- **Frontend** (`ManagerDashboard.tsx`): `Product` interface extended; Add Product form — "Compatible Model" shrunk to half-width, "Year Range (From / To)" added beside it; Edit Product form — same year inputs added; API payloads and local state updated
- **Shop.tsx**: Already renders `"Model (year_from-year_to)"` — no change needed

### Delivery Fee Bug Fix (Apr 13, 2026)
- **Root cause**: `GET /checkout/districts` returned hardcoded dict while `POST /checkout/initiate` used DB values → customers saw wrong fees but were charged correctly
- **Fix** (`backend/app/routers/orders.py`): Injected `db` into `get_districts()` and switched to `get_delivery_fee_from_db()` — single source of truth

### CI/CD Domain Migration Fix (Apr 10, 2026)
- Added `workflow_dispatch` to both workflow files so deployments can be manually triggered
- Hardcoded `VITE_API_URL=https://api.japanlanka.app/api/v1` in `deploy-frontend.yml` (no longer a secret)
- `VITE_PAYHERE_SANDBOX=true` set for client demo phase

### UI Fixes (Apr 11-12, 2026)
- **Toast**: Repositioned from top-right to top-center with slide-down animation (`Toast.css`)
- **Brand badge**: Added `align-self: flex-start` + `width: fit-content` to prevent full-width stretching (`Shop.css`)
- **Auditor theme**: Replaced off-brand indigo (`#6366f1`) with teal (`#00b894`) in `DashboardInventoryLogs.css` and `DashboardReports.css`
- **Manager return requests**: Removed product image thumbnails from return request cards (`manager/DashboardReturns.tsx`)
- **Add Product button**: Changed from red gradient to teal theme (`ManagerDashboard.css`)
- **Edit Product modal buttons**: Scoped smaller sizing to `.edit-product-modal-footer` so Delete/Cancel/Save aren't oversized
- **Home page**: All nav/footer links now functional (smooth scroll); feature card "Learn more" buttons wired to real actions; social links replaced with `mailto:`/`tel:`; "24/7 Support" corrected to "Mon–Sat"

## Recent Changes (March 2026)

### Advertisements Feature (Mar 19, 2026)
- New `Advertisement` model + router + Alembic migration
- Admin can upload images/videos to Firebase Storage → save record → display in home page carousel
- `AdsCarousel` component: auto-scrolls every 3s, pauses on hover, hides if no ads

### System Settings & Delivery Fees (Mar 16, 2026)
- `system_settings` table stores configurable key-value pairs
- Delivery fee tiers (tier1–tier6) editable by admin via `PUT /system-settings/delivery-fees/{tier}`
- Admin dashboard "System Settings" section exposes this UI

### Discounts (Mar 2026)
- `discount_percentage` column on `products` table (`add_discount_to_products.py` migration)
- Admin sets via `PATCH /products/{id}/discount`; schema auto-computes `effective_price`

## Known Issues & Solutions
- **Firebase Clock Skew**: `FIREBASE_CLOCK_SKEW_SECONDS=10` in backend env
- **High CPU (dev)**: `watchfiles` dependency handles efficient reloading
- **Email already registered**: Orphaned Firebase user — system auto-cleans on re-registration
- **PayHere "cannot find a business"**: Ensure `PAYHERE_SANDBOX` matches the account type (sandbox ID ≠ live ID)
- **CI/CD not triggering after infra changes**: Use `workflow_dispatch` to manually trigger — path filters only fire on code changes

## Security Features
- JWT tokens (24-hour expiry)
- bcrypt password hashing (salt rounds: 12)
- Firebase token cryptographic verification
- SQL injection prevention via SQLAlchemy ORM
- Role-based access control (RBAC)
- Pydantic input validation + custom 422→400 error handlers
- Audit logging for all critical actions
- Orphaned Firebase user cleanup on registration failure
