import React from 'react';
import { ProfileDisplay } from '../shared';
import type { ProfileUser } from '../shared';

interface DashboardProfileProps {
  user: {
    email: string;
    name?: string;
    full_name?: string;
    role: string;
    phone_number?: string;
    created_at?: string;
  };
}

export const DashboardProfile: React.FC<DashboardProfileProps> = ({ user }) => {
  // Convert to ProfileUser format
  const profileUser: ProfileUser = {
    email: user.email,
    full_name: user.full_name || user.name,
    role: user.role,
    phone_number: user.phone_number,
    created_at: user.created_at,
  };

  return (
    <ProfileDisplay
      user={profileUser}
      title="My Profile"
      subtitle="View your account information"
      roleLabel="Manager"
      isEditable={false}
      fieldConfig={{
        showPhone: true,
        showRole: true,
        showMemberSince: true,
        showAccountStatus: false,
        showPassword: false,
      }}
    />
  );
};
