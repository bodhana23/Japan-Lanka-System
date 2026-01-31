import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CustomerDashboardLayout, { NavItemId } from '../components/CustomerDashboardLayout';
import {
  DashboardOverview,
  DashboardOrders,
  DashboardReturns,
  DashboardCart,
  DashboardProfile,
  DashboardChangePassword,
} from '../components/dashboard';

const CustomerDashboard: React.FC = () => {
  const location = useLocation();

  // Default to 'orders' as requested - show previous orders on login
  const [activeNav, setActiveNav] = useState<NavItemId>('orders');

  // Parse section from URL query params if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section') as NavItemId;
    if (section && ['overview', 'orders', 'returns', 'cart', 'profile', 'change-password'].includes(section)) {
      setActiveNav(section);
    }
  }, [location.search]);

  // Handle navigation changes
  const handleNavChange = (navId: NavItemId) => {
    // Handle logout separately
    if (navId === 'orders' || navId === 'overview' || navId === 'returns' || navId === 'cart' || navId === 'profile' || navId === 'change-password') {
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
        return <DashboardOrders onNavigate={handleNavChange} />;
      case 'returns':
        return <DashboardReturns onNavigate={handleNavChange} />;
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
    <CustomerDashboardLayout
      activeNav={activeNav}
      onNavChange={handleNavChange}
    >
      {renderContent()}
    </CustomerDashboardLayout>
  );
};

export default CustomerDashboard;
