import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig, DashboardUser } from '../components/shared';
import DashboardInventoryLogs from '../components/auditor/DashboardInventoryLogs';
import DashboardActivityLogs from '../components/auditor/DashboardActivityLogs';
import DashboardReports from '../components/auditor/DashboardReports';
import DashboardProfile from '../components/auditor/DashboardProfile';
import { Package, Activity, FileText, User, Search } from 'lucide-react';
import './AuditorDashboard.css';

// Navigation item IDs for Auditor Dashboard
type AuditorNavId = 'inventory-logs' | 'activity-logs' | 'reports' | 'profile';

interface UserProfile {
  email: string;
  name: string;
  fullName?: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const [activeNav, setActiveNav] = useState<AuditorNavId>('inventory-logs');
  const [user, setUser] = useState<UserProfile | null>(null);

  // Navigation items for Auditor Dashboard
  const navItems: NavItem<AuditorNavId>[] = useMemo(() => [
    { id: 'inventory-logs', label: 'Inventory Audit Logs', icon: <Package size={20} /> },
    { id: 'activity-logs', label: 'Activity Audit Logs', icon: <Activity size={20} /> },
    { id: 'reports', label: 'Download Reports', icon: <FileText size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ], []);

  // Role configuration for Auditor (teal accent)
  const roleConfig: RoleConfig = useMemo(() => ({
    role: 'auditor',
    ...roleConfigs.auditor,
    portalIcon: <Search size={14} />,
  }), []);

  // Dashboard user for layout
  const dashboardUser: DashboardUser | undefined = useMemo(() => {
    if (authUser) {
      return {
        email: authUser.email,
        full_name: authUser.full_name,
        role: authUser.role,
      };
    }
    if (user) {
      return {
        email: user.email,
        full_name: user.full_name || user.fullName || user.name,
        role: user.role,
      };
    }
    return undefined;
  }, [authUser, user]);

  // Sync activeNav from URL ?section= param (e.g. from notification click)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section') as AuditorNavId | null;
    if (sectionParam && ['inventory-logs', 'activity-logs', 'reports', 'profile'].includes(sectionParam)) {
      setActiveNav(sectionParam);
    }
  }, [location.search]);

  // Check authentication on mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (!userData || userData.role !== 'auditor') {
          navigate('/');
          return;
        }

        setUser({
          email: userData.email,
          name: userData.name || userData.fullName || userData.full_name || 'Auditor User',
          fullName: userData.fullName || userData.full_name || userData.name || 'Auditor User',
          full_name: userData.full_name || userData.fullName || userData.name || 'Auditor User',
          role: userData.role,
          created_at: userData.created_at
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleNavChange = (navId: AuditorNavId) => {
    setActiveNav(navId);
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'inventory-logs':
        return <DashboardInventoryLogs />;
      case 'activity-logs':
        return <DashboardActivityLogs />;
      case 'reports':
        return <DashboardReports />;
      case 'profile':
        return user ? <DashboardProfile user={user} /> : null;
      default:
        return <DashboardInventoryLogs />;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout<AuditorNavId>
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={handleNavChange}
      roleConfig={roleConfig}
      user={dashboardUser}
      onProfileClick={() => handleNavChange('profile')}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default AuditorDashboard;
