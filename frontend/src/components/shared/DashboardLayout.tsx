import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Car, LogOut, ChevronRight, LucideIcon } from 'lucide-react';
import ProfileModal from '../ProfileModal';
import './DashboardLayout.css';

// Generic navigation item type
export interface NavItem<T extends string = string> {
  id: T;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick?: () => void; // Custom click handler (e.g., for external navigation)
}

// Role configuration for theming
export type DashboardRole = 'customer' | 'manager' | 'admin' | 'auditor';

export interface RoleConfig {
  role: DashboardRole;
  portalLabel: string;
  portalIcon?: React.ReactNode;
  accentColor?: string; // Override accent color (default: primary green)
  showProfileModal?: boolean; // Whether to show profile modal on avatar click
  collapsibleSidebar?: boolean; // Whether sidebar collapses to icons on mobile
  headerStyle?: 'title-only' | 'greeting'; // Header display style
}

// User type for the layout
export interface DashboardUser {
  email: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  role: string;
  phone_number?: string;
  is_google_user?: boolean;
}

export interface DashboardLayoutProps<T extends string = string> {
  children: React.ReactNode;
  navItems: NavItem<T>[];
  activeNav: T;
  onNavChange: (navId: T) => void;
  roleConfig: RoleConfig;
  user?: DashboardUser; // If not provided, uses AuthContext
  pageTitle?: string; // Override the page title (defaults to active nav label)
}

// Default role configurations
export const roleConfigs: Record<DashboardRole, Omit<RoleConfig, 'role'>> = {
  customer: {
    portalLabel: 'Customer Portal',
    showProfileModal: true,
    collapsibleSidebar: true,
    headerStyle: 'title-only',
  },
  manager: {
    portalLabel: 'Manager Portal',
    showProfileModal: false,
    collapsibleSidebar: false,
    headerStyle: 'greeting',
  },
  admin: {
    portalLabel: 'Admin Portal',
    showProfileModal: false,
    collapsibleSidebar: false,
    headerStyle: 'greeting',
  },
  auditor: {
    portalLabel: 'Auditor Portal',
    showProfileModal: false,
    collapsibleSidebar: false,
    headerStyle: 'greeting',
    accentColor: '#00b894', // Teal accent for auditor
  },
};

function DashboardLayout<T extends string = string>({
  children,
  navItems,
  activeNav,
  onNavChange,
  roleConfig,
  user: userProp,
  pageTitle,
}: DashboardLayoutProps<T>) {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Use provided user or fall back to auth context
  const user = userProp || authUser;

  // Get display name
  const displayName = user?.full_name || user?.fullName || user?.name || 'User';
  const firstName = displayName.split(' ')[0];

  // Get current page title
  const currentTitle = pageTitle || navItems.find(item => item.id === activeNav)?.label || 'Dashboard';

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle navigation click
  const handleNavClick = (item: NavItem<T>) => {
    if (item.onClick) {
      item.onClick();
    } else {
      onNavChange(item.id);
    }
  };

  // Handle profile click
  const handleProfileClick = () => {
    if (roleConfig.showProfileModal) {
      setShowProfileModal(true);
    }
  };

  // CSS class for role-specific theming
  const roleClass = `dl--${roleConfig.role}`;
  const collapsibleClass = roleConfig.collapsibleSidebar ? 'dl--collapsible' : '';

  return (
    <div className={`dl-container ${roleClass} ${collapsibleClass}`}>
      {/* Fixed Left Sidebar */}
      <aside className="dl-sidebar">
        <div className="dl-sidebar-header">
          <div className="dl-logo" onClick={() => navigate('/')} role="button" tabIndex={0}>
            <Car size={28} className="dl-logo-icon" />
            <span className="dl-logo-text">Japan Lanka</span>
          </div>
          <div className="dl-role-badge">
            {roleConfig.portalIcon}
            {roleConfig.portalLabel}
          </div>
        </div>

        <nav className="dl-nav">
          <div className="dl-nav-section">
            <span className="dl-nav-section-title">Menu</span>
            <ul className="dl-nav-list">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    className={`dl-nav-item ${activeNav === item.id ? 'dl-nav-active' : ''}`}
                    onClick={() => handleNavClick(item)}
                  >
                    <span className="dl-nav-icon">{item.icon}</span>
                    <span className="dl-nav-label">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="dl-nav-badge">{item.badge}</span>
                    )}
                    {activeNav === item.id && (
                      <ChevronRight size={16} className="dl-nav-arrow" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="dl-sidebar-footer">
          <button className="dl-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dl-main-wrapper">
        {/* Header */}
        <header className="dl-header">
          <div className="dl-header-content">
            {roleConfig.headerStyle === 'title-only' ? (
              // Title-only header (Customer style)
              <>
                <div className="dl-header-title">
                  <h1>{currentTitle}</h1>
                </div>
                <div className="dl-header-actions">
                  <button
                    className="dl-profile-btn"
                    onClick={handleProfileClick}
                    aria-label="View profile"
                  >
                    <span className="dl-profile-avatar">
                      {firstName.charAt(0).toUpperCase()}
                    </span>
                    <span className="dl-profile-name">{firstName}</span>
                  </button>
                </div>
              </>
            ) : (
              // Greeting header (Manager/Admin/Auditor style)
              <>
                <div className="dl-greeting">
                  <h1 className="dl-greeting-title">
                    {roleConfig.portalIcon}
                    {roleConfig.role === 'manager' ? `Welcome, ${firstName}!` : `${roleConfig.role.charAt(0).toUpperCase() + roleConfig.role.slice(1)} Dashboard`}
                  </h1>
                  <p className="dl-greeting-subtitle">
                    {roleConfig.role === 'manager'
                      ? 'Japan Lanka Enterprises - Manager Portal'
                      : `Welcome, ${firstName}! - Japan Lanka Enterprises`
                    }
                  </p>
                </div>
                <div className="dl-header-user">
                  <div className="dl-user-avatar">{firstName.charAt(0).toUpperCase()}</div>
                  <div className="dl-user-info">
                    <span className="dl-user-name">{displayName}</span>
                    <span className="dl-user-role">{user?.role || roleConfig.role}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="dl-content">
          {children}
        </main>
      </div>

      {/* Profile Modal (for Customer) */}
      {showProfileModal && user && roleConfig.showProfileModal && (
        <ProfileModal
          onClose={() => setShowProfileModal(false)}
          user={{
            email: user.email,
            fullName: user.full_name || user.fullName || user.name || '',
            role: user.role,
            phoneNumber: user.phone_number || '',
            is_google_user: user.is_google_user,
          }}
          roleLabel={roleConfig.role.charAt(0).toUpperCase() + roleConfig.role.slice(1)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
