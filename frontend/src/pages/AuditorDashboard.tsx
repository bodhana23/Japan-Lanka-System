import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuditorDashboardLayout, { NavItemId } from '../components/AuditorDashboardLayout';
import DashboardInventoryLogs from '../components/auditor/DashboardInventoryLogs';
import DashboardActivityLogs from '../components/auditor/DashboardActivityLogs';
import DashboardReports from '../components/auditor/DashboardReports';
import DashboardProfile from '../components/auditor/DashboardProfile';
import './AuditorDashboard.css';

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
  const [activeNav, setActiveNav] = useState<NavItemId>('inventory-logs');
  const [user, setUser] = useState<UserProfile | null>(null);

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

  const handleNavChange = (navId: NavItemId) => {
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
    <AuditorDashboardLayout
      activeNav={activeNav}
      onNavChange={handleNavChange}
      user={user}
    >
      {renderContent()}
    </AuditorDashboardLayout>
  );
};

export default AuditorDashboard;
