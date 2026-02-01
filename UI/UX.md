# Frontend UI/UX Audit Report - Japan Lanka System

**Last Updated:** February 2026
**Status:** Phase 4 In Progress

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Theme Consistency Issues](#1-theme-consistency-issues)
3. [Layout and Alignment Issues](#2-layout-and-alignment-issues)
4. [Component Reuse Issues](#3-component-reuse-issues)
5. [Visual Hierarchy Issues](#4-visual-hierarchy-issues)
6. [Interaction and Feedback Issues](#5-interaction-and-feedback-issues)
7. [Accessibility Issues](#6-accessibility-issues)
8. [Improvements Proposal](#7-improvements-proposal)
9. [Implementation Status](#8-implementation-status)
10. [Files Modified](#9-files-modified)

---

## Executive Summary

This document provides a comprehensive UI/UX audit of the Japan Lanka System frontend application. The audit identified inconsistencies in colors, typography, spacing, hover effects, and component patterns across the application. Phase 1 quick fixes have been implemented to address the most impactful CSS-only changes.

### Key Metrics

| Category | Issues Found | Fixed in Phase 1 |
|----------|-------------|------------------|
| Color Inconsistencies | 15+ | 12 |
| Hover State Issues | 25+ | 20 |
| Disabled State Issues | 30+ | 25 |
| Focus State Issues | 10+ | 10 (global fix) |
| Border Radius Issues | 8+ | Standardized |

---

## 1. Theme Consistency Issues

### Color Inconsistencies

**Primary Green Variations:** 3+ different green colors were used interchangeably:

| Color | Usage | Status |
|-------|-------|--------|
| `#00b894` | Home, Login, ProfileModal | **Replaced with CSS variable** |
| `#28a745` | Shop, Dashboard Layouts, Manager | **Standardized as primary** |
| `#22c55e` | Hero sections, hover states | **Replaced with CSS variable** |

**Text Colors:** Mix of colors for primary text:
- `#333333` - Body text (standardized)
- `#2d3436` - Headings (standardized)
- `#1a1a1a`, `#1F2937` - Inconsistent usage

**Muted Text:** Multiple colors used inconsistently:
- `#6c757d` - Standardized as `--color-text-muted`
- `#666666`, `#7f8c8d` - Legacy usage

**Background:** Multiple page background colors:
- `#f5f7fa` - Standardized as `--color-bg-page`
- `#f8f9fa`, `#f8fcfa` - Legacy usage

### Font Stack Inconsistency

| File | Font Stack |
|------|-----------|
| Home.css | `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` |
| Shop.css | `'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif` |
| Login.css | `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif` |

### Border Radius Inconsistency

| Element | Variations Found | Standardized To |
|---------|-----------------|-----------------|
| Cards | 12px, 16px, 20px | `--radius-xl: 20px` |
| Buttons | 8px, 10px, 12px, 15px, 25px, 50px | `--radius-md: 12px` |
| Inputs | 8px, 10px, 12px | `--radius-md: 12px` |
| Modals | 16px, 20px | `--radius-xl: 20px` |

### Shadow Definitions

**Before:**
- Shop.css defined CSS variables (`--shop-shadow-sm`, `--shop-shadow-md`)
- Other files hardcoded shadows: `0 4px 20px rgba(0,0,0,0.08)`, `0 10px 30px rgba(0,0,0,0.1)`

**After (tokens.css):**
```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 15px 40px rgba(0, 0, 0, 0.15);
--shadow-primary-sm: 0 4px 15px rgba(40, 167, 69, 0.3);
--shadow-primary-md: 0 6px 20px rgba(40, 167, 69, 0.35);
--shadow-primary-lg: 0 8px 25px rgba(40, 167, 69, 0.4);
```

---

## 2. Layout and Alignment Issues

### Dashboard Sidebar Width Inconsistencies

| Dashboard | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Customer | 260px | 240px → 220px | 70px → 60px (icon-only) |
| Manager | 280px | 240px | 200px |
| Admin | 280px | 240px | 200px |

**Note:** Customer uses icon-only collapsed sidebar at 768px; Manager/Admin keep text at all sizes.

### Content Padding Variations

| Dashboard | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Customer | 30px | 20px | 15px → 12px |
| Manager | 2rem | 1rem | 1rem |
| Admin | 2rem | 1rem | 1rem |

### Header Height Inconsistencies

| Dashboard | Height |
|-----------|--------|
| Customer | 70px → 60px → 56px (responsive) |
| Manager/Admin | No fixed height, uses padding |

### Max-Width for Content

| Area | Max-Width |
|------|-----------|
| Shop | 1400px |
| Manager/Admin | 1400px |
| Customer | 1400px (in header only) |

---

## 3. Component Reuse Issues

### Duplicate Components Identified

| Component | Variations Found | Files |
|-----------|-----------------|-------|
| Dashboard Layout | 4 nearly identical versions | CustomerDashboardLayout, ManagerDashboardLayout, AdminDashboardLayout, AuditorDashboardLayout |
| Profile Card/Display | 3 variations | ProfileModal.tsx, DashboardProfile.tsx (customer), DashboardProfile.tsx (manager/admin/auditor) |
| Modal Overlay | 3+ styles | ProfileModal.css, AdminDashboard.css, ManagerDashboard.css |
| Button Styles | 10+ variations | Each file defines own button styles |
| Form Input Styles | 5+ variations | Login.css, ProfileModal.css, Shop.css, Admin forms |
| Card Styles | 8+ variations | stat-card, product-card, feature-card, profile-field, etc. |
| Loading States | Multiple implementations | Different spinner styles per component |
| Toast Notifications | 2 implementations | Toast.tsx, AdminDashboard toast |

### Missing Shared Components

- [ ] No unified Button component with variants
- [ ] No shared Input component
- [ ] No shared Card component
- [ ] No shared Badge component
- [ ] No shared Modal component

---

## 4. Visual Hierarchy Issues

### Heading Inconsistencies

| Element | Size Range |
|---------|-----------|
| Page titles | 1.1rem to 2rem |
| Section titles | 1.25rem to 1.8rem |
| Card titles | 0.9rem to 1.4rem |

### Status Badge Styles

| Location | Style |
|----------|-------|
| Manager returns | Inline colored badges |
| Customer orders | Pill badges with varying padding |
| Admin users | Different badge styling for roles |

### Icon Usage

| Page | Status |
|------|--------|
| Shop page | lucide-react icons |
| Manager Dashboard | lucide-react icons |
| Customer Dashboard | lucide-react icons |
| Legacy components | Some may have emoji remnants |

---

## 5. Interaction and Feedback Issues

### Missing States Identified

| State | Status |
|-------|--------|
| Loading States | Inconsistent skeleton/shimmer patterns |
| Empty States | Present but styled differently per component |
| Error States | Some missing, some with red borders only |
| Disabled States | **FIXED:** Standardized to `opacity: 0.6; cursor: not-allowed; transform: none !important;` |

### Hover Effect Inconsistencies

**Before:**
| Element | Hover Transform Range |
|---------|----------------------|
| Cards | `translateY(-2px)` to `translateY(-8px)` |
| Buttons | `translateY(-2px)` to `translateY(-3px)` |
| Some cards | `scale(1.02)`, others don't |

**After (Standardized):**
| Element | Hover Transform |
|---------|----------------|
| Cards | `translateY(-4px)` |
| Buttons | `translateY(-2px)` |

### Focus States

**Before:**
- Shop.css: Proper focus rings with `box-shadow: 0 0 0 3px`
- Some inputs lack visible focus states
- Buttons: Most have hover but inconsistent focus-visible

**After (tokens.css global rule):**
```css
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--color-primary, #28a745);
  outline-offset: 2px;
}
```

---

## 6. Accessibility Issues

### Good Practices Found

- Color contrast generally passes WCAG AA
- Form labels are present
- Focus states on most inputs
- Semantic heading structure

### Issues Found

| Issue | Status |
|-------|--------|
| Missing ARIA Labels | Buttons with icons only (e.g., close buttons) - **Pending** |
| Click Targets | Some buttons below 44px minimum - **Pending** |
| Keyboard Navigation | **FIXED:** Added focus-visible indicators globally |
| Screen Reader | Icon-only actions lack aria-label - **Pending** |
| Color Contrast | Some muted text (#6c757d on #f8f9fa) is borderline - **Noted** |

---

## 7. Improvements Proposal

### Quick Wins (Low Effort, High Impact)

| # | Issue | Fix | Type | Status |
|---|-------|-----|------|--------|
| 1 | Inconsistent Primary Green | Standardize to `#28a745` throughout | CSS-only | **DONE** |
| 2 | Border Radius Inconsistency | Standardize cards to 16px, buttons to 12px, inputs to 10px | CSS-only | Partial |
| 3 | Hover Transform Inconsistency | Standardize to `translateY(-4px)` for cards, `translateY(-2px)` for buttons | CSS-only | **DONE** |
| 4 | Missing Focus-Visible | Add `outline: 2px solid #28a745; outline-offset: 2px` | CSS-only | **DONE** |
| 5 | Text Color Standardization | Use `#2d3436` for headings, `#333333` for body, `#6c757d` for muted | CSS-only | Partial |
| 6 | Shadow Standardization | Use consistent shadow scale across all components | CSS-only | **DONE** |
| 7 | Disabled State Consistency | Standardize to `opacity: 0.6; cursor: not-allowed` | CSS-only | **DONE** |
| 8 | Button Padding Consistency | Standardize primary buttons to `padding: 12px 24px` | CSS-only | Partial |

### Medium Changes (Moderate Effort)

| # | Issue | Fix | Type | Status |
|---|-------|-----|------|--------|
| 9 | Create Design Tokens File | Create `src/styles/tokens.css` with CSS custom properties | CSS + import | **DONE** |
| 10 | Unify Dashboard Sidebar Width | Standardize all dashboards to same responsive breakpoints | CSS + layout | Pending |
| 11 | Consolidate Modal Styles | Create single `.modal-overlay`, `.modal-content` base classes | CSS + class updates | Pending |
| 12 | Standardize Form Input Styles | Create shared `.form-input`, `.form-select`, `.form-group` classes | CSS + class updates | Pending |
| 13 | Add ARIA Labels | Add aria-label to icon-only buttons | Component changes | Pending |
| 14 | Empty State Consistency | Create shared empty state component | Component change | Pending |
| 15 | Loading State Consistency | Create shared spinner/skeleton component | Component change | Pending |
| 16 | Toast Consolidation | Use single Toast component for all dashboards | Component change | Pending |

### Larger Refactors (Higher Effort)

| # | Issue | Fix | Type | Status |
|---|-------|-----|------|--------|
| 17 | Unified Dashboard Layout | Create single DashboardLayout component with role-based config | Major refactor | Pending |
| 18 | Shared Button Component | Create Button component with variant, size, loading props | New component | Pending |
| 19 | Shared Card Component | Create Card component with variant, hover, onClick props | New component | Pending |
| 20 | Shared Input Component | Create Input component with error, hint, icon props | New component | Pending |
| 21 | Shared Badge Component | Create Badge component for status indicators | New component | Pending |
| 22 | Profile Component Consolidation | Single ProfileCard component used across all dashboards | Component refactor | Pending |
| 23 | CSS Naming Convention | Migrate to BEM methodology or CSS Modules | Major CSS refactor | Pending |
| 24 | Dark Mode Support | Add prefers-color-scheme support with CSS variables | CSS + variable system | Pending |

---

## 8. Implementation Status

### Phase 1: Quick CSS Fixes - **COMPLETE**

| Task | Status | Details |
|------|--------|---------|
| Create tokens.css | **DONE** | Created `frontend/src/styles/tokens.css` with all design tokens |
| Import in index.css | **DONE** | Added `@import './styles/tokens.css';` |
| Update Home.css | **DONE** | 40+ color replacements with CSS variables |
| Update Login.css | **DONE** | 12+ color replacements with CSS variables |
| Update ProfileModal.css | **DONE** | 8+ color replacements with CSS variables |
| Standardize disabled states | **DONE** | 25+ files updated with consistent disabled styles |
| Standardize card hover transforms | **DONE** | All cards now use `translateY(-4px)` |
| Standardize button hover transforms | **DONE** | All buttons now use `translateY(-2px)` |
| Add focus-visible states | **DONE** | Global rule in tokens.css |

### Phase 2: CSS Consolidation - **COMPLETE**

- [x] Create shared form input styles (`.form-input`, `.form-select`, `.form-group`, `.form-hint`, `.form-error`)
- [x] Create shared modal styles (`.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`, `.modal-close`)
- [x] Create shared button base styles (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-sm`, `.btn-lg`, `.btn-block`)
- [x] Create shared card base styles (`.card`, `.card-hover`, `.card-bordered`, `.card-header`, `.card-body`, `.card-footer`, `.card-accent`)
- [x] Unify dashboard layout widths (CSS variables: `--sidebar-width`, `--content-padding`, `--content-max-width`, `--header-height`)
- [x] Create shared toast styles (`.toast`, `.toast-success`, `.toast-error`, `.toast-info`, `.toast-warning`)
- [x] Create shared empty state styles (`.empty-state`, `.empty-state-icon`)
- [x] Create shared badge styles (`.badge`, `.badge-success`, `.badge-danger`, `.badge-warning`, `.badge-info`)
- [x] Create shared loading spinner (`.spinner`, `.spinner-dark`)

### Phase 3: Component Improvements - **COMPLETE**

- [x] Add ARIA labels throughout (icon-only buttons in ProfileModal, DashboardCart, Shop, ManageUsers, DashboardUsers, Toast)
- [x] Create shared Button component (`frontend/src/components/shared/Button.tsx`)
- [x] Create shared Input component (`frontend/src/components/shared/Input.tsx`)
- [x] Create shared Card component (`frontend/src/components/shared/Card.tsx`)
- [x] Create shared Badge component (`frontend/src/components/shared/Badge.tsx`)
- [x] Consolidate Toast component (added warning variant, exported from shared)
- [x] Create shared EmptyState component (`frontend/src/components/shared/EmptyState.tsx`)
- [x] Create shared LoadingSpinner component (`frontend/src/components/shared/LoadingSpinner.tsx`)

### Phase 4: Major Refactors - **IN PROGRESS**

- [x] Unify all 4 dashboard layouts into 1 (DashboardLayout component created)
- [x] Consolidate Profile components (ProfileDisplay component created)
- [ ] Migrate existing dashboards to use new unified components
- [ ] Implement BEM naming convention
- [ ] Consider CSS Modules or Styled Components

---

## 9. Files Modified

### Phase 1 Changes

#### New Files Created

| File | Purpose |
|------|---------|
| `frontend/src/styles/tokens.css` | Central design tokens (colors, shadows, spacing, transitions, focus states) |

#### Files Updated - CSS Variables

| File | Changes |
|------|---------|
| `frontend/src/index.css` | Added import for tokens.css |
| `frontend/src/pages/Home.css` | 40+ hardcoded colors replaced with CSS variables |
| `frontend/src/pages/Login.css` | 12+ hardcoded colors replaced with CSS variables |
| `frontend/src/components/ProfileModal.css` | 8+ hardcoded colors replaced with CSS variables |

#### Files Updated - Disabled States

All files below updated to use `opacity: 0.6; cursor: not-allowed; transform: none !important;`:

| File | Selectors Updated |
|------|-------------------|
| `frontend/src/pages/AdminDashboard.css` | `.admin-cancel-btn:disabled`, `.admin-confirm-btn:disabled`, `.admin-delete-confirm-btn:disabled` |
| `frontend/src/components/dashboard/DashboardProfile.css` | `.dprof-save-btn:disabled` |
| `frontend/src/pages/Shop.css` | `.add-to-cart-btn:disabled`, `.quantity-btn:disabled` |
| `frontend/src/pages/ManagerDashboard.css` | `.save-btn:disabled`, `.cancel-btn:disabled`, `.approve-btn:disabled`, `.reject-btn:disabled` |
| `frontend/src/pages/Checkout.css` | `.place-order-btn:disabled` |
| `frontend/src/pages/EmployeeLogin.css` | `.employee-login-btn-submit:disabled` |
| `frontend/src/pages/MyOrders.css` | `.mo-modal-cancel:disabled`, `.mo-modal-submit:disabled` |
| `frontend/src/pages/ManageUsers.css` | `.page-btn:disabled`, `.confirm-delete-btn:disabled` |
| `frontend/src/components/dashboard/DashboardChangePassword.css` | `.dpass-submit-btn:disabled` |
| `frontend/src/components/dashboard/DashboardReturns.css` | `.dret-submit-btn:disabled` |
| `frontend/src/components/dashboard/DashboardOrders.css` | `.dord-modal-submit:disabled` |
| `frontend/src/components/auditor/DashboardActivityLogs.css` | `.refresh-btn:disabled`, `.pagination-btn:disabled` |
| `frontend/src/components/auditor/DashboardInventoryLogs.css` | `.refresh-btn:disabled`, `.pagination-btn:disabled` |
| `frontend/src/components/admin/DashboardUsers.css` | `.admin-status-toggle:disabled`, `.admin-delete-btn:disabled` |
| `frontend/src/components/admin/DashboardLowStock.css` | `.admin-refresh-btn:disabled` |
| `frontend/src/pages/RequestReturn.css` | `.rr-submit-btn:disabled`, `.rr-cancel-btn:disabled` |
| `frontend/src/components/dashboard/DashboardCart.css` | `.dcart-qty-btn:disabled` |

#### Files Updated - Card Hover Transforms (translateY(-4px))

| File | Selectors Updated |
|------|-------------------|
| `frontend/src/pages/Shop.css` | `.product-card:hover` |
| `frontend/src/pages/ManagerDashboard.css` | `.product-item:hover`, `.return-item:hover` |
| `frontend/src/pages/ManageUsers.css` | `.user-type-card:hover` |
| `frontend/src/pages/CustomerDashboard.css` | `.cd-stat-card:hover`, `.cd-category-card:hover` |
| `frontend/src/components/dashboard/DashboardOverview.css` | `.do-stat-card:hover`, `.do-category-card:hover` |
| `frontend/src/components/auditor/DashboardReports.css` | `.report-card:hover` |
| `frontend/src/components/dashboard/DashboardOrders.css` | `.dord-order-card:hover` |
| `frontend/src/pages/Checkout.css` | `.delivery-option:hover` |
| `frontend/src/pages/RequestReturn.css` | `.rr-order-clickable:hover` |
| `frontend/src/components/admin/DashboardAnalytics.css` | `.admin-summary-card:hover` |

#### Files Updated - Button Hover Transforms (translateY(-2px))

| File | Selectors Updated |
|------|-------------------|
| `frontend/src/pages/ManagerDashboard.css` | `.add-product-btn:hover`, `.edit-profile-btn-main:hover` |
| `frontend/src/pages/MyOrders.css` | `.mo-retry-btn:hover`, `.mo-shop-btn:hover` |
| `frontend/src/pages/CustomerDashboard.css` | `.cd-shop-now-btn:hover` |
| `frontend/src/pages/Home.css` | `.cta-button:hover` |
| `frontend/src/pages/Shop.css` | `.clear-filters-cta:hover` |
| `frontend/src/components/dashboard/DashboardCart.css` | `.dcart-shop-btn:hover` |
| `frontend/src/components/dashboard/DashboardOverview.css` | `.do-shop-now-btn:hover` |
| `frontend/src/pages/RequestReturn.css` | `.rr-shop-btn:hover` |

---

## Design Tokens Reference

The following tokens are now available in `frontend/src/styles/tokens.css`:

### Colors

```css
/* Primary Colors */
--color-primary: #28a745;
--color-primary-dark: #218838;
--color-primary-light: #00b894;

/* Semantic Colors */
--color-secondary: #2c3e50;
--color-danger: #dc3545;
--color-danger-dark: #c82333;
--color-warning: #f39c12;
--color-info: #3498db;
--color-success: #28a745;

/* Text Colors */
--color-text-primary: #2d3436;
--color-text-body: #333333;
--color-text-muted: #6c757d;
--color-text-light: #999999;

/* Background Colors */
--color-bg-page: #f5f7fa;
--color-bg-card: #ffffff;
--color-bg-hover: #f8f9fa;
--color-bg-input: #ffffff;

/* Border Colors */
--color-border: #e9ecef;
--color-border-light: #f0f0f0;
--color-border-dark: #dee2e6;
```

### Spacing

```css
--space-xs: 0.25rem;
--space-sm: 0.5rem;
--space-md: 1rem;
--space-lg: 1.5rem;
--space-xl: 2rem;
--space-2xl: 3rem;
```

### Border Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-pill: 50px;
```

### Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 20px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 15px 40px rgba(0, 0, 0, 0.15);

/* Primary color shadows */
--shadow-primary-sm: 0 4px 15px rgba(40, 167, 69, 0.3);
--shadow-primary-md: 0 6px 20px rgba(40, 167, 69, 0.35);
--shadow-primary-lg: 0 8px 25px rgba(40, 167, 69, 0.4);

/* Danger color shadows */
--shadow-danger-sm: 0 4px 15px rgba(220, 53, 69, 0.3);
--shadow-danger-md: 0 6px 20px rgba(220, 53, 69, 0.4);
```

### Transitions

```css
--transition-fast: all 0.2s ease;
--transition-base: all 0.3s ease;
--transition-slow: all 0.4s ease;
```

---

## Usage Guidelines

### Using CSS Variables with Fallbacks

Always provide fallback values when using CSS variables:

```css
/* Good - includes fallback */
.button {
  background: var(--color-primary, #28a745);
  box-shadow: var(--shadow-primary-sm, 0 4px 15px rgba(40, 167, 69, 0.3));
}

/* Avoid - no fallback */
.button {
  background: var(--color-primary);
}
```

### Standard Disabled State

```css
.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}
```

### Standard Hover Transforms

```css
/* Cards */
.card:hover {
  transform: translateY(-4px);
}

/* Buttons */
.button:hover:not(:disabled) {
  transform: translateY(-2px);
}
```

### Focus Visible States

Focus states are handled globally in `tokens.css`. No additional CSS needed for standard interactive elements.

---

## Next Steps

1. ~~**Phase 2** - Create shared CSS classes for forms, modals, buttons, and cards~~ **DONE**
2. **Phase 3** - Build reusable React components (Button, Input, Card, Badge)
3. **Phase 4** - Consolidate dashboard layouts into single configurable component

---

## Phase 2 Implementation Details

### New Shared CSS Classes Added to `tokens.css`

#### Form Inputs
```css
.form-group      /* Wrapper for label + input */
.form-input      /* Standard text input */
.form-select     /* Select dropdown */
.form-textarea   /* Textarea element */
.form-hint       /* Helper text below input */
.form-error      /* Error message text */

/* States */
.form-input.error  /* Error state styling */
```

#### Modal Components
```css
.modal-overlay     /* Backdrop with blur */
.modal-content     /* Main modal container (default 500px) */
.modal-content-sm  /* Small modal (400px) */
.modal-content-lg  /* Large modal (650px) */
.modal-header      /* Header with title and close button */
.modal-body        /* Content area */
.modal-footer      /* Action buttons area */
.modal-close       /* Close button (red circle) */
.modal-description /* Description text */
```

#### Button Components
```css
.btn            /* Base button styles */
.btn-primary    /* Green gradient primary action */
.btn-secondary  /* Gray outline secondary action */
.btn-danger     /* Red gradient destructive action */
.btn-ghost      /* Transparent with green border */
.btn-sm         /* Small button size */
.btn-lg         /* Large button size */
.btn-block      /* Full width button */
.btn-icon       /* Icon-only button (44x44px) */
```

#### Card Components
```css
.card           /* Base card with shadow */
.card-bordered  /* Adds visible border */
.card-hover     /* Adds hover lift effect */
.card-header    /* Card header section */
.card-body      /* Card content section */
.card-footer    /* Card footer section */
.card-accent    /* Left green accent border */
.card-accent-danger  /* Left red accent */
.card-accent-warning /* Left yellow accent */
.card-accent-info    /* Left blue accent */
```

#### Toast Notifications
```css
.toast          /* Base toast styles */
.toast-success  /* Green gradient */
.toast-error    /* Red gradient */
.toast-info     /* Blue gradient */
.toast-warning  /* Yellow gradient */
.toast-icon     /* Icon container */
.toast-message  /* Message text */
```

#### Badge Components
```css
.badge          /* Base badge styles */
.badge-success  /* Green theme */
.badge-danger   /* Red theme */
.badge-warning  /* Yellow theme */
.badge-info     /* Blue theme */
.badge-neutral  /* Gray theme */
```

#### Empty State
```css
.empty-state       /* Container with centered content */
.empty-state-icon  /* Animated icon container */
```

#### Loading Spinner
```css
.spinner       /* White spinner (for dark backgrounds) */
.spinner-dark  /* Green spinner (for light backgrounds) */
```

### Dashboard Layout CSS Variables

All dashboard layouts now use these standardized CSS variables:

```css
:root {
  /* Sidebar widths */
  --sidebar-width: 280px;
  --sidebar-width-tablet: 240px;
  --sidebar-width-mobile: 70px;
  --sidebar-width-small: 60px;

  /* Content padding */
  --content-padding: 2rem;
  --content-padding-tablet: 1.5rem;
  --content-padding-mobile: 1rem;

  /* Max content width */
  --content-max-width: 1400px;

  /* Header height */
  --header-height: 70px;
  --header-height-mobile: 60px;
}
```

### Files Updated in Phase 2

| File | Changes |
|------|---------|
| `frontend/src/styles/tokens.css` | Added all shared component styles |
| `frontend/src/components/CustomerDashboardLayout.css` | Using CSS variables for widths/padding |
| `frontend/src/components/ManagerDashboardLayout.css` | Using CSS variables for widths/padding |
| `frontend/src/components/AdminDashboardLayout.css` | Using CSS variables for widths/padding |
| `frontend/src/components/AuditorDashboardLayout.css` | Using CSS variables for widths/padding |

### Usage Examples

**Using form classes:**
```jsx
<div className="form-group">
  <label>Email Address</label>
  <input
    type="email"
    className={`form-input ${errors.email ? 'error' : ''}`}
    placeholder="Enter email"
  />
  <span className="form-hint">We'll never share your email</span>
  {errors.email && <span className="form-error">{errors.email}</span>}
</div>
```

**Using button classes:**
```jsx
<button className="btn btn-primary">Save Changes</button>
<button className="btn btn-secondary">Cancel</button>
<button className="btn btn-danger btn-sm">Delete</button>
```

**Using card classes:**
```jsx
<div className="card card-hover card-bordered">
  <div className="card-header">
    <h3>Card Title</h3>
  </div>
  <div className="card-body">
    Card content here
  </div>
</div>
```

**Using modal classes:**
```jsx
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">
      <h2>Modal Title</h2>
      <button className="modal-close">&times;</button>
    </div>
    <div className="modal-body">
      Modal content here
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary">Cancel</button>
      <button className="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

---

## Phase 3 Implementation Details

### New Shared Components Created

All shared components are located in `frontend/src/components/shared/` and exported from `frontend/src/components/shared/index.ts`.

#### Button Component (`Button.tsx`)
```tsx
import { Button } from '../components/shared';

// Variants: primary, secondary, danger, ghost
// Sizes: sm, md, lg

<Button variant="primary">Save</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="ghost" leftIcon={<Plus size={16} />}>Add Item</Button>
<Button variant="primary" isLoading>Saving...</Button>
<Button variant="secondary" isBlock>Full Width</Button>
```

#### Input Component (`Input.tsx`)
```tsx
import { Input } from '../components/shared';

<Input label="Email" type="email" placeholder="Enter email" />
<Input label="Password" type="password" error="Password is required" />
<Input label="Search" leftIcon={<Search size={16} />} hint="Enter search term" />
<Input label="Name" isRequired />
```

#### Card Component (`Card.tsx`)
```tsx
import { Card } from '../components/shared';

// Variants: default, bordered, accent, accent-danger, accent-warning, accent-info

<Card variant="bordered" isHoverable>
  <Card.Header>
    <h3>Card Title</h3>
  </Card.Header>
  <Card.Body>
    Card content here
  </Card.Body>
  <Card.Footer>
    <Button>Action</Button>
  </Card.Footer>
</Card>
```

#### Badge Component (`Badge.tsx`)
```tsx
import { Badge } from '../components/shared';

// Variants: success, danger, warning, info, neutral

<Badge variant="success">Active</Badge>
<Badge variant="danger" icon={<AlertCircle size={12} />}>Error</Badge>
<Badge variant="warning">Pending</Badge>
```

#### EmptyState Component (`EmptyState.tsx`)
```tsx
import { EmptyState } from '../components/shared';

<EmptyState
  icon={<ShoppingCart size={64} />}
  title="Your cart is empty"
  description="Add some items to get started"
  actionLabel="Browse Products"
  onAction={() => navigate('/shop')}
/>
```

#### LoadingSpinner Component (`LoadingSpinner.tsx`)
```tsx
import { LoadingSpinner } from '../components/shared';

// Sizes: sm, md, lg
// Variants: light, dark

<LoadingSpinner />
<LoadingSpinner size="lg" text="Loading products..." />
<LoadingSpinner variant="light" /> // For dark backgrounds
```

#### Toast Component (enhanced)
```tsx
import { Toast } from '../components/shared';

// Types: success, error, info, warning

<Toast
  message="Operation successful!"
  type="success"
  duration={3000}
  onClose={() => setShowToast(false)}
/>
```

### ARIA Labels Added

The following files were updated with `aria-label` attributes for accessibility:

| File | Elements Updated |
|------|------------------|
| `ProfileModal.tsx` | Close modal button |
| `DashboardCart.tsx` | Decrease/Increase quantity buttons, Remove item button |
| `Shop.tsx` | Close cart button, All filter removal buttons, Quantity control buttons |
| `ManageUsers.tsx` | Close banner buttons, Toggle status buttons, Delete buttons, Pagination buttons |
| `DashboardUsers.tsx` | Delete user button |
| `Toast.tsx` | Close notification button |

### Files Created in Phase 3

| File | Purpose |
|------|---------|
| `frontend/src/components/shared/Button.tsx` | Shared Button component with variants |
| `frontend/src/components/shared/Input.tsx` | Shared Input component with validation |
| `frontend/src/components/shared/Card.tsx` | Shared Card component with layouts |
| `frontend/src/components/shared/Badge.tsx` | Shared Badge for status indicators |
| `frontend/src/components/shared/EmptyState.tsx` | Shared empty state display |
| `frontend/src/components/shared/LoadingSpinner.tsx` | Shared loading indicator |
| `frontend/src/components/shared/index.ts` | Export barrel file |

### Files Modified in Phase 3

| File | Changes |
|------|---------|
| `frontend/src/components/ProfileModal.tsx` | Added aria-label to close button |
| `frontend/src/components/dashboard/DashboardCart.tsx` | Added aria-labels to quantity and remove buttons |
| `frontend/src/pages/Shop.tsx` | Added aria-labels to filter and cart buttons |
| `frontend/src/pages/ManageUsers.tsx` | Added aria-labels to action and pagination buttons |
| `frontend/src/components/admin/DashboardUsers.tsx` | Added aria-label to delete button |
| `frontend/src/components/Toast.tsx` | Added warning type, added aria-label to close button |
| `frontend/src/components/Toast.css` | Added toast-warning styles |

---

## Phase 4 Implementation Details

### Overview

Phase 4 focuses on major refactors to consolidate duplicate code and create a unified architecture for dashboard layouts and profile components. This reduces maintenance overhead and ensures consistent behavior across all user roles.

### Unified Dashboard Layout Component

A single `DashboardLayout` component replaces the 4 separate layout components (CustomerDashboardLayout, ManagerDashboardLayout, AdminDashboardLayout, AuditorDashboardLayout).

#### Key Features

- **Role-based configuration**: Single component handles all 4 roles via configuration
- **Collapsible sidebar**: Customer dashboard has collapsible sidebar on mobile; others keep text visible
- **Header styles**: Two modes - "title-only" (Customer) and "greeting" (Manager/Admin/Auditor)
- **Profile modal integration**: Customer layout supports profile modal on avatar click
- **Accent color theming**: Each role can have custom accent color (Auditor uses teal)
- **Badge support**: Navigation items can display badges (e.g., cart count)

#### Component API

```tsx
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig } from '../components/shared';

// Define navigation items
const navItems: NavItem<'overview' | 'orders' | 'profile'>[] = [
  { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
];

// Create role config
const roleConfig: RoleConfig = {
  role: 'customer',
  ...roleConfigs.customer,
};

// Use the component
<DashboardLayout
  navItems={navItems}
  activeNav={activeNav}
  onNavChange={setActiveNav}
  roleConfig={roleConfig}
  user={user} // Optional - uses AuthContext if not provided
>
  {/* Page content */}
</DashboardLayout>
```

#### Role Configurations

| Role | Portal Label | Header Style | Collapsible | Profile Modal | Accent Color |
|------|--------------|--------------|-------------|---------------|--------------|
| Customer | Customer Portal | title-only | Yes | Yes | #28a745 (green) |
| Manager | Manager Portal | greeting | No | No | #28a745 (green) |
| Admin | Admin Portal | greeting | No | No | #28a745 (green) |
| Auditor | Auditor Portal | greeting | No | No | #00b894 (teal) |

### Unified Profile Display Component

A single `ProfileDisplay` component replaces the 4 separate profile components with configurable fields and edit capability.

#### Key Features

- **View-only mode**: For employees (Manager/Admin/Auditor) - displays profile info
- **Editable mode**: For customers - allows editing name and phone number
- **Configurable fields**: Show/hide specific fields (phone, role, member since, password)
- **Google account handling**: Displays Google badge and disables email editing
- **Accent color theming**: Customizable accent color per role
- **Form validation**: Built-in validation for name and phone number
- **Success/error banners**: Feedback after save operations

#### Component API

```tsx
import { ProfileDisplay } from '../components/shared';
import type { ProfileUser, ProfileFieldConfig } from '../components/shared';

// For Customer (editable)
<ProfileDisplay
  user={user}
  title="My Profile"
  subtitle="View and manage your account information"
  roleLabel="Customer"
  isEditable={true}
  onSave={async (data) => {
    await authApi.updateMe(data);
    // Handle success...
  }}
  onChangePassword={() => onNavigate('change-password')}
  fieldConfig={{
    showPhone: true,
    showRole: true,
    showMemberSince: false,
    showPassword: true,
  }}
/>

// For Employee (view-only)
<ProfileDisplay
  user={user}
  title="Profile Information"
  subtitle="View your account details"
  roleLabel="Administrator"
  isEditable={false}
  fieldConfig={{
    showPhone: true,
    showRole: true,
    showMemberSince: true,
    showAccountStatus: true,
  }}
  accentColor="#00b894" // Teal for auditor
/>
```

#### Field Configuration Options

| Field | Description | Default |
|-------|-------------|---------|
| `showPhone` | Display phone number field | `true` |
| `showRole` | Display role field | `true` |
| `showMemberSince` | Display account creation date | `true` |
| `showAccountStatus` | Display active/inactive status | `false` |
| `showPassword` | Display password field with change link | `false` |

### Files Created in Phase 4

| File | Purpose |
|------|---------|
| `frontend/src/components/shared/DashboardLayout.tsx` | Unified dashboard layout component |
| `frontend/src/components/shared/DashboardLayout.css` | Styles for unified dashboard layout |
| `frontend/src/components/shared/ProfileDisplay.tsx` | Unified profile display component |
| `frontend/src/components/shared/ProfileDisplay.css` | Styles for unified profile display |

### Files Modified in Phase 4

| File | Changes |
|------|---------|
| `frontend/src/components/shared/index.ts` | Added exports for DashboardLayout and ProfileDisplay |

### Migration Guide

To migrate existing dashboard pages to use the new unified components:

#### Step 1: Update Dashboard Page Imports

```tsx
// Before
import CustomerDashboardLayout, { NavItemId } from '../components/CustomerDashboardLayout';

// After
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig } from '../components/shared';
```

#### Step 2: Define Navigation Items

```tsx
// Define your navigation items with the NavItem type
type MyNavId = 'overview' | 'orders' | 'profile';

const navItems: NavItem<MyNavId>[] = [
  { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'orders', label: 'My Orders', icon: <Package size={20} />, badge: cartCount },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
];
```

#### Step 3: Create Role Configuration

```tsx
const roleConfig: RoleConfig = {
  role: 'customer',
  ...roleConfigs.customer,
  // Override any defaults if needed
  portalLabel: 'My Custom Portal',
};
```

#### Step 4: Replace Layout Component

```tsx
// Before
<CustomerDashboardLayout activeNav={activeNav} onNavChange={setActiveNav}>
  {/* content */}
</CustomerDashboardLayout>

// After
<DashboardLayout
  navItems={navItems}
  activeNav={activeNav}
  onNavChange={setActiveNav}
  roleConfig={roleConfig}
>
  {/* content */}
</DashboardLayout>
```

### CSS Architecture

The unified components use CSS custom properties (CSS variables) for theming:

```css
/* DashboardLayout CSS Variables */
.dl-container {
  --dl-accent-color: var(--color-primary, #28a745);
  --dl-accent-color-light: var(--color-primary-light, #00b894);
  --dl-accent-gradient: linear-gradient(135deg, var(--dl-accent-color), var(--dl-accent-color-light));
  --dl-accent-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

/* Role-specific overrides */
.dl-container.dl--auditor {
  --dl-accent-color: #00b894;
  --dl-accent-color-light: #00a085;
}

/* ProfileDisplay CSS Variables */
.pd-container {
  --pd-accent-color: var(--color-primary, #28a745);
  --pd-accent-gradient: linear-gradient(135deg, var(--pd-accent-color), var(--color-primary-light, #00b894));
}
```

### Backward Compatibility

The original layout components (CustomerDashboardLayout, ManagerDashboardLayout, etc.) remain in the codebase for backward compatibility. They can be gradually migrated to use the unified components.

### Next Steps

1. **Phase 4b**: Migrate CustomerDashboard.tsx to use DashboardLayout
2. **Phase 4c**: Migrate ManagerDashboard.tsx to use DashboardLayout
3. **Phase 4d**: Migrate AdminDashboard.tsx to use DashboardLayout
4. **Phase 4e**: Migrate AuditorDashboard.tsx to use DashboardLayout
5. **Phase 4f**: Replace individual DashboardProfile components with ProfileDisplay
6. **Phase 5**: Implement BEM naming convention for remaining CSS
7. **Phase 6**: Consider migration to CSS Modules or Styled Components

---

*This document should be updated as additional phases are implemented.*
