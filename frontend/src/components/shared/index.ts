// Shared UI Components
// Export all shared components from a single entry point

export { default as Button } from './Button';
export type { ButtonVariant, ButtonSize } from './Button';

export { default as Input } from './Input';

export { default as Card } from './Card';

export { default as Badge } from './Badge';

export { default as EmptyState } from './EmptyState';

export { default as LoadingSpinner } from './LoadingSpinner';

// Dashboard Layout - Unified layout for all dashboard roles
export { default as DashboardLayout, roleConfigs } from './DashboardLayout';
export type {
  NavItem,
  DashboardRole,
  RoleConfig,
  DashboardUser,
  DashboardLayoutProps,
} from './DashboardLayout';

// Profile Display - Unified profile component for all roles
export { default as ProfileDisplay } from './ProfileDisplay';
export type {
  ProfileUser,
  ProfileFieldConfig,
  ProfileDisplayProps,
} from './ProfileDisplay';

// Re-export Toast from components folder for consistency
export { default as Toast } from '../Toast';
export type { ToastType } from '../Toast';
