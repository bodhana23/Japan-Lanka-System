import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuditorDashboard.css';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  employeeId: string;
}

interface AuditLog {
  id: number;
  activity: string;
  user: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success';
  details: string;
}

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
    department: user.department,
    employeeId: user.employeeId,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?\d[\d\s-()]{7,14}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number format is invalid';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = 'Employee ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('User data not found. Please refresh and try again.');
      return;
    }

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser: UserProfile = {
        ...user,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department.trim(),
        employeeId: formData.employeeId.trim()
      };

      onUpdate(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Password changed successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setActiveTab('info');
    } catch (error) {
      alert('Error changing password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-profile-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="profile-icon">🔍</div>
            <h2>Edit Auditor Profile</h2>
          </div>
          <button onClick={onClose} className="close-modal" disabled={isLoading}>×</button>
        </div>

        <div className="edit-profile-form">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {(formData.name && formData.name.length > 0) ? formData.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
            <p className="profile-email">{formData.email}</p>
            <p className="profile-role">Auditor</p>
          </div>

          {/* Modal Tabs */}
          <div className="modal-tabs">
            <button 
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
              disabled={isLoading}
            >
              <span className="tab-icon">📝</span>
              Personal Info
            </button>
            <button 
              className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
              disabled={isLoading}
            >
              <span className="tab-icon">🔒</span>
              Change Password
            </button>
          </div>

          <div className="modal-body">
            {activeTab === 'info' ? (
              <form onSubmit={handleInfoSubmit} className="edit-form">
                <div className="form-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">
                        <span className="label-icon">👤</span>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className={errors.name ? 'error' : ''}
                        disabled={isLoading}
                        required
                      />
                      {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                  </div>

                  <div className="form-row">
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
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="phone">
                        <span className="label-icon">📱</span>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+94 71 234 5678"
                        className={errors.phone ? 'error' : ''}
                        disabled={isLoading}
                        required
                      />
                      {errors.phone && <span className="error-message">{errors.phone}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="department">
                        <span className="label-icon">🏢</span>
                        Department *
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="Enter your department"
                        className={errors.department ? 'error' : ''}
                        disabled={isLoading}
                        required
                      />
                      {errors.department && <span className="error-message">{errors.department}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="employeeId">
                        <span className="label-icon">🆔</span>
                        Employee ID *
                      </label>
                      <input
                        type="text"
                        id="employeeId"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        placeholder="Enter your employee ID"
                        className={errors.employeeId ? 'error' : ''}
                        disabled={isLoading}
                        required
                      />
                      {errors.employeeId && <span className="error-message">{errors.employeeId}</span>}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={onClose} className="cancel-btn" disabled={isLoading}>
                    Cancel
                  </button>
                  <button type="submit" className={`save-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <span className="save-icon">💾</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="edit-form">
                <div className="form-fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="currentPassword">
                        <span className="label-icon">🔐</span>
                        Current Password *
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter your current password"
                        className={errors.currentPassword ? 'error' : ''}
                        disabled={isLoading}
                        required
                      />
                      {errors.currentPassword && <span className="error-message">{errors.currentPassword}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="newPassword">
                        <span className="label-icon">🔑</span>
                        New Password *
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
                        required
                        minLength={6}
                      />
                      {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="confirmPassword">
                        <span className="label-icon">✅</span>
                        Confirm New Password *
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
                        required
                      />
                      {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={onClose} className="cancel-btn" disabled={isLoading}>
                    Cancel
                  </button>
                  <button type="submit" className={`save-btn ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Changing...
                      </>
                    ) : (
                      <>
                        <span className="save-icon">🔑</span>
                        Change Password
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

const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile>({
    id: 3,
    name: 'Sarah Wilson',
    email: 'sarah.wilson@japanlanka.com',
    role: 'Auditor',
    phone: '+94 77 123 4567',
    department: 'Quality Assurance',
    employeeId: 'JL-AUD-003'
  });

  const [auditLogs, _setAuditLogs] = useState<AuditLog[]>([
    {
      id: 1,
      activity: 'User login attempt',
      user: 'john.doe@japanlanka.com',
      timestamp: '2024-01-15 10:30:00',
      type: 'info',
      details: 'Successful login from IP: 192.168.1.100'
    },
    {
      id: 2,
      activity: 'Data export',
      user: 'jane.smith@japanlanka.com',
      timestamp: '2024-01-15 09:15:00',
      type: 'warning',
      details: 'Customer data exported to CSV'
    },
    {
      id: 3,
      activity: 'Password change',
      user: 'mike.johnson@japanlanka.com',
      timestamp: '2024-01-15 08:45:00',
      type: 'success',
      details: 'Password successfully updated'
    },
    {
      id: 4,
      activity: 'Failed login attempt',
      user: 'unknown@domain.com',
      timestamp: '2024-01-15 08:30:00',
      type: 'warning',
      details: 'Multiple failed login attempts detected'
    },
    {
      id: 5,
      activity: 'System backup',
      user: 'system',
      timestamp: '2024-01-15 02:00:00',
      type: 'success',
      details: 'Automated daily backup completed successfully'
    }
  ]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [showProfile, setShowProfile] = useState(false);

  // Load user data from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        // Validate user data structure and role
        if (!userData || typeof userData !== 'object' || !userData.email || userData.role !== 'auditor') {
          console.warn('Invalid or unauthorized user data for auditor dashboard');
          navigate('/');
          return;
        }
        
        // Update user state with data from localStorage
        setUser({
          id: userData.id || 3,
          name: userData.name || (userData.email && userData.email.includes('@') ? userData.email.split('@')[0] : 'auditor'),
          email: userData.email,
          role: userData.role,
          phone: userData.phone || '+94 77 123 4567',
          department: userData.department || 'Quality Assurance',
          employeeId: userData.employeeId || 'AUD-001'
        });
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
    navigate('/');
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    setIsEditModalOpen(false);
  };

  const getLogTypeIcon = (type: AuditLog['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  const getLogTypeClass = (type: AuditLog['type']) => {
    return `log-type-${type}`;
  };

  const filteredLogs = auditLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    const today = new Date();
    
    switch (selectedTimeRange) {
      case 'today':
        return logDate.toDateString() === today.toDateString();
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return logDate >= monthAgo;
      default:
        return true;
    }
  });

  return (
    <div className="auditor-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Auditor Dashboard</h1>
            <p>Monitor system activities and maintain security compliance</p>
          </div>
          
          <div className="header-actions">
            <button 
              className="profile-header-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <span className="profile-btn-icon">👤</span>
              <span className="profile-btn-text">Profile</span>
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Profile Section - Conditionally Rendered */}
        {showProfile && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Auditor Profile</h2>
              <div className="header-actions">
                <button 
                  onClick={() => setShowProfile(false)} 
                  className="close-profile-btn"
                >
                  <span className="close-icon">✕</span>
                  Hide Profile
                </button>
                <button 
                  onClick={() => setIsEditModalOpen(true)} 
                  className="edit-profile-btn"
                >
                  <span className="edit-icon">✏️</span>
                  Edit Profile
                </button>
              </div>
            </div>
            
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar-large">
                  <div className="avatar-large">
                    {(user.name && user.name.length > 0) ? user.name.charAt(0).toUpperCase() : 'A'}
                  </div>
                </div>
                <div className="profile-summary">
                  <h3>{user.name || 'Auditor User'}</h3>
                  <p className="profile-role-badge">Auditor</p>
                  <p className="profile-email-text">{user.email}</p>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-grid">
                  <div className="profile-item">
                    <div className="profile-item-icon">👤</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Full Name</span>
                      <span className="profile-value">{user.name || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">📧</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Email Address</span>
                      <span className="profile-value">{user.email || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">👔</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Role</span>
                      <span className="profile-value">Auditor</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">📱</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Phone Number</span>
                      <span className="profile-value">{user.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">🏢</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Department</span>
                      <span className="profile-value">{user.department || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">🆔</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Employee ID</span>
                      <span className="profile-value">{user.employeeId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-actions">
                <button 
                  className="edit-profile-btn-main"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <span className="action-icon">✏️</span>
                  Edit Profile Information
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>Total Logs</h3>
              <p>{auditLogs.length}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <h3>Warnings</h3>
              <p>{auditLogs.filter(log => log.type === 'warning').length}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>Success</h3>
              <p>{auditLogs.filter(log => log.type === 'success').length}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">ℹ️</div>
            <div className="stat-info">
              <h3>Info</h3>
              <p>{auditLogs.filter(log => log.type === 'info').length}</p>
            </div>
          </div>
        </div>

        {/* Audit Logs Section */}
        <div className="audit-logs-section">
          <div className="section-header">
            <h2>Audit Logs</h2>
            <div className="time-filter">
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="time-select"
              >
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="logs-container">
            {filteredLogs.map(log => (
              <div key={log.id} className={`log-entry ${getLogTypeClass(log.type)}`}>
                <div className="log-header">
                  <div className="log-type">
                    <span className="log-icon">{getLogTypeIcon(log.type)}</span>
                    <span className="log-activity">{log.activity}</span>
                  </div>
                  <span className="log-timestamp">{log.timestamp}</span>
                </div>
                <div className="log-details">
                  <p className="log-user">User: {log.user}</p>
                  <p className="log-description">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default AuditorDashboard;