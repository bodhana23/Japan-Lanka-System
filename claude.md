# Claude.md - Japan Lanka System Reference

## Project Overview
**Japan Lanka Enterprises** - Automobile Parts Management System
- E-commerce platform for vehicle parts in Sri Lanka
- Multi-role system: Customer, Manager, Admin, Auditor
- Frontend-only React + TypeScript application (no backend yet)
- Storage: localStorage + sessionStorage

## Tech Stack
- React 18.2.0
- TypeScript 4.9.5
- React Router DOM 6.22.3
- **Vite** (migrated from Create React App)
- Context API for state management
- Pure CSS styling

## Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx
│   │   └── Toast.tsx
│   ├── context/
│   │   └── CartContext.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── CustomerDashboard.tsx
│   │   ├── ManagerDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AuditorDashboard.tsx
│   │   ├── Shop.tsx
│   │   ├── Checkout.tsx
│   │   └── ManageUsers.tsx
│   ├── utils/
│   │   ├── validation.ts
│   │   └── errorHandler.ts
│   ├── App.tsx
│   └── index.tsx
```

## Current Routes
- `/` - Home landing page
- `/login` - Login page
- `/register` - Customer registration
- `/dashboard` - Customer dashboard
- `/shop` - Product catalog (requires login)
- `/checkout` - Checkout page (requires login)
- `/manager-dashboard` - Manager dashboard
- `/admin-dashboard` - Admin dashboard
- `/auditor-dashboard` - Auditor dashboard
- `/manage-users` - User management

## User Roles
1. **Customer**: Shop, order, request returns
2. **Manager**: Inventory, order processing, returns
3. **Admin**: Analytics, user management
4. **Auditor**: Audit logs, activity tracking

## Hardcoded Staff Accounts (Demo)
- Manager: manager1@gmail.com / manager@1
- Admin: admin@gmail.com / admin@1
- Auditor: auditor1@gmail.com / auditor@1
- Customer: customer2@gmail.com / customer@2222

## Data Models (TypeScript Interfaces)

### User
```typescript
interface UserProfile {
  email: string;
  fullName: string;
  name?: string;
  role: 'customer' | 'manager' | 'admin' | 'auditor';
  phoneNumber?: string;
  password: string;
}
```

### Product
```typescript
interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  modelYear: string;
  price: number;
  quantity: number;
  quantityAvailable: number;
  category: string;
  image: string;
  description: string;
  imageLink?: string;
  yearFrom?: number;
  yearTo?: number;
}
```

### Order
```typescript
interface Order {
  id: string;
  items: string[];
  itemsDetailed: OrderItem[];
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'ready_to_pickup' | 'delivered';
  orderDate: string;
  deliveryMethod: 'pickup' | 'shipping';
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress?: { address: string; city: string; postalCode: string };
}
```

## LocalStorage Keys
- `currentUser` - Currently logged-in user
- `registeredUsers` - All registered users
- `cart` (sessionStorage) - Shopping cart items
- `customerOrders` - Customer orders

## CartContext API
- `cartItems: CartItem[]`
- `addToCart(product: Product): void`
- `removeFromCart(productId: string): void`
- `updateQuantity(productId: string, quantity: number): void`
- `clearCart(): void`
- `showToast(message: string, type: 'success' | 'error' | 'info'): void`

## Current Task: Window Shopper Feature

### Requirements
1. Add two buttons to Home page:
   - "Search for Parts" → Browse parts without login
   - "Search for Vehicles" → (Future implementation)
2. Create window shopper flow:
   - Browse parts → Add to cart → Checkout redirects to login
   - After login → Redirect back to checkout
3. Hide profile/account UI for non-logged-in users
4. Maintain all existing functionality

### Implementation Plan
1. ✅ Create claude.md reference file
2. ✅ Update Home.tsx with navigation buttons
3. ✅ Create /browse-parts route (window shopper version of Shop)
4. ✅ Update Shop component to detect logged-in vs window shopper
5. ✅ Modify Checkout to redirect to login if not authenticated
6. ✅ Update Login to redirect back to checkout after auth
7. ✅ Update App.tsx routing

### Changes Implemented

#### 1. Home.tsx (Updated)
- Added "Search for Parts" button that navigates to `/browse-parts`
- Added "Search for Vehicles" button (placeholder for future implementation)
- Added new window shopper section with styled buttons
- Added CSS styling for the new section

#### 2. Home.css (Updated)
- Added `.window-shopper-section` styles
- Added `.shopper-btn` with hover animations
- Added responsive styles for mobile devices
- Maintains consistent design with existing theme

#### 3. Shop.tsx (Updated)
- Added login status detection using `localStorage.getItem('currentUser')`
- Conditional header navigation:
  - Logged-in users: "Back to Dashboard" button
  - Window shoppers: "Back to Home" button
- Updated `handleCheckout` to redirect to login if not authenticated
- Stores redirect URL in `sessionStorage` before redirecting to login
- Maintains all existing functionality for logged-in users

#### 4. Login.tsx (Updated)
- Added redirect logic after successful login
- Checks `sessionStorage.getItem('redirectAfterLogin')`
- If redirect URL exists, navigates there instead of default dashboard
- Clears redirect URL from sessionStorage after use
- Applied to both registered users and hardcoded accounts

#### 5. Register.tsx (Updated)
- Auto-login newly registered users
- Added redirect logic for window shoppers who register
- Navigates to checkout if redirect URL exists
- Improved user experience (no need to login after registration)

#### 6. App.tsx (Updated)
- Added new route: `/browse-parts` pointing to Shop component
- Route reuses existing Shop component (no code duplication)
- All existing routes remain unchanged

### Window Shopper Flow

```
1. User visits Home page (/)
2. Clicks "Search for Parts" button
3. Redirected to /browse-parts (Shop component)
4. Browse products, add to cart (no login required)
5. Cart persists in sessionStorage
6. Click checkout in cart drawer
7. If not logged in:
   - Stores '/checkout' in sessionStorage
   - Redirects to /login
