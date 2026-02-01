import React, { useState } from 'react';
import {
  User, Mail, Phone, Shield, Calendar, Tag, Lock,
  Edit, Save, CheckCircle, AlertCircle
} from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import './ProfileDisplay.css';

// Profile user data
export interface ProfileUser {
  email: string;
  full_name?: string;
  fullName?: string;
  name?: string;
  role: string;
  phone_number?: string;
  is_google_user?: boolean;
  created_at?: string;
}

// Field configuration for customizing which fields to show
export interface ProfileFieldConfig {
  showPhone?: boolean;
  showRole?: boolean;
  showMemberSince?: boolean;
  showAccountStatus?: boolean;
  showPassword?: boolean;
}

export interface ProfileDisplayProps {
  user: ProfileUser;
  title?: string;
  subtitle?: string;
  roleLabel?: string; // Override role display (e.g., "Administrator" instead of "admin")
  isEditable?: boolean; // Whether to allow editing
  onSave?: (data: { full_name: string; phone_number?: string }) => Promise<void>;
  onChangePassword?: () => void; // Navigate to change password
  fieldConfig?: ProfileFieldConfig;
  accentColor?: string; // Override accent color
}

const defaultFieldConfig: ProfileFieldConfig = {
  showPhone: true,
  showRole: true,
  showMemberSince: true,
  showAccountStatus: false,
  showPassword: false,
};

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({
  user,
  title = 'My Profile',
  subtitle = 'View and manage your account information',
  roleLabel,
  isEditable = false,
  onSave,
  onChangePassword,
  fieldConfig = defaultFieldConfig,
  accentColor,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Merge field config with defaults
  const config = { ...defaultFieldConfig, ...fieldConfig };

  const displayName = user.full_name || user.fullName || user.name || 'User';
  const firstName = displayName.split(' ')[0];
  const displayRole = roleLabel || user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const isGoogleUser = user.is_google_user === true;

  const [formData, setFormData] = useState({
    fullName: displayName,
    phoneNumber: user.phone_number || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters long';
    }

    if (formData.phoneNumber) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/[\s\-()]/g, ''))) {
        newErrors.phoneNumber = 'Phone number must be 10 digits starting with 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !onSave) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      await onSave({
        full_name: formData.fullName.trim(),
        phone_number: formData.phoneNumber.trim() || undefined,
      });
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || 'Error updating profile. Please try again.';
      setErrors({ form: errorDetail });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: displayName,
      phoneNumber: user.phone_number || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  // Custom style for accent color
  const accentStyle = accentColor
    ? ({ '--pd-accent-color': accentColor } as React.CSSProperties)
    : undefined;

  return (
    <div className="pd-container" style={accentStyle}>
      {/* Page Header */}
      <div className="pd-page-header">
        <div className="pd-header-info">
          <h2 className="pd-page-title">
            <User size={24} className="pd-title-icon" />
            {title}
          </h2>
          <p className="pd-page-subtitle">{subtitle}</p>
        </div>
        {isEditable && !isEditing && (
          <button className="pd-edit-btn" onClick={() => setIsEditing(true)}>
            <Edit size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="pd-success-banner">
          <CheckCircle size={20} />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errors.form && (
        <div className="pd-error-banner">
          <AlertCircle size={20} />
          <p>{errors.form}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="pd-card">
        {/* Profile Header */}
        <div className="pd-card-header">
          <div className="pd-avatar-large">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="pd-header-text">
            <h3 className="pd-name">{displayName}</h3>
            <span className="pd-role-badge">{displayRole}</span>
            {isGoogleUser && (
              <span className="pd-google-badge">
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width="14"
                />
                Google Account
              </span>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="pd-card-body">
          {!isEditing ? (
            // View Mode
            <div className="pd-view-mode">
              <div className="pd-field-group">
                {/* Full Name */}
                <div className="pd-field">
                  <div className="pd-field-icon">
                    <User size={18} />
                  </div>
                  <div className="pd-field-content">
                    <span className="pd-field-label">Full Name</span>
                    <span className="pd-field-value">{displayName}</span>
                  </div>
                </div>

                {/* Email */}
                <div className="pd-field">
                  <div className="pd-field-icon">
                    <Mail size={18} />
                  </div>
                  <div className="pd-field-content">
                    <span className="pd-field-label">Email Address</span>
                    <span className="pd-field-value">{user.email}</span>
                  </div>
                </div>

                {/* Phone */}
                {config.showPhone && (
                  <div className="pd-field">
                    <div className="pd-field-icon">
                      <Phone size={18} />
                    </div>
                    <div className="pd-field-content">
                      <span className="pd-field-label">Phone Number</span>
                      <span className="pd-field-value">
                        {user.phone_number || 'Not provided'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Role */}
                {config.showRole && (
                  <div className="pd-field">
                    <div className="pd-field-icon">
                      <Shield size={18} />
                    </div>
                    <div className="pd-field-content">
                      <span className="pd-field-label">Role</span>
                      <span className="pd-field-value pd-role-value">{displayRole}</span>
                    </div>
                  </div>
                )}

                {/* Account Status */}
                {config.showAccountStatus && (
                  <div className="pd-field">
                    <div className="pd-field-icon">
                      <Tag size={18} />
                    </div>
                    <div className="pd-field-content">
                      <span className="pd-field-label">Account Status</span>
                      <span className="pd-field-value pd-status-active">Active</span>
                    </div>
                  </div>
                )}

                {/* Member Since */}
                {config.showMemberSince && user.created_at && (
                  <div className="pd-field">
                    <div className="pd-field-icon">
                      <Calendar size={18} />
                    </div>
                    <div className="pd-field-content">
                      <span className="pd-field-label">Member Since</span>
                      <span className="pd-field-value">{formatDateTime(user.created_at)}</span>
                    </div>
                  </div>
                )}

                {/* Password (for customers only) */}
                {config.showPassword && (
                  <div className="pd-field">
                    <div className="pd-field-icon">
                      <Lock size={18} />
                    </div>
                    <div className="pd-field-content">
                      <span className="pd-field-label">Password</span>
                      <span className="pd-field-value">
                        {isGoogleUser ? 'Managed by Google' : '••••••••'}
                      </span>
                    </div>
                    {!isGoogleUser && onChangePassword && (
                      <button className="pd-change-password-link" onClick={onChangePassword}>
                        Change Password
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Edit Mode
            <form className="pd-edit-form" onSubmit={handleSubmit}>
              <div className="pd-form-group">
                <label htmlFor="fullName">
                  <User size={16} className="pd-label-icon" />
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={errors.fullName ? 'error' : ''}
                  disabled={isLoading}
                  required
                />
                {errors.fullName && <span className="pd-error-msg">{errors.fullName}</span>}
              </div>

              <div className="pd-form-group">
                <label htmlFor="email">
                  <Mail size={16} className="pd-label-icon" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={user.email}
                  disabled
                  readOnly
                />
                {isGoogleUser && (
                  <span className="pd-field-note">
                    Email is managed by Google and cannot be changed here.
                  </span>
                )}
              </div>

              {config.showPhone && (
                <div className="pd-form-group">
                  <label htmlFor="phoneNumber">
                    <Phone size={16} className="pd-label-icon" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number (e.g., 0771234567)"
                    className={errors.phoneNumber ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.phoneNumber && <span className="pd-error-msg">{errors.phoneNumber}</span>}
                </div>
              )}

              <div className="pd-form-actions">
                <button
                  type="button"
                  className="pd-cancel-btn"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="pd-save-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <span className="pd-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileDisplay;
