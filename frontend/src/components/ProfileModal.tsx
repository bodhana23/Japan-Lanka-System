import React, { useState } from 'react';
import './ProfileModal.css';

interface UserProfile {
  email: string;
  fullName?: string;
  name?: string;
  role: string;
  phoneNumber?: string;
  password?: string;
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

  const [formData, setFormData] = useState({
    fullName: user.fullName || user.name || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const displayName = user.fullName || user.name || 'User';
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
      const phoneRegex = /^[+]?[0-9\s\-()]{10,15}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    }

    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      } else if (formData.currentPassword !== user.password) {
        // Verify current password matches stored password
        newErrors.currentPassword = 'Current password is incorrect';
      }

      if (formData.newPassword && formData.newPassword.length < 6) {
        newErrors.newPassword = 'New password must be at least 6 characters long';
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
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser: any = {
        ...user,
        fullName: formData.fullName.trim(),
        name: formData.fullName.trim(),
        email: formData.email.trim()
      };

      if (formData.phoneNumber) {
        updatedUser.phoneNumber = formData.phoneNumber.trim();
      }

      if (formData.newPassword) {
        updatedUser.password = formData.newPassword;
      }

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      alert('Profile updated successfully!');

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
      }, 500);
    } catch (error) {
      alert('Error updating profile. Please try again.');
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
            <span className="tab-icon">👁️</span>
            View Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
            disabled={isLoading}
          >
            <span className="tab-icon">✏️</span>
            Edit Profile
          </button>
        </div>

        <div className="profile-modal-body">
          {activeTab === 'view' ? (
            <div className="profile-view-content">
              <div className="profile-field-group">
                <div className="profile-field">
                  <span className="field-icon">👤</span>
                  <div className="field-content">
                    <span className="field-label">Full Name</span>
                    <span className="field-value">{displayName}</span>
                  </div>
                </div>

                <div className="profile-field">
                  <span className="field-icon">📧</span>
                  <div className="field-content">
                    <span className="field-label">Email Address</span>
                    <span className="field-value">{user.email}</span>
                  </div>
                </div>

                {user.phoneNumber && (
                  <div className="profile-field">
                    <span className="field-icon">📱</span>
                    <div className="field-content">
                      <span className="field-label">Phone Number</span>
                      <span className="field-value">{user.phoneNumber}</span>
                    </div>
                  </div>
                )}

                <div className="profile-field">
                  <span className="field-icon">🏷️</span>
                  <div className="field-content">
                    <span className="field-label">Role</span>
                    <span className="field-value">{displayRole}</span>
                  </div>
                </div>

                <div className="profile-field">
                  <span className="field-icon">🔐</span>
                  <div className="field-content">
                    <span className="field-label">Password</span>
                    <span className="field-value">••••••••</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="profile-edit-form">
              <div className="form-section">
                <h3 className="section-title">Personal Information</h3>

                <div className="form-group">
                  <label htmlFor="fullName">
                    <span className="label-icon">👤</span>
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
                    <span className="label-icon">📧</span>
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
                    <span className="label-icon">📱</span>
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

              <div className="form-section">
                <h3 className="section-title">Change Password</h3>
                <p className="section-description">Leave blank if you don't want to change your password</p>

                <div className="form-group">
                  <label htmlFor="currentPassword">
                    <span className="label-icon">🔐</span>
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
                    <span className="label-icon">🔑</span>
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter new password (min 6 characters)"
                    className={errors.newPassword ? 'error' : ''}
                    disabled={isLoading}
                    minLength={6}
                  />
                  {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <span className="label-icon">✅</span>
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
                      <span className="btn-icon">💾</span>
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

export default ProfileModal;
