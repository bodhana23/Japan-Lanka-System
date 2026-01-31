import React from 'react';
import { User, Mail, Shield, Calendar } from 'lucide-react';
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
  const displayName = user?.fullName || user?.name || 'Admin';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-header">
        <h2 className="admin-profile-title">
          <User size={24} className="admin-profile-icon" />
          Profile Information
        </h2>
        <p className="admin-profile-subtitle">View and manage your account details</p>
      </div>

      <div className="admin-profile-card">
        <div className="admin-profile-card-header">
          <div className="admin-profile-avatar-large">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="admin-profile-summary">
            <h3>{displayName}</h3>
            <span className="admin-profile-role-badge">
              <Shield size={14} />
              Administrator
            </span>
            <p className="admin-profile-email">{user.email}</p>
          </div>
        </div>

        <div className="admin-profile-details">
          <div className="admin-profile-detail-grid">
            <div className="admin-profile-detail-item">
              <div className="admin-profile-detail-icon">
                <User size={20} />
              </div>
              <div className="admin-profile-detail-content">
                <span className="admin-profile-detail-label">Full Name</span>
                <span className="admin-profile-detail-value">{displayName}</span>
              </div>
            </div>

            <div className="admin-profile-detail-item">
              <div className="admin-profile-detail-icon">
                <Mail size={20} />
              </div>
              <div className="admin-profile-detail-content">
                <span className="admin-profile-detail-label">Email Address</span>
                <span className="admin-profile-detail-value">{user.email}</span>
              </div>
            </div>

            <div className="admin-profile-detail-item">
              <div className="admin-profile-detail-icon">
                <Shield size={20} />
              </div>
              <div className="admin-profile-detail-content">
                <span className="admin-profile-detail-label">Role</span>
                <span className="admin-profile-detail-value">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              </div>
            </div>

            <div className="admin-profile-detail-item">
              <div className="admin-profile-detail-icon">
                <Calendar size={20} />
              </div>
              <div className="admin-profile-detail-content">
                <span className="admin-profile-detail-label">Account Status</span>
                <span className="admin-profile-detail-value admin-status-active">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-profile-actions">
          <button className="admin-edit-profile-btn" onClick={onEditProfile}>
            <User size={16} />
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfile;
