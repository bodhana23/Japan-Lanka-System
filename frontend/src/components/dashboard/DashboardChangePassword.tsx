import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { Lock, Key, CheckCircle, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import './DashboardChangePassword.css';

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardChangePasswordProps {
  onNavigate: (section: NavItemId) => void;
}

const DashboardChangePassword: React.FC<DashboardChangePasswordProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isGoogleUser = user?.is_google_user === true;

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
      await authApi.changePassword(formData.currentPassword, formData.newPassword);
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

  // If Google user, show message
  if (isGoogleUser) {
    return (
      <div className="dpass-container">
        <div className="dpass-page-header">
          <div className="dpass-header-info">
            <h2 className="dpass-page-title">
              <Lock size={24} className="dpass-title-icon" />
              Change Password
            </h2>
            <p className="dpass-page-subtitle">Update your account password</p>
          </div>
        </div>

        <div className="dpass-google-notice">
          <div className="dpass-google-icon">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="48" />
          </div>
          <h3>Google Account</h3>
          <p>You signed in with Google. To change your password, please visit your Google Account settings.</p>
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="dpass-google-link"
          >
            Go to Google Account Security
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="dpass-container">
      {/* Page Header */}
      <div className="dpass-page-header">
        <div className="dpass-header-info">
          <h2 className="dpass-page-title">
            <Lock size={24} className="dpass-title-icon" />
            Change Password
          </h2>
          <p className="dpass-page-subtitle">Update your account password</p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="dpass-success-banner">
          <CheckCircle size={20} />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Password Form Card */}
      <div className="dpass-card">
        <div className="dpass-card-header">
          <Shield size={32} className="dpass-shield-icon" />
          <div>
            <h3>Security Settings</h3>
            <p>Choose a strong password to protect your account</p>
          </div>
        </div>

        <form className="dpass-form" onSubmit={handleSubmit}>
          {/* Current Password */}
          <div className="dpass-form-group">
            <label htmlFor="currentPassword">
              <Lock size={16} className="dpass-label-icon" />
              Current Password
            </label>
            <div className="dpass-input-wrapper">
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
                className="dpass-toggle-btn"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && <span className="dpass-error-msg">{errors.currentPassword}</span>}
          </div>

          {/* New Password */}
          <div className="dpass-form-group">
            <label htmlFor="newPassword">
              <Key size={16} className="dpass-label-icon" />
              New Password
            </label>
            <div className="dpass-input-wrapper">
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
                className="dpass-toggle-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && <span className="dpass-error-msg">{errors.newPassword}</span>}
          </div>

          {/* Password Requirements */}
          <div className="dpass-requirements">
            <span className="dpass-req-title">Password must contain:</span>
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
          <div className="dpass-form-group">
            <label htmlFor="confirmPassword">
              <CheckCircle size={16} className="dpass-label-icon" />
              Confirm New Password
            </label>
            <div className="dpass-input-wrapper">
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
                className="dpass-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && <span className="dpass-error-msg">{errors.confirmPassword}</span>}
          </div>

          {/* Form Actions */}
          <div className="dpass-form-actions">
            <button
              type="button"
              className="dpass-cancel-btn"
              onClick={() => onNavigate('profile')}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dpass-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="dpass-spinner"></span>
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
