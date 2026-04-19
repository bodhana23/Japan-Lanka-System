# Japan Lanka Enterprises — Automobile Parts Management System

A full-stack e-commerce platform for vehicle parts, built for Japan Lanka Enterprises in Sri Lanka.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Running with Docker](#running-with-docker)
- [Database Setup](#database-setup)
- [User Roles and Credentials](#user-roles-and-credentials)
- [API Reference](#api-reference)
- [Key Business Rules](#key-business-rules)
- [Deployment](#deployment)
- [Postman Collection](#postman-collection)
- [Known Issues & Troubleshooting](#known-issues--troubleshooting)

---

## Overview

Japan Lanka is a multi-role automobile parts management system with:

- **Customer-facing shop** — browse products, add to cart, checkout, track orders, request returns
- **Manager dashboard** — manage inventory, process orders, create offline/in-store sales
- **Admin dashboard** — manage users, view financial analytics, manage discounts, delivery fees, advertisements
- **Auditor dashboard** — view audit logs, export reports as Excel
- **Advertisement carousel** — admins manage promotional images/videos displayed on the home page
- **PayHere payment gateway** — full payment or 30% advance with cash on delivery balance
- **Island-wide delivery** — district-based delivery fees managed by admin in real time

---

## Tech Stack

### Frontend
| Technology | Version |
|-----------|---------|
| React | 18.2.0 |
| TypeScript | 4.9.5 |
| Vite | 5.1.4 |
| React Router DOM | 6.22.3 |
| Axios | latest |
| Firebase | (Google Auth + Storage) |
| Lucide React | (icons) |

### Backend
| Technology | Version |
|-----------|---------|
| Python | 3.11+ |
| FastAPI | 0.109.0 |
| SQLAlchemy | 2.0 |
| PostgreSQL | 14+ |
| Alembic | (migrations) |
| python-jose | (JWT) |
| bcrypt | (password hashing) |
| Firebase Admin SDK | (Google OAuth, email verification) |
| ReportLab | (PDF bill generation) |
| OpenPyXL | (Excel report exports) |

---

## Prerequisites

Ensure the following are installed before proceeding:

- **Node.js** 18+ and npm 9+
- **Python** 3.11+
- **PostgreSQL** 14+
- **Git**
- A **Firebase** project (for Google OAuth and email verification)

---

## Project Structure

```
Japan-Lanka-System/
├── .github/workflows/
│   ├── deploy-frontend.yml      # CI/CD: builds & deploys frontend to Azure
│   └── deploy-backend.yml       # CI/CD: builds & deploys backend to Azure
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings (reads .env)
│   │   ├── database.py          # SQLAlchemy session
│   │   ├── init_db.py           # Seed initial data
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── routers/             # API endpoint handlers
│   │   ├── services/            # Business logic (email, notifications, audit)
│   │   └── utils/               # Auth deps, security, firebase
│   ├── alembic/versions/        # Database migration scripts
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── public/
│   │   └── images/              # Static images (storefront, company photos)
│   ├── src/
│   │   ├── pages/               # React page components
│   │   ├── components/          # Shared UI components
│   │   │   ├── admin/           # Admin dashboard components
│   │   │   ├── manager/         # Manager dashboard components
│   │   │   ├── auditor/         # Auditor dashboard components
│   │   │   └── shared/          # Unified sidebar layout
│   │   ├── context/             # Auth & Cart context providers
│   │   ├── services/api.ts      # Axios API client
│   │   ├── config/              # Firebase + PayHere config
│   │   └── utils/               # Helpers (dates, validation, errors)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── postman/                     # API test collection for Postman
├── CLAUDE.md                    # Developer reference (architecture, rules)
└── README.md
```

---

## Environment Setup

### Backend — `backend/.env`

Create this file and fill in your values:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=japanlanka
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password

# JWT Authentication
JWT_SECRET_KEY=your-secret-key-min-32-chars-long-and-random
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Firebase
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
FIREBASE_CLOCK_SKEW_SECONDS=10

# CORS — frontend URL(s) that may access the API
CORS_ORIGINS_STR=http://localhost:3000,http://localhost:5173

# PayHere payment gateway (sandbox by default)
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
PAYHERE_SANDBOX=True

# URLs (used in PayHere callbacks)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Email notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
EMAIL_NOTIFICATIONS_ENABLED=False
```

> **JWT_SECRET_KEY**: Generate a strong key with `python -c "import secrets; print(secrets.token_hex(32))"`

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api/v1

VITE_PAYHERE_MERCHANT_ID=your_merchant_id
VITE_PAYHERE_SANDBOX=true

VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Running the Application

### Backend

```bash
cd backend

# Create virtual environment (first time only)
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed initial data (admin + demo products)
python -m app.init_db

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- API Base: `http://localhost:8000/api/v1`
- Swagger Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health Check: `http://localhost:8000/health`

### Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Running with Docker

The project includes a Docker Compose setup for running all services in containers.

### Start all services

```bash
docker-compose up -d --build
```

This starts a PostgreSQL container, the FastAPI backend (runs migrations on start), and the React frontend served via Nginx.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |
| Swagger Docs | http://localhost:8000/docs |

### Common commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild after code changes
docker-compose up -d --build

# Stop all services
docker-compose down
```

---

## Database Setup

### 1. Create the PostgreSQL database

```bash
psql -U postgres
CREATE DATABASE japanlanka;
CREATE USER japanlanka_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE japanlanka TO japanlanka_user;
\q
```

### 2. Run Alembic migrations

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

### 3. Seed initial data

```bash
python -m app.init_db
```

This creates default staff accounts and sample products.

---

## User Roles and Credentials

After running `python -m app.init_db`, the following accounts are seeded:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| Admin | `admin@japanlanka.com` | `Admin@1234` | Full system access |
| Manager | `manager@japanlanka.com` | `Manager@1234` | Inventory, orders, offline sales |
| Auditor | `auditor@japanlanka.com` | `Auditor@1234` | Logs and reports (read-only) |

Customers register themselves via the sign-up page or Google OAuth.

> **Note:** Employee accounts (manager, admin, auditor) can only be created by an admin through the Admin Dashboard. They cannot self-register.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/customer/register` | Register customer with email/password |
| POST | `/api/v1/auth/customer/login` | Customer login |
| POST | `/api/v1/auth/customer/google` | Google OAuth login/register |
| GET | `/api/v1/auth/customer/me` | Get customer profile |
| PUT | `/api/v1/auth/customer/me` | Update customer profile |
| POST | `/api/v1/auth/employee/login` | Employee login |
| GET | `/api/v1/auth/employee/me` | Get employee profile |
| PUT | `/api/v1/auth/employee/me` | Update employee profile |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/products` | Public | List products (filters: brand, category, year, search) |
| GET | `/api/v1/products/{id}` | Public | Get single product |
| POST | `/api/v1/products` | Manager/Admin | Create product |
| PUT | `/api/v1/products/{id}` | Manager/Admin | Update product (includes year range) |
| DELETE | `/api/v1/products/{id}` | Manager/Admin | Soft delete product |
| PATCH | `/api/v1/products/{id}/discount` | Admin only | Set or clear discount percentage |

### Orders & Checkout

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/orders/my-orders` | Customer | Customer order history |
| GET | `/api/v1/orders` | Staff | List all orders |
| POST | `/api/v1/orders` | Customer | Create online order |
| GET | `/api/v1/orders/{id}` | Any | Get order details |
| PUT | `/api/v1/orders/{id}/status` | Manager/Admin | Update order status |
| POST | `/api/v1/orders/offline` | Manager only | Create in-store offline sale |
| GET | `/api/v1/orders/checkout/districts` | Public | Sri Lanka districts + live delivery fees |
| POST | `/api/v1/orders/checkout/calculate` | Customer | Calculate checkout totals |
| POST | `/api/v1/orders/checkout/initiate` | Customer | Initiate checkout + get PayHere form data |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/payments/payhere/notify` | Public | PayHere server-to-server callback |
| GET | `/api/v1/payments/payhere/status/{order_id}` | Public | Check payment status |

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/cart` | Customer | Get cart |
| POST | `/api/v1/cart/items` | Customer | Add item (max 5 qty, max 50 distinct items) |
| PUT | `/api/v1/cart/items/{id}` | Customer | Update quantity (max 5) |
| DELETE | `/api/v1/cart/items/{id}` | Customer | Remove item |
| DELETE | `/api/v1/cart` | Customer | Clear cart |

### Returns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/returns/eligible-orders` | Customer | Orders eligible for return |
| GET | `/api/v1/returns/my-requests` | Customer | Customer's return requests |
| POST | `/api/v1/returns` | Customer | Create return request |
| GET | `/api/v1/returns` | Staff | List all return requests |
| GET | `/api/v1/returns/{id}` | Any | Get return details |
| PUT | `/api/v1/returns/{id}/status` | Manager/Admin | Update return status |

### Inventory

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/inventory/transactions` | Manager/Admin | List inventory transactions |
| GET | `/api/v1/inventory/transactions/{product_id}` | Manager/Admin | Product transaction history |
| POST | `/api/v1/inventory/adjust` | Manager/Admin | Manual stock adjustment |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/notifications` | Any | List notifications |
| GET | `/api/v1/notifications/unread-count` | Any | Unread count |
| PUT | `/api/v1/notifications/{id}/read` | Any | Mark as read |
| PUT | `/api/v1/notifications/read-all` | Any | Mark all as read |
| DELETE | `/api/v1/notifications/{id}` | Any | Delete notification |

### System Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/system-settings/delivery-fees` | Public | Get all delivery fee tiers |
| PUT | `/api/v1/system-settings/delivery-fees/{tier}` | Admin only | Update fee for a tier |

### Advertisements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/advertisements` | Public | List active ads (home page carousel) |
| GET | `/api/v1/advertisements/all` | Admin | List all ads including inactive |
| POST | `/api/v1/advertisements` | Admin | Create advertisement record |
| PATCH | `/api/v1/advertisements/{id}` | Admin | Update title, order, or toggle active |
| DELETE | `/api/v1/advertisements/{id}` | Admin | Delete advertisement |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/analytics/financial-summary` | Staff | Revenue, orders, brand sales by month |
| GET | `/api/v1/analytics/order-pipeline` | Staff | Active order counts per status |
| GET | `/api/v1/analytics/sales-channel-comparison` | Staff | Online vs offline breakdown |
| GET | `/api/v1/analytics/return-analytics` | Staff | Return rates and monthly trends |

### Users (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users` | Admin | List all users |
| GET | `/api/v1/users/customers` | Admin | List customers |
| GET | `/api/v1/users/employees` | Admin | List employees |
| POST | `/api/v1/users/staff` | Admin | Create manager or auditor |
| PUT | `/api/v1/users/employee/{id}` | Admin | Update employee |
| PUT | `/api/v1/users/customer/{id}/status` | Admin | Activate/deactivate customer |
| PUT | `/api/v1/users/employee/{id}/status` | Admin | Activate/deactivate employee |
| DELETE | `/api/v1/users/customer/{id}` | Admin | Delete customer |
| DELETE | `/api/v1/users/employee/{id}` | Admin | Delete employee |

### Auditor Reports

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/auditor/inventory-logs` | Auditor/Admin | Inventory event log |
| GET | `/api/v1/auditor/activity-logs` | Auditor/Admin | User activity log |
| GET | `/api/v1/auditor/inventory-logs/export` | Auditor/Admin | Export as Excel |
| GET | `/api/v1/auditor/activity-logs/export` | Auditor/Admin | Export as Excel |
| GET | `/api/v1/auditor/reports/monthly-transactions` | Auditor/Admin | Monthly orders Excel report |
| GET | `/api/v1/auditor/reports/inventory-audit` | Auditor/Admin | Stock levels Excel report |

---

## Key Business Rules

### Order Status Flow

```
Online Orders:
  PENDING → CONFIRMED → SHIPPED → DELIVERED          (shipping)
  PENDING → CONFIRMED → READY_TO_PICKUP → DELIVERED  (pickup)
  Any status → CANCELLED (stock restored automatically)

Offline Orders (in-store, manager only):
  Created directly as DELIVERED
```

### Cart Limits

- Maximum **5 units** of the same part per cart item
- Maximum **50 distinct product lines** per cart
- Same quantity cap (5) enforced at checkout — offline sales have no cap

### Checkout & Payment

- **PayHere** integration (sandbox mode by default — set `VITE_PAYHERE_SANDBOX=false` for live launch)
- Customers can pay **100%** upfront or a **minimum 30% advance** for delivery orders
- Remaining balance paid cash on delivery; pickup orders can skip advance payment entirely
- Pessimistic locking (`SELECT FOR UPDATE`) prevents overselling when multiple customers checkout the last unit simultaneously — conflicts return HTTP 409

### Delivery Fees

- 6 district tiers managed by admin via the System Settings section
- Changes reflect immediately in the checkout dropdown — no code deployment needed
- Default tiers range from Rs. 600 (Matara/Galle area) to Rs. 4,800 (Northern Province)

### Return Requests

- Only orders in **DELIVERED** or **READY_TO_PICKUP** status are eligible
- Maximum **one return request per order**; partial returns supported
- Status flow: `PENDING → APPROVED → COMPLETED` or `PENDING → REJECTED`
- Stock restored automatically when return is marked `COMPLETED`
- Approved returns trigger a customer email with the store contact number (0412245345)

### Inventory

- Stock deducted immediately on order creation
- Stock restored on order cancellation or completed return
- Low stock alert fires when stock crosses **≤ 3 units** — notifies all active admins once per crossing

### Discounts

- Per-product `discount_percentage` (0–100) set by admin only via `PATCH /products/{id}/discount`
- `effective_price` auto-computed in all API responses and shown on shop cards

### Offline Sales (Manager Only)

- Admin cannot create offline sales — manager-exclusive
- No customer account required (name/phone stored on the order)
- Order created directly as DELIVERED; stock deducted immediately

### Authentication & Passwords

- Customers register via email/password or Google OAuth; email verification required
- Employees created by admin only — no self-registration
- JWT tokens expire in 24 hours
- Password rules: 8+ chars, uppercase, lowercase, number, special character

---

## Deployment

### Production URLs

| Service | URL |
|---------|-----|
| Frontend | https://japanlanka.app |
| Backend API | https://api.japanlanka.app/api/v1 |
| API Docs | https://api.japanlanka.app/docs |

### Azure Infrastructure

- Frontend: Azure Container Apps (`japanlanka-frontend`)
- Backend: Azure Container Apps (`japanlanka-backend`)
- Registry: `japanlankaregistry.azurecr.io`
- Database: Azure PostgreSQL

### CI/CD (GitHub Actions)

- `deploy-frontend.yml` — triggers on push to `main` (paths: `frontend/**`) or manual dispatch
- `deploy-backend.yml` — triggers on push to `main` (paths: `backend/**`) or manual dispatch
- `VITE_API_URL` is hardcoded to `https://api.japanlanka.app/api/v1` in the workflow
- `VITE_PAYHERE_SANDBOX=true` for demo phase — change to `false` before live launch

### Production Checklist

1. Set `VITE_PAYHERE_SANDBOX=false` in `deploy-frontend.yml` and `PAYHERE_SANDBOX=False` in backend env
2. Change all default seeded passwords (admin, manager, auditor)
3. Use a strong unique `JWT_SECRET_KEY` (minimum 32 random characters)
4. Set `CORS_ORIGINS_STR` to only the production frontend URL
5. Set `FRONTEND_URL` and `BACKEND_URL` to production domains
6. Enable `EMAIL_NOTIFICATIONS_ENABLED=True` and configure SMTP
7. Run `alembic upgrade head` on the production database

### Running with Gunicorn (Production)

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Building Frontend for Production

```bash
cd frontend
npm run build
# Output is in frontend/dist/
```

---

## Postman Collection

A complete Postman collection is included at `postman/`:

- `Japan_Lanka_API.postman_collection.json` — requests across all endpoints
- `Japan_Lanka_Local.postman_environment.json` — local environment variables

**How to use:**
1. Import both files into Postman
2. Select the **Japan Lanka Local** environment
3. Run **Health Check**, then login as admin/manager/customer
4. Tokens auto-populate across all requests

---

## Known Issues & Troubleshooting

### Firebase Clock Skew
**Symptom:** Google OAuth login fails with token timing errors
**Fix:** Add `FIREBASE_CLOCK_SKEW_SECONDS=10` to `backend/.env`

### High CPU during development
**Symptom:** `uvicorn --reload` uses excessive CPU
**Fix:** `watchfiles` is included in `requirements.txt` and used automatically

### "Email already registered" but user does not exist
**Symptom:** Registration fails claiming email is taken but no account exists
**Cause:** Orphaned Firebase user from a previous failed registration
**Fix:** The system automatically cleans these up on the next registration attempt

### 403 on customer endpoints after registration
**Symptom:** Newly registered customer gets 403 Forbidden
**Cause:** Email not verified — customer must click the verification link
**Fix:** Check spam folder; resend via `/api/v1/auth/customer/resend-verification`

### Offline sale access denied for admin
**Symptom:** Admin gets 403 when creating an offline sale
**Cause:** Offline sales are intentionally restricted to the Manager role only
**Fix:** Log in with a manager account

### Checkout returns HTTP 409
**Symptom:** Customer gets "Checkout conflict, please try again"
**Cause:** Concurrent checkout for the same last-in-stock item — pessimistic lock safely rejected one request
**Fix:** Normal behaviour — the customer should retry; the competing order succeeded

### Docker build fails with TLS handshake timeout
**Symptom:** `docker-compose up --build` fails pulling base images
**Fix:** Restart Docker Desktop, switch networks, or use `docker-compose build --pull=false`

---

## License

Proprietary — Japan Lanka Enterprises. All rights reserved.
