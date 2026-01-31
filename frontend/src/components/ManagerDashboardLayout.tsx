import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car, LogOut, Package, ClipboardList, RotateCcw,
  User, ChevronRight
} from 'lucide-react';
import './ManagerDashboardLayout.css';

// Navigation items for the sidebar
export type NavItemId = 'inventory' | 'orders' | 'returns' | 'profile';

interface NavItem {
  id: NavItemId;
  label: string;
  icon: React.ReactNode;
}

interface ManagerDashboardLayoutProps {
  children: React.ReactNode;
  activeNav: NavItemId;
  onNavChange: (navId: NavItemId) => void;
  user: {
    email: string;
    name?: string;
    full_name?: string;
    role: string;
    phone_number?: string;
    is_google_user?: boolean;
  };
}

const ManagerDashboardLayout: React.FC<ManagerDashboardLayoutProps> = ({
  children,
  activeNav,
  onNavChange,
  user: userProp,
}) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Use passed user prop instead of AuthContext user
  const user = userProp;

  // Navigation items
  const navItems: NavItem[] = useMemo(() => [
    { id: 'inventory', label: 'Inventory Management', icon: <Package size={20} /> },
    { id: 'orders', label: 'Order Management', icon: <ClipboardList size={20} /> },
    { id: 'returns', label: 'Return Requests', icon: <RotateCcw size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ], []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavClick = (navId: NavItemId) => {
    onNavChange(navId);
  };

  // Get user's first name for greeting
  const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Manager';

  return (
    <div className="mdl-container">
      {/* Fixed Left Sidebar */}
      <aside className="mdl-sidebar">
        <div className="mdl-sidebar-header">
          <div className="mdl-logo" onClick={() => navigate('/')}>
            <Car size={28} className="mdl-logo-icon" />
            <span className="mdl-logo-text">Japan Lanka</span>
          </div>
          <div className="mdl-role-badge">Manager Portal</div>
        </div>

        <nav className="mdl-nav">
          <div className="mdl-nav-section">
            <span className="mdl-nav-section-title">Menu</span>
            <ul className="mdl-nav-list">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`mdl-nav-item ${activeNav === item.id ? 'mdl-nav-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="mdl-nav-icon">{item.icon}</span>
                    <span className="mdl-nav-label">{item.label}</span>
                    {activeNav === item.id && (
                      <ChevronRight size={16} className="mdl-nav-arrow" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="mdl-sidebar-footer">
          <button className="mdl-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="mdl-main">
        <header className="mdl-header">
          <div className="mdl-header-content">
            <div className="mdl-greeting">
              <h1 className="mdl-greeting-title">Welcome, {firstName}!</h1>
              <p className="mdl-greeting-subtitle">Japan Lanka Enterprises - Manager Portal</p>
            </div>
            <div className="mdl-header-user">
              <div className="mdl-user-avatar">{firstName.charAt(0).toUpperCase()}</div>
              <div className="mdl-user-info">
                <span className="mdl-user-name">{user?.full_name || user?.name || 'Manager'}</span>
                <span className="mdl-user-role">{user?.role || 'Manager'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="mdl-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboardLayout;
