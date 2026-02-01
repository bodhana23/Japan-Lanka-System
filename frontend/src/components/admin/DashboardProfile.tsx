import React from 'react';
import { ProfileDisplay } from '../shared';
import type { ProfileUser } from '../shared';
import { employeeAuthApi } from '../../services/api';
import './DashboardProfile.css';

interface UserProfile {
  email: string;
  name?: string;
  fullName?: string;
  role: string;
}

interface DashboardProfileProps {
  user: UserProfile;
  onEditProfile: () => void;
  onChangePassword: () => void;
}

const DashboardProfile: React.FC<DashboardProfileProps> = ({
  user,
  onEditProfile,
  onChangePassword,
}) => {
  // Convert to ProfileUser format
  const profileUser: ProfileUser = {
    email: user.email,
    full_name: user.fullName || user.name,
    role: user.role,
  };

  // Handle save profile
  const handleSave = async (data: { full_name: string; phone_number?: string }) => {
    const updatedUser = await employeeAuthApi.updateProfile({ full_name: data.full_name });
    // Update localStorage with new user data
    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const mergedUser = { ...storedUser, full_name: updatedUser.full_name, fullName: updatedUser.full_name };
    localStorage.setItem('currentUser', JSON.stringify(mergedUser));
    // Reload to refresh auth context
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <ProfileDisplay
      user={profileUser}
      title="Profile Information"
      subtitle="View and manage your account details"
      roleLabel="Administrator"
      isEditable={true}
      onSave={handleSave}
      onChangePassword={onChangePassword}
      fieldConfig={{
        showPhone: false,
        showRole: true,
        showMemberSince: false,
        showAccountStatus: true,
        showPassword: true,
      }}
      accentColor="#28a745"
    />
  );
};

export default DashboardProfile;
