import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import './AuditorDashboard.css';

interface UserProfile {
  email: string;
  name: string;
  role: string;
  password: string;
}

interface InventoryLog {
  id: number;
  productName: string;
  action: string;
  user: string;
  timestamp: string;
  previousQuantity?: number;
  newQuantity?: number;
  details: string;
}

interface ActivityLog {
  id: number;
  activity: string;
  user: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
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
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @';
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
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser: UserProfile = {
        ...user,
        name: formData.name.trim(),
        email: formData.email.trim()
      };

      // Update localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        localStorage.setItem('currentUser', JSON.stringify({
          ...userData,
          name: updatedUser.name,
          email: updatedUser.email
        }));
      }

      onUpdate(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
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
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update password in localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        localStorage.setItem('currentUser', JSON.stringify({
          ...userData,
          password: formData.newPassword
        }));
      }

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
          <div className="profile-picture-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {(formData.name && formData.name.length > 0) ? formData.name.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>
            <p className="profile-email">{formData.email}</p>
            <p className="profile-role">Auditor</p>
          </div>

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
  const [activeTab, setActiveTab] = useState<'inventory' | 'activity'>('inventory');
  const [showProfile, setShowProfile] = useState(false);

  const [user, setUser] = useState<UserProfile>({
    email: 'auditor@japanlanka.com',
    name: 'Auditor User',
    role: 'Auditor',
    password: 'auditor123'
  });

  const [inventoryLogs] = useState<InventoryLog[]>([
    {
      id: 1,
      productName: 'Brake Pads Set - Toyota Camry',
      action: 'Stock Added',
      user: 'Manager User',
      timestamp: '2025-10-18 10:30:00',
      previousQuantity: 25,
      newQuantity: 50,
      details: 'Added 25 units to inventory'
    },
    {
      id: 2,
      productName: 'Engine Oil Filter - Honda Civic',
      action: 'Stock Updated',
      user: 'Manager User',
      timestamp: '2025-10-18 09:15:00',
      previousQuantity: 10,
      newQuantity: 2,
      details: 'Sold 8 units to customer'
    },
    {
      id: 3,
      productName: 'LED Headlight Bulbs - Ford Focus',
      action: 'Product Added',
      user: 'Manager User',
      timestamp: '2025-10-17 14:20:00',
      newQuantity: 20,
      details: 'New product added to inventory'
    },
    {
      id: 4,
      productName: 'Air Filter - Nissan Altima',
      action: 'Stock Updated',
      user: 'Manager User',
      timestamp: '2025-10-17 11:45:00',
      previousQuantity: 30,
      newQuantity: 28,
      details: 'Sold 2 units to customer'
    },
    {
      id: 5,
      productName: 'Spark Plugs Set - Honda Accord',
      action: 'Price Updated',
      user: 'Manager User',
      timestamp: '2025-10-16 16:30:00',
      details: 'Price changed from Rs. 3000 to Rs. 3200'
    }
  ]);

  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: 1,
      activity: 'User Login',
      user: 'manager@japanlanka.com',
      timestamp: '2025-10-18 10:25:00',
      type: 'success',
      details: 'Successful login from Manager Dashboard'
    },
    {
      id: 2,
      activity: 'Order Status Updated',
      user: 'manager@japanlanka.com',
      timestamp: '2025-10-18 10:20:00',
      type: 'info',
      details: 'Order #ORD-001 status changed to In Progress'
    },
    {
      id: 3,
      activity: 'Product Deleted',
      user: 'manager@japanlanka.com',
      timestamp: '2025-10-18 09:50:00',
      type: 'warning',
      details: 'Product "Wiper Blades" removed from inventory'
    },
    {
      id: 4,
      activity: 'Failed Login Attempt',
      user: 'unknown@domain.com',
      timestamp: '2025-10-18 08:30:00',
      type: 'error',
      details: 'Multiple failed login attempts detected'
    },
    {
      id: 5,
      activity: 'Customer Registration',
      user: 'newcustomer@gmail.com',
      timestamp: '2025-10-17 15:45:00',
      type: 'success',
      details: 'New customer account created'
    },
    {
      id: 6,
      activity: 'Password Changed',
      user: 'customer@gmail.com',
      timestamp: '2025-10-17 14:30:00',
      type: 'info',
      details: 'Customer password successfully updated'
    },
    {
      id: 7,
      activity: 'System Backup',
      user: 'system',
      timestamp: '2025-10-17 02:00:00',
      type: 'success',
      details: 'Automated daily backup completed successfully'
    }
  ]);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        if (!userData || userData.role !== 'auditor') {
          navigate('/');
          return;
        }
        
        setUser({
          email: userData.email,
          name: userData.name || 'Auditor User',
          role: userData.role,
          password: userData.password || 'auditor123'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };


  const getActivityLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  return (
    <div className="dashboard-container">
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          roleLabel="Auditor"
        />
      )}

      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔍 Japan Lanka Auditor Dashboard</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.name}!</span>
            <button 
              className="profile-header-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <span className="profile-btn-icon">👤</span>
              {showProfile ? 'Hide Profile' : 'Show Profile'}
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        

        <nav className="auditor-tabs">
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory Logs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📊 Activity Logs
          </button>
        </nav>

        {activeTab === 'inventory' && (
          <section className="logs-section">
            <h2>Inventory Logs</h2>
            <div className="logs-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Previous Qty</th>
                    <th>New Qty</th>
                    <th>Timestamp</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="product-name">{log.productName}</td>
                      <td><span className="action-badge">{log.action}</span></td>
                      <td>{log.user}</td>
                      <td className="quantity">{log.previousQuantity ?? '-'}</td>
                      <td className="quantity">{log.newQuantity}</td>
                      <td className="timestamp">{log.timestamp}</td>
                      <td className="details">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'activity' && (
          <section className="logs-section">
            <h2>Activity Logs</h2>
            <div className="logs-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Activity</th>
                    <th>User</th>
                    <th>Timestamp</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.map((log) => (
                    <tr key={log.id} className={`log-row-${log.type}`}>
                      <td className="log-type">
                        <span className={`log-icon log-${log.type}`}>
                          {getActivityLogIcon(log.type)}
                        </span>
                      </td>
                      <td className="activity-name">{log.activity}</td>
                      <td>{log.user}</td>
                      <td className="timestamp">{log.timestamp}</td>
                      <td className="details">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AuditorDashboard;
