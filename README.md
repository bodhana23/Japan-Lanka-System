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
- **Admin dashboard** — manage users, view analytics, oversee system
- **Auditor dashboard** — view audit logs, export reports as Excel
- **Advertisement carousel** — admins manage promotional images/videos displayed on the home page

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
| Firebase | (Google Auth) |
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
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Settings (reads .env)
│   │   ├── database.py          # SQLAlchemy session
│   │   ├── init_db.py           # Seed initial data
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── routers/             # API endpoint handlers
│   │   ├── services/            # Business logic services
│   │   └── utils/               # Auth deps, security, firebase
│   ├── alembic/                 # Database migration scripts
│   ├── migrations/              # SQL migration scripts
│   ├── requirements.txt
│   └── alembic.ini
├── frontend/
│   ├── src/
│   │   ├── pages/               # React page components
│   │   ├── components/          # Shared UI components
│   │   ├── context/             # Auth & Cart context providers
│   │   ├── services/api.ts      # Axios API client
│   │   └── utils/               # Helpers (dates, validation)
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── postman/                     # API test collection for Postman
└── README.md
```

---

## Environment Setup

### Backend — `backend/.env`

Create this file (copy from the template below) and fill in your values:

```env
# Database
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/japanlanka

# JWT Authentication
SECRET_KEY=your-secret-key-min-32-chars-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Firebase
FIREBASE_CREDENTIALS_PATH=/path/to/firebase-service-account.json
FIREBASE_CLOCK_SKEW_SECONDS=10

# CORS — frontend URL(s) that may access the API
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]

# PayHere payment gateway (sandbox by default)
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret
PAYHERE_SANDBOX=true

# URLs (used in PayHere callbacks)
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

> **SECRET_KEY**: Generate a strong key with `python -c "import secrets; print(secrets.token_hex(32))"`

### Frontend — `frontend/.env`

```env
VITE_API_URL=http://localhost:8000/api/v1

VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Running with Docker

The project includes a full Docker Compose setup for running all three services (database, backend, frontend) in containers.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Setup

Create a `docker-compose.override.yml` (or edit `docker-compose.yml`) and supply the required build args and environment values (Firebase credentials, secret keys, etc.).

### Start all services

```bash
docker-compose up -d --build
```

This will:
1. Start a **PostgreSQL 15** container with a persistent volume
2. Build and start the **FastAPI backend** — runs `init_db` + Alembic migrations on every start, then serves via Gunicorn
3. Build and start the **React frontend** — Vite compiles a production bundle, served via Nginx on port 80

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/v1 |
| Swagger Docs | http://localhost:8000/docs |

### After making code changes

Because the frontend and backend use **production builds baked into the image** (no live-reload mounts), you must rebuild after any code change:

```bash
# Rebuild and restart everything
docker-compose up -d --build

# Rebuild only the backend
docker-compose build backend && docker-compose up -d backend

# Rebuild only the frontend
docker-compose build frontend && docker-compose up -d frontend
```

### View logs

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop all services

```bash
docker-compose down
```

> **Note:** The `version` attribute in `docker-compose.yml` is intentionally obsolete — Docker Compose v2 ignores it. The warning can be safely dismissed.

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
source venv/bin/activate        # Windows: venv\Scripts\activate
alembic upgrade head
```

### 3. Seed initial data (admin + demo products)

```bash
python -m app.init_db
```

