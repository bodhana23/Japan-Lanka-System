import React from 'react';
import { ProfileDisplay } from '../shared';
import type { ProfileUser } from '../shared';
import './DashboardProfile.css';

interface DashboardProfileProps {
  user: {
    email: string;
    name?: string;
    full_name?: string;
    fullName?: string;
    role: string;
    created_at?: string;
  };
}

const DashboardProfile: React.FC<DashboardProfileProps> = ({ user }) => {
  // Convert to ProfileUser format
  const profileUser: ProfileUser = {
    email: user.email,
    full_name: user.full_name || user.fullName || user.name,
    role: user.role,
    created_at: user.created_at,
  };

  return (
    <ProfileDisplay
      user={profileUser}
      title="My Profile"
      subtitle="View and manage your auditor profile information"
      roleLabel="Auditor"
      isEditable={false}
      fieldConfig={{
        showPhone: false,
        showRole: true,
        showMemberSince: true,
        showAccountStatus: false,
        showPassword: false,
      }}
      accentColor="#00b894" // Teal accent for auditor
    />
  );
};

export default DashboardProfile;
