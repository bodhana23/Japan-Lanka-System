import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Car, LogOut, Package, Activity, FileText,
  User, ChevronRight, Search
} from 'lucide-react';
import './AuditorDashboardLayout.css';

// Navigation items for the sidebar
export type NavItemId = 'inventory-logs' | 'activity-logs' | 'reports' | 'profile';

interface NavItem {
  id: NavItemId;
  label: string;
  icon: React.ReactNode;
}

interface AuditorDashboardLayoutProps {
  children: React.ReactNode;
  activeNav: NavItemId;
  onNavChange: (navId: NavItemId) => void;
  user: {
    email: string;
    name?: string;
    full_name?: string;
    fullName?: string;
    role: string;
  };
}

const AuditorDashboardLayout: React.FC<AuditorDashboardLayoutProps> = ({
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
    { id: 'inventory-logs', label: 'Inventory Audit Logs', icon: <Package size={20} /> },
    { id: 'activity-logs', label: 'Activity Audit Logs', icon: <Activity size={20} /> },
    { id: 'reports', label: 'Download Reports', icon: <FileText size={20} /> },
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
  const displayName = user?.full_name || user?.fullName || user?.name || 'Auditor';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="adl-container">
      {/* Fixed Left Sidebar */}
      <aside className="adl-sidebar">
        <div className="adl-sidebar-header">
          <div className="adl-logo" onClick={() => navigate('/')}>
            <Car size={28} className="adl-logo-icon" />
            <span className="adl-logo-text">Japan Lanka</span>
          </div>
          <div className="adl-role-badge">Auditor Portal</div>
        </div>

        <nav className="adl-nav">
          <div className="adl-nav-section">
            <span className="adl-nav-section-title">Menu</span>
            <ul className="adl-nav-list">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`adl-nav-item ${activeNav === item.id ? 'adl-nav-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <span className="adl-nav-icon">{item.icon}</span>
                    <span className="adl-nav-label">{item.label}</span>
                    {activeNav === item.id && (
                      <ChevronRight size={16} className="adl-nav-arrow" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="adl-sidebar-footer">
          <button className="adl-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="adl-main">
        <header className="adl-header">
          <div className="adl-header-content">
            <div className="adl-greeting">
              <h1 className="adl-greeting-title">
                <Search size={24} className="adl-greeting-icon" />
                Auditor Dashboard
              </h1>
              <p className="adl-greeting-subtitle">Welcome, {firstName}! - Japan Lanka Enterprises</p>
            </div>
            <div className="adl-header-user">
              <div className="adl-user-avatar">{firstName.charAt(0).toUpperCase()}</div>
              <div className="adl-user-info">
                <span className="adl-user-name">{displayName}</span>
                <span className="adl-user-role">{user?.role || 'Auditor'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="adl-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuditorDashboardLayout;
