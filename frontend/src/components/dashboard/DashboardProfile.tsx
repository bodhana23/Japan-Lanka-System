import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';
import { User, Mail, Phone, Tag, Lock, Save, CheckCircle, AlertCircle, Edit, Eye } from 'lucide-react';
import './DashboardProfile.css';

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardProfileProps {
  onNavigate: (section: NavItemId) => void;
}

const DashboardProfile: React.FC<DashboardProfileProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

  const isGoogleUser = user?.is_google_user === true;

  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '',
  });

  const displayName = user?.full_name || 'User';
  const displayRole = 'Customer';

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
      const profileUpdates: { full_name?: string; phone_number?: string } = {};

      if (formData.fullName.trim() !== (user?.full_name || '')) {
        profileUpdates.full_name = formData.fullName.trim();
      }

      const currentPhone = user?.phone_number || '';
      if (formData.phoneNumber.trim() !== currentPhone) {
        profileUpdates.phone_number = formData.phoneNumber.trim() || undefined;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const updatedUser = await authApi.updateMe(profileUpdates);
        const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const mergedUser = { ...storedUser, ...updatedUser };
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSuccessMessage('No changes to save.');
      }

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
      fullName: user?.full_name || '',
      email: user?.email || '',
      phoneNumber: user?.phone_number || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="dprof-container">
      {/* Page Header */}
      <div className="dprof-page-header">
        <div className="dprof-header-info">
          <h2 className="dprof-page-title">
            <User size={24} className="dprof-title-icon" />
            My Profile
          </h2>
          <p className="dprof-page-subtitle">View and manage your account information</p>
        </div>
        {!isEditing && (
          <button className="dprof-edit-btn" onClick={() => setIsEditing(true)}>
            <Edit size={18} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="dprof-success-banner">
          <CheckCircle size={20} />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errors.form && (
        <div className="dprof-error-banner">
          <AlertCircle size={20} />
          <p>{errors.form}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="dprof-card">
        {/* Profile Header */}
        <div className="dprof-card-header">
          <div className="dprof-avatar-large">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="dprof-header-text">
            <h3 className="dprof-name">{displayName}</h3>
            <span className="dprof-role-badge">{displayRole}</span>
            {isGoogleUser && (
              <span className="dprof-google-badge">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="14" />
                Google Account
              </span>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="dprof-card-body">
          {!isEditing ? (
            // View Mode
            <div className="dprof-view-mode">
              <div className="dprof-field-group">
                <div className="dprof-field">
                  <div className="dprof-field-icon">
                    <User size={18} />
                  </div>
                  <div className="dprof-field-content">
                    <span className="dprof-field-label">Full Name</span>
                    <span className="dprof-field-value">{displayName}</span>
                  </div>
                </div>

                <div className="dprof-field">
                  <div className="dprof-field-icon">
                    <Mail size={18} />
                  </div>
                  <div className="dprof-field-content">
                    <span className="dprof-field-label">Email Address</span>
                    <span className="dprof-field-value">{user?.email || 'Not set'}</span>
                  </div>
                </div>

                <div className="dprof-field">
                  <div className="dprof-field-icon">
                    <Phone size={18} />
                  </div>
                  <div className="dprof-field-content">
                    <span className="dprof-field-label">Phone Number</span>
                    <span className="dprof-field-value">
                      {user?.phone_number || 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="dprof-field">
                  <div className="dprof-field-icon">
                    <Tag size={18} />
                  </div>
                  <div className="dprof-field-content">
                    <span className="dprof-field-label">Account Type</span>
                    <span className="dprof-field-value">{displayRole}</span>
                  </div>
                </div>

                <div className="dprof-field">
                  <div className="dprof-field-icon">
                    <Lock size={18} />
                  </div>
                  <div className="dprof-field-content">
                    <span className="dprof-field-label">Password</span>
                    <span className="dprof-field-value">
                      {isGoogleUser ? 'Managed by Google' : '••••••••'}
                    </span>
                  </div>
                  {!isGoogleUser && (
                    <button
                      className="dprof-change-password-link"
                      onClick={() => onNavigate('change-password')}
                    >
                      Change Password
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Edit Mode
            <form className="dprof-edit-form" onSubmit={handleSubmit}>
              <div className="dprof-form-group">
                <label htmlFor="fullName">
                  <User size={16} className="dprof-label-icon" />
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
                {errors.fullName && <span className="dprof-error-msg">{errors.fullName}</span>}
              </div>

              <div className="dprof-form-group">
                <label htmlFor="email">
                  <Mail size={16} className="dprof-label-icon" />
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
                  disabled={isLoading || isGoogleUser}
                  required
                />
                {isGoogleUser && (
                  <span className="dprof-field-note">Email is managed by Google and cannot be changed here.</span>
                )}
                {errors.email && <span className="dprof-error-msg">{errors.email}</span>}
              </div>

              <div className="dprof-form-group">
                <label htmlFor="phoneNumber">
                  <Phone size={16} className="dprof-label-icon" />
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
                {errors.phoneNumber && <span className="dprof-error-msg">{errors.phoneNumber}</span>}
              </div>

              <div className="dprof-form-actions">
                <button
                  type="button"
                  className="dprof-cancel-btn"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dprof-save-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="dprof-spinner"></span>
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

export default DashboardProfile;
