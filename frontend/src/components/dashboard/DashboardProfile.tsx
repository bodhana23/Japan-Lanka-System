import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { ProfileDisplay } from '../shared';
import type { ProfileUser } from '../shared';

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardProfileProps {
  onNavigate: (section: NavItemId) => void;
}

const DashboardProfile: React.FC<DashboardProfileProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  // Convert auth user to ProfileUser format
  const profileUser: ProfileUser = {
    email: user?.email || '',
    full_name: user?.full_name || '',
    role: 'customer',
    phone_number: user?.phone_number || '',
    address: user?.address || '',
    is_google_user: user?.is_google_user,
  };

  // Handle save profile
  const handleSave = async (data: { full_name: string; phone_number?: string; address?: string }) => {
    const updatedUser = await authApi.updateMe(data);
    // Update localStorage with new user data
    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const mergedUser = { ...storedUser, ...updatedUser };
    localStorage.setItem('currentUser', JSON.stringify(mergedUser));
    // Reload to refresh auth context
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <ProfileDisplay
      user={profileUser}
      title="My Profile"
      subtitle="View and manage your account information"
      roleLabel="Customer"
      isEditable={true}
      onSave={handleSave}
      onChangePassword={() => onNavigate('change-password')}
      fieldConfig={{
        showPhone: true,
        showRole: true,
        showMemberSince: false,
        showAccountStatus: false,
        showPassword: true,
      }}
    />
  );
};

export default DashboardProfile;
