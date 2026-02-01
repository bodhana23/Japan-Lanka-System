import React from 'react';
import { ProfileDisplay } from '../shared';
import type { ProfileUser } from '../shared';
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
}

const DashboardProfile: React.FC<DashboardProfileProps> = ({
  user,
  onEditProfile,
}) => {
  // Convert to ProfileUser format
  const profileUser: ProfileUser = {
    email: user.email,
    full_name: user.fullName || user.name,
    role: user.role,
  };

  return (
    <ProfileDisplay
      user={profileUser}
      title="Profile Information"
      subtitle="View and manage your account details"
      roleLabel="Administrator"
      isEditable={false}
      fieldConfig={{
        showPhone: false,
        showRole: true,
        showMemberSince: false,
        showAccountStatus: true,
        showPassword: false,
      }}
    />
  );
};

export default DashboardProfile;
