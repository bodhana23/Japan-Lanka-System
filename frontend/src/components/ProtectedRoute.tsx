import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type UserRole = 'customer' | 'manager' | 'admin' | 'auditor';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

/**
 * A route wrapper that protects routes based on authentication and role.
 *
 * @param children - The component to render if access is granted
 * @param requiredRole - Optional role(s) required to access the route
 * @param redirectTo - Custom redirect path for unauthorized users (default: role-based)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show nothing while checking authentication status
  if (isLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role if required
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      // Redirect to custom path or role-based default
      const fallbackPath = redirectTo || getDefaultRouteForRole(user.role);
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Returns the default route for a given user role.
 */
function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case 'customer':
      return '/dashboard';
    case 'manager':
      return '/manager';
    case 'admin':
      return '/admin';
    case 'auditor':
      return '/auditor';
    default:
      return '/';
  }
}

export default ProtectedRoute;
