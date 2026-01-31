import React from 'react';
import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

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
  const displayName = user.full_name || user.name || 'Manager';
  const firstName = displayName.split(' ')[0];

  return (
    <div className="profile-section">
      <div className="section-header">
        <h2>My Profile</h2>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-large">
            {firstName.charAt(0).toUpperCase()}
          </div>

          <div className="profile-details">
            <div className="profile-detail-item">
              <div className="profile-detail-icon">
                <User size={20} />
              </div>
              <div className="profile-detail-content">
                <span className="profile-detail-label">Full Name</span>
                <span className="profile-detail-value">{displayName}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="profile-detail-icon">
                <Mail size={20} />
              </div>
              <div className="profile-detail-content">
                <span className="profile-detail-label">Email Address</span>
                <span className="profile-detail-value">{user.email}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="profile-detail-icon">
                <Phone size={20} />
              </div>
              <div className="profile-detail-content">
                <span className="profile-detail-label">Phone Number</span>
                <span className="profile-detail-value">{user.phone_number || 'Not provided'}</span>
              </div>
            </div>

            <div className="profile-detail-item">
              <div className="profile-detail-icon">
                <Shield size={20} />
              </div>
              <div className="profile-detail-content">
                <span className="profile-detail-label">Role</span>
                <span className="profile-detail-value role-badge">{user.role}</span>
              </div>
            </div>

            {user.created_at && (
              <div className="profile-detail-item">
                <div className="profile-detail-icon">
                  <Calendar size={20} />
                </div>
                <div className="profile-detail-content">
                  <span className="profile-detail-label">Member Since</span>
                  <span className="profile-detail-value">{formatDateTime(user.created_at)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
