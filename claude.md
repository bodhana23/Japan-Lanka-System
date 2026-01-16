# Claude.md - Japan Lanka System Reference

## Project Overview
**Japan Lanka Enterprises** - Automobile Parts Management System
- E-commerce platform for vehicle parts in Sri Lanka
- Multi-role system: Customer, Manager, Admin, Auditor
- Full-stack application with React frontend and FastAPI backend
- PostgreSQL database with SQLAlchemy ORM
- JWT authentication with bcrypt password hashing

## Tech Stack

### Frontend
- React 18.2.0
- TypeScript 4.9.5
- React Router DOM 6.22.3
- Vite 5.1.4 (build tool)
- Axios (HTTP client)
- Context API for state management
- Pure CSS styling

### Backend
- Python 3.11+
- FastAPI 0.109.0
- SQLAlchemy 2.0 (ORM)
- PostgreSQL (database)
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
│   │   │   └── Toast.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # JWT auth state management
│   │   │   └── CartContext.tsx      # Shopping cart state
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── CustomerDashboard.tsx
│   │   │   ├── ManagerDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AuditorDashboard.tsx
│   │   │   ├── Shop.tsx
│   │   │   ├── Checkout.tsx
│   │   │   └── ManageUsers.tsx
│   │   ├── services/
│   │   │   └── api.ts               # API client with axios
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app entry
│   │   ├── database.py              # DB connection
│   │   ├── config.py                # Settings/config
│   │   ├── init_db.py               # Database seeding
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   └── order.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   └── order.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── products.py          # Product CRUD
│   │   │   ├── orders.py            # Order management
│   │   │   └── users.py             # User management
│   │   ├── services/
│   │   │   └── __init__.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── security.py          # JWT & password utils
│   ├── alembic/                     # Database migrations
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

### Users (`/api/v1/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List users (admin only) |
| GET | `/{id}` | Get user by ID (admin only) |
| PUT | `/{id}/role` | Update user role (admin only) |
| PUT | `/{id}/status` | Activate/deactivate user (admin only) |

## Database Models

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
    created_at: datetime
    updated_at: datetime
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
    created_at: datetime
    updated_at: datetime
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
    customer_phone: str
    notes: str (optional)
    created_at: datetime
    updated_at: datetime
    items: List[OrderItem]
```

### OrderItem
```python
class OrderItem(Base):
    id: UUID
    order_id: UUID (FK)
    product_id: UUID (FK)
    quantity: int
    unit_price: Decimal
    created_at: datetime
```

## Frontend API Client (`services/api.ts`)

### Available API Objects
```typescript
// Authentication
authApi.register(email, fullName, password, phoneNumber?)
authApi.login(email, password)
authApi.googleAuth(firebaseToken)
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

// Users
usersApi.getUsers(params?)
usersApi.getUser(id)
usersApi.updateUserRole(id, role)
usersApi.updateUserStatus(id, isActive)
```

## Authentication Flow

1. User submits login credentials
2. Backend validates and returns JWT token + user data
3. Frontend stores token in `localStorage.token`
4. Frontend stores user in `localStorage.currentUser`
5. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
6. Backend validates JWT on protected routes
7. 401 responses trigger automatic logout and redirect

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

## Default Accounts (Seeded)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@japanlanka.com | admin123 |
| Manager | manager@japanlanka.com | manager123 |
| Auditor | auditor@japanlanka.com | auditor123 |
| Customer | customer@example.com | customer123 |

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/japanlanka
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## User Roles & Permissions

| Role | Products | Orders | Users | Analytics |
|------|----------|--------|-------|-----------|
| Customer | View | Create, View Own | - | - |
| Manager | CRUD | View All, Update Status | - | - |
| Admin | View | View All | CRUD | View |
| Auditor | View | View All | View | View |

## Current Features

### ✅ Implemented
- JWT authentication with login/register
- Product catalog with filtering
- Shopping cart (sessionStorage)
- Order creation and tracking
- Customer order history
- Manager inventory management
- Manager order processing
- Admin user management
- Role-based access control
- Responsive design
- Window shopper flow (browse without login)

### 🔄 In Progress / TODO
- Return request management (backend endpoint needed)
- Audit logging (backend endpoint needed)
- Analytics dashboard (backend endpoint needed)
- Google OAuth integration
- Email notifications
- Payment integration

## Recent Changes (January 2026)

### Backend API Implementation
- Created FastAPI backend with PostgreSQL
- Implemented JWT authentication
- Added CRUD endpoints for products, orders, users
- Database seeding with sample data

### Frontend API Integration
- Removed all hardcoded sample data
- Connected Shop.tsx to productsApi
- Connected CustomerDashboard.tsx to ordersApi
- Connected ManagerDashboard.tsx to products & orders APIs
- Connected AdminDashboard.tsx to usersApi
- Added loading and error states

### Files Modified for API Integration
1. `Shop.tsx` - Fetches products from API
2. `CustomerDashboard.tsx` - Fetches orders from API
3. `ManagerDashboard.tsx` - Fetches products & orders from API
4. `AdminDashboard.tsx` - Fetches users from API
5. `AuditorDashboard.tsx` - Cleared sample data (awaiting audit API)
