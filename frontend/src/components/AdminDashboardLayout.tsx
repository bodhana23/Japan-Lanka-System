import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car, LogOut, LayoutDashboard, Users, AlertTriangle,
  BarChart2, User, ChevronRight, Shield
} from 'lucide-react';
import './AdminDashboardLayout.css';

// Navigation items for the sidebar
export type AdminNavItemId = 'overview' | 'users' | 'low-stock' | 'analytics' | 'profile';

interface NavItem {
  id: AdminNavItemId;
  label: string;
  icon: React.ReactNode;
}

interface AdminDashboardLayoutProps {
  children: React.ReactNode;
  activeNav: AdminNavItemId;
  onNavChange: (navId: AdminNavItemId) => void;
  user: {
    email: string;
    name?: string;
    full_name?: string;
    fullName?: string;
    role: string;
  };
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  children,
  activeNav,
  onNavChange,
  user: userProp,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const user = userProp;

  // Navigation items
  const navItems: NavItem[] = useMemo(() => [
    { id: 'overview', label: 'Dashboard Overview', icon: <LayoutDashboard size={20} /> },
    { id: 'users', label: 'Manage Users', icon: <Users size={20} /> },
    { id: 'low-stock', label: 'Low Stock Alerts', icon: <AlertTriangle size={20} /> },
    { id: 'analytics', label: 'Financial Analytics', icon: <BarChart2 size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ], []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (navId: AdminNavItemId) => {
    onNavChange(navId);
  };

  // Get user's first name for greeting
  const displayName = user?.full_name || user?.fullName || user?.name || 'Admin';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="adml-container">
      {/* Fixed Left Sidebar */}
      <aside className="adml-sidebar">
        <div className="adml-sidebar-header">
          <div className="adml-logo" onClick={() => navigate('/')}>
            <Car size={28} className="adml-logo-icon" />
            <span className="adml-logo-text">Japan Lanka</span>
          </div>
          <div className="adml-role-badge">
            <Shield size={14} />
            Admin Portal
          </div>
        </div>

        <nav className="adml-nav">
          <div className="adml-nav-section">
            <span className="adml-nav-section-title">Menu</span>
            <ul className="adml-nav-list">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`adml-nav-item ${activeNav === item.id ? 'adml-nav-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="adml-nav-icon">{item.icon}</span>
                    <span className="adml-nav-label">{item.label}</span>
                    {activeNav === item.id && (
                      <ChevronRight size={16} className="adml-nav-arrow" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="adml-sidebar-footer">
          <button className="adml-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="adml-main">
        <header className="adml-header">
          <div className="adml-header-content">
            <div className="adml-greeting">
              <h1 className="adml-greeting-title">
                <Shield size={24} className="adml-greeting-icon" />
                Admin Dashboard
              </h1>
              <p className="adml-greeting-subtitle">Welcome, {firstName}! - Japan Lanka Enterprises</p>
            </div>
            <div className="adml-header-user">
              <div className="adml-user-avatar">{firstName.charAt(0).toUpperCase()}</div>
              <div className="adml-user-info">
                <span className="adml-user-name">{displayName}</span>
                <span className="adml-user-role">{user?.role || 'Admin'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="adml-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardLayout;
