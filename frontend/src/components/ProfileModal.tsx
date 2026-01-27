import React, { useState } from 'react';
import { Eye, Edit, User, Mail, Phone, Tag, Lock, Key, CheckCircle, Save, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import './ProfileModal.css';

interface UserProfile {
  email: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  role: string;
  phoneNumber?: string;
  phone_number?: string;
  is_google_user?: boolean;
}

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  roleLabel?: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, roleLabel }) => {
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

  const isGoogleUser = user.is_google_user === true;

  const [formData, setFormData] = useState({
    fullName: user.fullName || user.full_name || user.name || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || user.phone_number || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const displayName = user.fullName || user.full_name || user.name || 'User';
  const displayRole = roleLabel || (user.role.charAt(0).toUpperCase() + user.role.slice(1));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters long';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/[\s\-()]/g, ''))) {
        newErrors.phoneNumber = 'Phone number must be 10 digits starting with 0';
      }
    }

    // Only validate password fields if not a Google user and trying to change password
    if (!isGoogleUser && (formData.newPassword || formData.currentPassword || formData.confirmPassword)) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }

      if (formData.newPassword) {
        if (formData.newPassword.length < 8) {
          newErrors.newPassword = 'Password must be at least 8 characters long';
        } else if (!/[a-z]/.test(formData.newPassword)) {
          newErrors.newPassword = 'Password must contain at least one lowercase letter';
        } else if (!/[A-Z]/.test(formData.newPassword)) {
          newErrors.newPassword = 'Password must contain at least one uppercase letter';
        } else if (!/\d/.test(formData.newPassword)) {
          newErrors.newPassword = 'Password must contain at least one number';
        } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(formData.newPassword)) {
          newErrors.newPassword = 'Password must contain at least one special character';
        }
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      // Update profile (name, phone)
      const profileUpdates: { full_name?: string; phone_number?: string } = {};

      if (formData.fullName.trim() !== (user.fullName || user.full_name || user.name || '')) {
        profileUpdates.full_name = formData.fullName.trim();
      }

      const currentPhone = user.phoneNumber || user.phone_number || '';
      if (formData.phoneNumber.trim() !== currentPhone) {
        profileUpdates.phone_number = formData.phoneNumber.trim() || undefined;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const updatedUser = await authApi.updateMe(profileUpdates);
        // Update localStorage with new user data
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const mergedUser = { ...storedUser, ...updatedUser };
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
      }

      // Change password if provided (only for non-Google users)
      if (!isGoogleUser && formData.currentPassword && formData.newPassword) {
        try {
          await authApi.changePassword(formData.currentPassword, formData.newPassword);
          setSuccessMessage('Profile and password updated successfully!');
        } catch (passwordError: any) {
          const errorDetail = passwordError.response?.data?.detail || 'Failed to change password';
          setErrors({ currentPassword: errorDetail });
          setIsLoading(false);
          return;
        }
      } else if (Object.keys(profileUpdates).length > 0) {
        setSuccessMessage('Profile updated successfully!');
      } else {
        setSuccessMessage('No changes to save.');
      }

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || 'Error updating profile. Please try again.';
      setErrors({ form: errorDetail });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose} disabled={isLoading}>
          ×
        </button>

        {/* Scrollable wrapper to allow content scrolling while container has overflow:hidden
            This fixes the white gap in top-right corner caused by border-radius mismatch */}
        <div className="profile-modal-scrollable">
        <div className="profile-modal-header">
          <div className="profile-modal-avatar">
            <div className="avatar-circle">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
          <h2 className="profile-modal-name">{displayName}</h2>
          <p className="profile-modal-role">{displayRole}</p>
        </div>

        <div className="profile-modal-tabs">
          <button
            className={`profile-tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
            disabled={isLoading}
          >
            <Eye size={16} className="tab-icon" />
            View Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
            disabled={isLoading}
          >
            <Edit size={16} className="tab-icon" />
            Edit Profile
          </button>
        </div>

        <div className="profile-modal-body">
          {activeTab === 'view' ? (
            <div className="profile-view-content">
              <div className="profile-field-group">
                <div className="profile-field">
                  <User size={16} className="field-icon" />
                  <div className="field-content">
                    <span className="field-label">Full Name</span>
                    <span className="field-value">{displayName}</span>
                  </div>
                </div>

                <div className="profile-field">
                  <Mail size={16} className="field-icon" />
                  <div className="field-content">
                    <span className="field-label">Email Address</span>
                    <span className="field-value">{user.email}</span>
                  </div>
                </div>

                {user.phoneNumber && (
                  <div className="profile-field">
                    <Phone size={16} className="field-icon" />
                    <div className="field-content">
                      <span className="field-label">Phone Number</span>
                      <span className="field-value">{user.phoneNumber}</span>
                    </div>
                  </div>
                )}

                <div className="profile-field">
                  <Tag size={16} className="field-icon" />
                  <div className="field-content">
                    <span className="field-label">Role</span>
                    <span className="field-value">{displayRole}</span>
                  </div>
                </div>

                {isGoogleUser ? (
                  <div className="profile-field google-auth-notice">
                    <AlertCircle size={16} className="field-icon" />
                    <div className="field-content">
                      <span className="field-label">Authentication</span>
                      <span className="field-value">Signed in with Google</span>
                    </div>
                  </div>
                ) : (
                  <div className="profile-field">
                    <Lock size={16} className="field-icon" />
                    <div className="field-content">
                      <span className="field-label">Password</span>
                      <span className="field-value">••••••••</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-edit-form">
              {successMessage && (
                <div className="success-message">
                  <CheckCircle size={16} />
                  {successMessage}
                </div>
              )}
              {errors.form && (
                <div className="error-banner">
                  <AlertCircle size={16} />
                  {errors.form}
                </div>
              )}
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>

                <div className="form-group">
                  <label htmlFor="fullName">
                    <User size={16} className="label-icon" />
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
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <Mail size={16} className="label-icon" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    className={errors.email ? 'error' : ''}
                    disabled={isLoading}
                    required
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phoneNumber">
                    <Phone size={16} className="label-icon" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    className={errors.phoneNumber ? 'error' : ''}
                    disabled={isLoading}
                  />
                  {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                </div>
              </div>

              {isGoogleUser ? (
                <div className="form-section google-auth-section">
                  <h3 className="section-title">Password</h3>
                  <div className="google-auth-info">
                    <AlertCircle size={20} />
                    <div>
                      <p>You signed in with Google.</p>
                      <p>To change your password, please visit your <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer">Google Account settings</a>.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="form-section">
                  <h3 className="section-title">Change Password</h3>
                  <p className="section-description">Leave blank if you don't want to change your password</p>

                  <div className="form-group">
                    <label htmlFor="currentPassword">
                      <Lock size={16} className="label-icon" />
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                      className={errors.currentPassword ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">
                      <Key size={16} className="label-icon" />
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Enter new password (min 8 characters)"
                      className={errors.newPassword ? 'error' : ''}
                      disabled={isLoading}
                      minLength={8}
                    />
                    {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      <CheckCircle size={16} className="label-icon" />
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your new password"
                      className={errors.confirmPassword ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>
                </div>
              )}

              <div className="profile-modal-actions">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-cancel"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn-save ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="btn-icon" />
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
    </div>
  );
};

export default ProfileModal;