8. User can either:
   a. Login with existing account → Redirects to /checkout
   b. Click "Register" → Create account → Auto-login → Redirects to /checkout
9. Complete purchase at /checkout
```

### Additional Updates (Latest)

#### 7. Login.tsx & Login.css (Updated - Go Back Button)
- Added "Go Back" button to navigate to previous page
- Button uses `navigate(-1)` to go back in browser history
- Falls back to home page if no history exists
- Positioned at top-left of login card
- Styled with green border, hover effects
- Improves user experience for window shoppers

#### 8. Toast.css (Updated - Further Reduced Size)
- Reduced toast notification size significantly:
  - Min-width: 300px → 180px (40% smaller)
  - Max-width: 500px → 280px (44% smaller)
  - Padding: 1rem 1.5rem → 0.5rem 0.75rem (50% smaller)
  - Icon size: 30px → 18px (40% smaller)
  - Message font: 0.95rem → 0.75rem (21% smaller)
  - Close button: 24px → 18px (25% smaller)
  - Border radius: 12px → 6px (more compact)
  - Shadow: lighter and more subtle
- Much more compact and less intrusive
- Maintains readability and functionality
- Perfect for quick "added to cart" notifications

#### 9. Shop.css (Updated - Button Consistency)
- Added `border: none !important` to both `.cart-btn` and `.back-btn`
- Ensures both buttons have identical green gradient styling
- Prevents any browser default border styles from appearing
- "Back to Home" and "Cart" buttons now perfectly match

### Build System Migration

#### 10. Migrated from Create React App to Vite
- **Removed:** `react-scripts`, `public/index.html`, `src/index.tsx`, `src/react-app-env.d.ts`
- **Added:**
  - `vite.config.ts` - Vite configuration with port 3000 and auto-open
  - `frontend/index.html` - HTML entry point (moved to root)
  - `src/main.tsx` - New entry point (replaces index.tsx)
  - `src/vite-env.d.ts` - Vite environment types
  - `tsconfig.node.json` - TypeScript config for Vite
- **Benefits:**
  - ⚡ Faster development server startup
  - ⚡ Lightning-fast Hot Module Replacement (HMR)
  - ⚡ Faster build times
  - 📦 Smaller bundle size
  - 🔧 Better TypeScript support
- **Updated Scripts:**
  - `npm run dev` or `npm start` - Start Vite dev server
  - `npm run build` - Build with TypeScript check + Vite
  - `npm run preview` - Preview production build
- **Server Configuration:**
  - Port: 3000 (same as before)
  - Auto-open browser on start
  - Build output: `build/` directory

### Important Notes
- ✅ All existing functionality preserved
- ✅ No breaking changes to current user flows
- ✅ Cart works for both logged-in and window shoppers
- ✅ SessionStorage used for redirect URLs (clears on browser close)
- ✅ Responsive design maintained across all screen sizes
- ✅ **Vite dev server** running on http://localhost:3000
- ✅ Go Back button on login page for better navigation
- ✅ Compact toast notifications (less intrusive)
- ✅ **Significantly faster** development experience with Vite
