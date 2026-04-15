import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig } from '../components/shared';
import {
  DashboardOverview,
  DashboardOrders,
  DashboardReturns,
  DashboardCart,
  DashboardProfile,
  DashboardChangePassword,
} from '../components/dashboard';
import {
  LayoutDashboard, Store, Package, RotateCcw,
  ShoppingCart, User, Lock
} from 'lucide-react';

// Navigation item IDs for Customer Dashboard
type CustomerNavId = 'overview' | 'browse-parts' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

const CustomerDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart: cartItems } = useCart();

  // Default to 'overview' - show dashboard overview on login
  const [activeNav, setActiveNav] = useState<CustomerNavId>('overview');

  // Calculate cart badge count
  const cartBadge = useMemo(() => {
    return cartItems.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  }, [cartItems]);

  // Navigation items for Customer Dashboard
  const navItems: NavItem<CustomerNavId>[] = useMemo(() => [
    { id: 'browse-parts', label: 'Browse Parts', icon: <Store size={20} />, onClick: () => navigate('/shop'), isPrimary: true },
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
    { id: 'returns', label: 'Return Requests', icon: <RotateCcw size={20} /> },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart size={20} />, badge: cartBadge > 0 ? cartBadge : undefined },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'change-password', label: 'Change Password', icon: <Lock size={20} /> },
  ], [cartBadge, navigate]);

  // Role configuration for Customer
  const roleConfig: RoleConfig = useMemo(() => ({
    role: 'customer',
    ...roleConfigs.customer,
  }), []);

  // Parse section, order_id, and return_id from URL query params if present
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlOrderId = urlParams.get('order_id') || undefined;
  const urlReturnId = urlParams.get('return_id') || undefined;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') as CustomerNavId;
    if (section && ['overview', 'orders', 'returns', 'cart', 'profile', 'change-password'].includes(section)) {
      setActiveNav(section);
    }
  }, [location.search]);

  // Handle navigation changes
  const handleNavChange = (navId: CustomerNavId) => {
    // Handle browse-parts separately (redirects to shop)
    if (navId === 'browse-parts') {
      navigate('/shop');
      return;
    }

    if (['orders', 'overview', 'returns', 'cart', 'profile', 'change-password'].includes(navId)) {
      setActiveNav(navId);
      // Update URL without reload
      const newUrl = navId === 'orders' ? '/customer' : `/customer?section=${navId}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  // Render the appropriate content based on active navigation
  const renderContent = () => {
    switch (activeNav) {
      case 'overview':
        return <DashboardOverview onNavigate={handleNavChange} />;
      case 'orders':
        return <DashboardOrders onNavigate={handleNavChange} highlightOrderId={urlOrderId} />;
      case 'returns':
        return <DashboardReturns onNavigate={handleNavChange} autoOpenOrderId={urlOrderId} highlightReturnId={urlReturnId} />;
      case 'cart':
        return <DashboardCart onNavigate={handleNavChange} />;
      case 'profile':
        return <DashboardProfile onNavigate={handleNavChange} />;
      case 'change-password':
        return <DashboardChangePassword onNavigate={handleNavChange} />;
      default:
        return <DashboardOrders onNavigate={handleNavChange} />;
    }
  };

  return (
    <DashboardLayout<CustomerNavId>
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={handleNavChange}
      roleConfig={roleConfig}
      onProfileClick={() => handleNavChange('profile')}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default CustomerDashboard;
