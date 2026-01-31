import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProfileModal from './ProfileModal';
import {
  Car, LogOut, LayoutDashboard, Package, RotateCcw,
  ShoppingCart, User, Lock, ChevronRight, Store
} from 'lucide-react';
import './CustomerDashboardLayout.css';

// Navigation items for the sidebar
export type NavItemId = 'overview' | 'browse-parts' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface NavItem {
  id: NavItemId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface CustomerDashboardLayoutProps {
  children: React.ReactNode;
  activeNav: NavItemId;
  onNavChange: (navId: NavItemId) => void;
}

const CustomerDashboardLayout: React.FC<CustomerDashboardLayoutProps> = ({
  children,
  activeNav,
  onNavChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cart: cartItems } = useCart();
  const [showProfile, setShowProfile] = useState(false);

  // Calculate cart badge count
  const cartBadge = useMemo(() => {
    return cartItems.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  }, [cartItems]);

  // Navigation items
  const navItems: NavItem[] = useMemo(() => [
    { id: 'overview', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'browse-parts', label: 'Browse Parts', icon: <Store size={20} /> },
    { id: 'orders', label: 'My Orders', icon: <Package size={20} /> },
    { id: 'returns', label: 'Return Requests', icon: <RotateCcw size={20} /> },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart size={20} />, badge: cartBadge > 0 ? cartBadge : undefined },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'change-password', label: 'Change Password', icon: <Lock size={20} /> },
  ], [cartBadge]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (navId: NavItemId) => {
    if (navId === 'browse-parts') {
      navigate('/shop');
    } else {
      onNavChange(navId);
    }
  };

  // Get user's first name for greeting
  const firstName = user?.full_name?.split(' ')[0] || 'Customer';

  return (
    <div className="cdl-container">
      {/* Fixed Left Sidebar */}
      <aside className="cdl-sidebar">
        <div className="cdl-sidebar-header">
          <div className="cdl-logo" onClick={() => navigate('/')}>
            <Car size={28} className="cdl-logo-icon" />
            <span className="cdl-logo-text">Japan Lanka</span>
          </div>
        </div>

        <nav className="cdl-nav">
          <div className="cdl-nav-section">
            <span className="cdl-nav-section-title">Menu</span>
            <ul className="cdl-nav-list">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`cdl-nav-item ${activeNav === item.id ? 'cdl-nav-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="cdl-nav-icon">{item.icon}</span>
                    <span className="cdl-nav-label">{item.label}</span>
                    {item.badge && (
                      <span className="cdl-nav-badge">{item.badge}</span>
                    )}
                    {activeNav === item.id && (
                      <ChevronRight size={16} className="cdl-nav-arrow" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="cdl-sidebar-footer">
          <button className="cdl-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="cdl-main-wrapper">
        {/* Top Header */}
        <header className="cdl-header">
          <div className="cdl-header-content">
            <div className="cdl-header-title">
              <h1>{navItems.find(item => item.id === activeNav)?.label || 'Dashboard'}</h1>
            </div>
            <div className="cdl-header-actions">
              <button
                className="cdl-profile-btn"
                onClick={() => setShowProfile(true)}
              >
                <span className="cdl-profile-avatar">
                  {firstName.charAt(0).toUpperCase()}
                </span>
                <span className="cdl-profile-name">{firstName}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="cdl-content">
          {children}
        </main>
      </div>

      {/* Profile Modal */}
      {showProfile && user && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          user={{
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            phoneNumber: user.phone_number || '',
            is_google_user: user.is_google_user
          }}
          roleLabel="Customer"
        />
      )}
    </div>
  );
};

export default CustomerDashboardLayout;