This creates default users (see [User Roles and Credentials](#user-roles-and-credentials)) and sample products.

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

The app will be available at `http://localhost:3000` (or `http://localhost:5173` with Vite defaults).

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
| GET | `/api/v1/auth/customer/profile` | Get customer profile |
| PUT | `/api/v1/auth/customer/profile` | Update customer profile |
| PUT | `/api/v1/auth/customer/password` | Change password |
| POST | `/api/v1/auth/employee/login` | Employee login |
| GET | `/api/v1/auth/employee/profile` | Get employee profile |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/products` | Public | List products (with filters) |
| GET | `/api/v1/products/{id}` | Public | Get single product |
| POST | `/api/v1/products` | Manager/Admin | Create product |
| PUT | `/api/v1/products/{id}` | Manager/Admin | Update product |
| DELETE | `/api/v1/products/{id}` | Manager/Admin | Soft delete product |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/orders` | Any | List orders (customers see own, staff see all) |
| GET | `/api/v1/orders/my-orders` | Customer | Customer order history |
| POST | `/api/v1/orders` | Customer | Create online order |
| GET | `/api/v1/orders/{id}` | Any | Get order details |
| PUT | `/api/v1/orders/{id}/status` | Manager/Admin | Update order status |
| GET | `/api/v1/orders/{id}/history` | Any | Order status history |
| GET | `/api/v1/orders/{id}/bill` | Any | Download PDF bill |
| POST | `/api/v1/orders/offline` | **Manager only** | Create in-store offline sale |
| GET | `/api/v1/orders/checkout/districts` | Public | Sri Lanka districts + delivery fees |
| POST | `/api/v1/orders/checkout/calculate` | Customer | Calculate checkout totals |
| POST | `/api/v1/orders/checkout/initiate` | Customer | Initiate checkout with PayHere |

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/cart` | Customer | Get cart |
| POST | `/api/v1/cart/items` | Customer | Add item to cart |
| PUT | `/api/v1/cart/items/{id}` | Customer | Update quantity |
| DELETE | `/api/v1/cart/items/{id}` | Customer | Remove item |
| DELETE | `/api/v1/cart` | Customer | Clear cart |

### Returns

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/returns/eligible-orders` | Customer | Orders eligible for return |
| GET | `/api/v1/returns/my-requests` | Customer | Customer's return requests |
| POST | `/api/v1/returns` | Customer | Create return request |
| GET | `/api/v1/returns` | Any | List returns (staff see all) |
| GET | `/api/v1/returns/{id}` | Any | Get return details |
| PUT | `/api/v1/returns/{id}/status` | Manager/Admin | Update return status |

### Inventory

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/inventory/transactions` | Manager/Admin | List inventory transactions |
| GET | `/api/v1/inventory/transactions/product/{id}` | Manager/Admin | Product transaction history |
| POST | `/api/v1/inventory/adjustment` | Manager/Admin | Manual stock adjustment |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/notifications` | Any | List notifications |
| GET | `/api/v1/notifications/unread-count` | Any | Unread count |
| PUT | `/api/v1/notifications/{id}/read` | Any | Mark as read |
| PUT | `/api/v1/notifications/read-all` | Any | Mark all as read |
| DELETE | `/api/v1/notifications/{id}` | Any | Delete notification |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/analytics/financial-summary` | Staff | Revenue, sales, brand data |
| GET | `/api/v1/analytics/order-pipeline` | Staff | Active order status counts |
| GET | `/api/v1/analytics/sales-channel-comparison` | Staff | Online vs offline sales |
| GET | `/api/v1/analytics/return-analytics` | Staff | Return rates and trends |

### Auditor

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/auditor/inventory-logs` | Auditor/Admin | Inventory event log |
| GET | `/api/v1/auditor/activity-logs` | Auditor/Admin | User activity log |
| GET | `/api/v1/auditor/inventory-logs/export` | Auditor/Admin | Export as Excel |
| GET | `/api/v1/auditor/activity-logs/export` | Auditor/Admin | Export as Excel |
| GET | `/api/v1/auditor/reports/monthly-transactions` | Auditor/Admin | Monthly orders Excel report |
| GET | `/api/v1/auditor/reports/inventory-audit` | Auditor/Admin | Stock levels Excel report |

### Users (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users` | Admin | List all users |
| GET | `/api/v1/users/customers` | Admin | List customers |
| GET | `/api/v1/users/employees` | Admin | List employees |
| GET | `/api/v1/users/customer/{id}` | Admin | Get customer |
| GET | `/api/v1/users/employee/{id}` | Admin | Get employee |
| POST | `/api/v1/users/staff` | Admin | Create manager or auditor |
| PUT | `/api/v1/users/employee/{id}` | Admin | Update employee |
| PUT | `/api/v1/users/employee/{id}/role` | Admin | Change employee role |
| PUT | `/api/v1/users/customer/{id}/status` | Admin | Activate/deactivate customer |
| PUT | `/api/v1/users/employee/{id}/status` | Admin | Activate/deactivate employee |
| DELETE | `/api/v1/users/customer/{id}` | Admin | Hard delete customer |
| DELETE | `/api/v1/users/employee/{id}` | Admin | Hard delete employee |

### Advertisements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/advertisements` | Public | List active ads (used by home page carousel) |
| GET | `/api/v1/advertisements/all` | Admin | List all ads including inactive |
| POST | `/api/v1/advertisements` | Admin | Create advertisement record |
| PATCH | `/api/v1/advertisements/{id}` | Admin | Update title, display order, or toggle active |
| DELETE | `/api/v1/advertisements/{id}` | Admin | Hard delete advertisement |

### Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/payments/payhere/notify` | Public | PayHere server callback |
| GET | `/api/v1/payments/payhere/status/{order_id}` | Public | Check payment status |

---

## Key Business Rules

### Order Status Flow

```
Online Orders:
  PENDING → CONFIRMED → SHIPPED → READY_TO_PICKUP → DELIVERED
  Any status → CANCELLED (restores stock)
  DELIVERED / READY_TO_PICKUP → RETURN_APPROVED (when return approved)

Offline Orders (in-store):
  Created directly as DELIVERED (paid at point of sale, manager only)
```

### Return Requests

- Only orders in **DELIVERED** or **READY_TO_PICKUP** status are eligible
- Return window: **7 days** from reaching delivery status
- Maximum **one return request per order**
- Partial returns (specific items/quantities) supported
- Status flow: `PENDING → APPROVED → COMPLETED` or `PENDING → REJECTED`
- Completing a return (`COMPLETED`) automatically restores stock via inventory transaction
- Rejection requires a reason message (`admin_notes`)

### Inventory

- Stock is deducted immediately on order creation
- Stock is restored on order cancellation
- Stock is restored when a return is marked `COMPLETED`
- Low stock alert (≤ 3 units) notifies all active admin employees
- Low stock threshold only fires once per crossing (not on every adjustment)

### Offline Sales (Manager Only)

- Admin **cannot** create offline sales — this is manager-exclusive
- Customer info (name/phone) is stored on the order, no customer account required
- Stock is deducted immediately, same as online orders
- Order is created directly in `DELIVERED` status

### Authentication

- Customers register via email/password or Google OAuth
- Email verification is required for email/password customers before login
- Employees are created by admins only (no self-registration)
- JWT tokens expire in 24 hours (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)

### Password Rules (both customers and employees)

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## Deployment

### Production Checklist

Before deploying to production:

1. **Set `PAYHERE_SANDBOX=false`** in `backend/.env`
2. **Change all default passwords** in the database (admin, manager, auditor)
3. **Use a strong, unique `SECRET_KEY`** — at least 32 random characters
4. **Enable HTTPS** on your server (required for PayHere callbacks and Firebase)
5. **Update `CORS_ORIGINS`** to only include your production frontend URL
6. **Update `FRONTEND_URL` and `BACKEND_URL`** to your production domains
7. **Set up PostgreSQL with proper credentials** (not defaults)
8. **Run Alembic migrations**: `alembic upgrade head`

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

Serve the `dist/` folder with Nginx, Caddy, or any static file server.

### Nginx Example Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (React SPA)
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Database Migrations (Alembic)

Run on every deployment after pulling new code:

```bash
cd backend
source venv/bin/activate
alembic upgrade head
```

---

## Postman Collection

A complete Postman collection is included at `postman/`:

- `Japan_Lanka_API.postman_collection.json` — 50+ requests across all endpoints
- `Japan_Lanka_Local.postman_environment.json` — Local environment variables

**How to use:**
1. Import both files into Postman
2. Select the **Japan Lanka Local** environment
3. Run **Health Check**, then login as admin/manager, then as customer
4. Tokens auto-populate; all requests can then be run individually

---

## Known Issues & Troubleshooting

### Firebase Clock Skew
**Symptom:** Google OAuth login fails with token timing errors
**Fix:** Add `FIREBASE_CLOCK_SKEW_SECONDS=10` to `backend/.env`

### High CPU during development
**Symptom:** `uvicorn --reload` uses excessive CPU
**Fix:** `watchfiles` is included in `requirements.txt` and used automatically

### "Email already registered" but user does not exist
**Symptom:** Registration fails claiming email is taken, but no account exists
**Cause:** Orphaned Firebase user from a previous failed registration
**Fix:** The system automatically cleans these up on the next registration attempt for the same email

### 403 on customer endpoints after registration
**Symptom:** Newly registered customer gets 403 Forbidden
**Cause:** Email not verified — customer must click the verification link sent to their email
**Fix:** Check spam folder; resend via `/api/v1/auth/customer/resend-verification`

### PostgreSQL `return_approved` enum error
**Symptom:** 500 error when approving a return request
**Fix:** Run the migration `alembic upgrade head` to add `RETURN_APPROVED` to the `order_status` enum

### Offline sale access denied
**Symptom:** Admin gets 403 when trying to create an offline sale
**Cause:** Offline sales are intentionally restricted to the **Manager** role only
**Fix:** Log in with a manager account to create offline sales

### Docker build fails with TLS handshake timeout
**Symptom:** `docker-compose up --build` fails with `net/http: TLS handshake timeout` when pulling base images
**Cause:** Docker Desktop cannot reach Docker Hub (network/DNS issue)
**Fix:**
1. Restart Docker Desktop from the menu bar and retry
2. If images were previously pulled, use `docker-compose build --pull=false` to skip re-pulling
3. Try switching networks (hotspot vs Wi-Fi) or using a VPN
4. Test connectivity with `curl -I https://registry-1.docker.io/v2/`

---

## License

Proprietary — Japan Lanka Enterprises. All rights reserved.
