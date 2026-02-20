import React, { useState } from 'react';
import { employeeAuthApi } from '../../services/api';
import { Lock, Key, CheckCircle, Eye, EyeOff, Shield } from 'lucide-react';
import './DashboardChangePassword.css';

type AdminNavId = 'users' | 'low-stock' | 'analytics' | 'order-pipeline' | 'profile' | 'change-password';

interface DashboardChangePasswordProps {
  onNavigate: (section: AdminNavId) => void;
}

const DashboardChangePassword: React.FC<DashboardChangePasswordProps> = ({ onNavigate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
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

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
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
      await employeeAuthApi.changePassword(formData.currentPassword, formData.newPassword);
      setSuccessMessage('Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const errorDetail = error.response?.data?.detail || 'Failed to change password. Please try again.';
      setErrors({ currentPassword: errorDetail });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-dpass-container">
      {/* Page Header */}
      <div className="admin-dpass-page-header">
        <div className="admin-dpass-header-info">
          <h2 className="admin-dpass-page-title">
            <Lock size={24} className="admin-dpass-title-icon" />
            Change Password
          </h2>
          <p className="admin-dpass-page-subtitle">Update your administrator account password</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="admin-dpass-success-banner">
          <CheckCircle size={20} />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Password Form Card */}
      <div className="admin-dpass-card">
        <div className="admin-dpass-card-header">
          <Shield size={32} className="admin-dpass-shield-icon" />
          <div>
            <h3>Security Settings</h3>
            <p>Choose a strong password to protect your administrator account</p>
          </div>
        </div>

        <form className="admin-dpass-form" onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="admin-dpass-form-group">
            <label htmlFor="currentPassword">
              <Lock size={16} className="admin-dpass-label-icon" />
              Current Password
            </label>
            <div className="admin-dpass-input-wrapper">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                className={errors.currentPassword ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                className="admin-dpass-toggle-btn"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && <span className="admin-dpass-error-msg">{errors.currentPassword}</span>}
          </div>

          {/* New Password */}
          <div className="admin-dpass-form-group">
            <label htmlFor="newPassword">
              <Key size={16} className="admin-dpass-label-icon" />
              New Password
            </label>
            <div className="admin-dpass-input-wrapper">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                className={errors.newPassword ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                className="admin-dpass-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <span className="admin-dpass-error-msg">{errors.newPassword}</span>}
          </div>

          {/* Password Requirements */}
          <div className="admin-dpass-requirements">
            <span className="admin-dpass-req-title">Password must contain:</span>
            <ul>
              <li className={formData.newPassword.length >= 8 ? 'valid' : ''}>
                At least 8 characters
              </li>
              <li className={/[A-Z]/.test(formData.newPassword) ? 'valid' : ''}>
                One uppercase letter
              </li>
              <li className={/[a-z]/.test(formData.newPassword) ? 'valid' : ''}>
                One lowercase letter
              </li>
              <li className={/\d/.test(formData.newPassword) ? 'valid' : ''}>
                One number
              </li>
              <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(formData.newPassword) ? 'valid' : ''}>
                One special character
              </li>
            </ul>
          </div>

          {/* Confirm Password */}
          <div className="admin-dpass-form-group">
            <label htmlFor="confirmPassword">
              <CheckCircle size={16} className="admin-dpass-label-icon" />
              Confirm New Password
            </label>
            <div className="admin-dpass-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
              />
              <button
                type="button"
                className="admin-dpass-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="admin-dpass-error-msg">{errors.confirmPassword}</span>}
          </div>

          {/* Form Actions */}
          <div className="admin-dpass-form-actions">
            <button
              type="button"
              className="admin-dpass-cancel-btn"
              onClick={() => onNavigate('profile')}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-dpass-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="admin-dpass-spinner"></span>
                  Changing...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DashboardChangePassword;
