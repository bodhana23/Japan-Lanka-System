import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomerDashboard.css';

interface Order {
  id: string;
  items: string[];
  amount: number;
  status: 'ready_to_pickup' | 'delivered' | 'in_progress';
  orderDate: string;
}

interface UserProfile {
  email: string;
  username: string;
  role: string;
  mobile: string;
  garageName?: string;
  registrationNumber?: string;
}

interface EditProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    mobile: user.mobile || '',
    garageName: user.garageName || '',
    registrationNumber: user.registrationNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Username validation
    if (!formData.username || formData.username.trim().length < 2) {
      newErrors.username = 'Username must be at least 2 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    const phoneRegex = /^[+]?[0-9\s\-()]{10,15}$/;
    if (!formData.mobile || !phoneRegex.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword || formData.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters long';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({...errors, [name]: ''});
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser: UserProfile = {
        email: formData.email,
        username: formData.username,
        role: user.role,
        mobile: formData.mobile,
        garageName: formData.garageName,
        registrationNumber: formData.registrationNumber
      };

      onUpdate(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile. Please try again.');
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
      
      // TODO: Implement password change logic
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
            <div className="profile-icon">👤</div>
            <h2>Edit Customer Profile</h2>
          </div>
          <button onClick={onClose} className="close-modal" disabled={isLoading}>×</button>
        </div>

        <div className="edit-profile-form">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {(formData.username && formData.username.length > 0) ? formData.username.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            <p className="profile-email">{formData.email}</p>
            <p className="profile-role">Customer</p>
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
                      <label htmlFor="username">
                        <span className="label-icon">👤</span>
                        Username *
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username"
                        className={errors.username ? 'error' : ''}
                        disabled={isLoading}
                        required
                      />
                      {errors.username && <span className="error-message">{errors.username}</span>}
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
                      <label htmlFor="mobile">
                        <span className="label-icon">📱</span>
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="+94 77 123 4567"
                        className={errors.mobile ? 'error' : ''}
                        disabled={isLoading}
                        required
                      />
                      {errors.mobile && <span className="error-message">{errors.mobile}</span>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="garageName">
                        <span className="label-icon">🏪</span>
                        Garage Name (Optional)
                      </label>
                      <input
                        type="text"
                        id="garageName"
                        name="garageName"
                        value={formData.garageName}
                        onChange={handleChange}
                        placeholder="Enter garage name if applicable"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="registrationNumber">
                        <span className="label-icon">📋</span>
                        Registration Number (Optional)
                      </label>
                      <input
                        type="text"
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="Enter registration number if any"
                        disabled={isLoading}
                      />
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

const CustomerDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile>({
    email: '',
    username: '',
    role: 'customer',
    mobile: ''
  });
  const [showEditProfile, setShowEditProfile] = useState(false);
  const navigate = useNavigate();

  // Previous vehicle parts orders for demo
  const [orders] = useState<Order[]>([
    {
      id: 'ORD-001',
      items: ['Brake Pads Set (Toyota Camry)', 'Engine Oil Filter (Honda Civic)'],
      amount: 5700.00,
      status: 'delivered',
      orderDate: '2025-01-15'
    },
    {
      id: 'ORD-002',
      items: ['LED Headlight Bulbs (BMW 3 Series)', 'Air Filter (Ford Focus)'],
      amount: 4650.00,
      status: 'ready_to_pickup',
      orderDate: '2025-01-18'
    },
    {
      id: 'ORD-003',
      items: ['Spark Plugs Set (Nissan Altima)', 'Timing Belt (Honda Accord)'],
      amount: 8700.00,
      status: 'in_progress',
      orderDate: '2025-01-20'
    }
  ]);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        // Validate user data structure
        if (!userData || typeof userData !== 'object' || !userData.email || !userData.role) {
          throw new Error('Invalid user data structure');
        }
        // Add mobile number if not present (for existing users)
        if (!userData.mobile) {
          userData.mobile = '+94 77 123 4567'; // Default mobile number
        }
        // Ensure username is set
        if (!userData.username) {
          userData.username = userData.email && userData.email.includes('@') ? userData.email.split('@')[0] : 'user'; // Use email prefix as username
        }
        setUser({
          email: userData.email,
          username: userData.username,
          role: userData.role,
          mobile: userData.mobile,
          garageName: userData.garageName,
          registrationNumber: userData.registrationNumber
        });
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        try {
          localStorage.removeItem('currentUser');
        } catch (storageError) {
          console.error('Error removing corrupted user data:', storageError);
        }
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

  const handleNewOrder = () => {
    navigate('/shop');
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleCloseEditProfile = () => {
    setShowEditProfile(false);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    try {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setShowEditProfile(false);
    } catch (error) {
      console.error('Error saving user data to localStorage:', error);
      // More specific error handling
      if (error instanceof DOMException && error.code === 22) {
        alert('Storage quota exceeded. Please clear some browser data and try again.');
      } else {
        alert('Warning: Profile changes may not persist after refresh due to storage restrictions.');
      }
      // Still close the modal even if save fails
      setShowEditProfile(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'ready_to_pickup': { text: 'Ready to Pickup', class: 'status-ready' },
      'delivered': { text: 'Delivered', class: 'status-delivered' },
      'in_progress': { text: 'In Progress', class: 'status-progress' }
    };
    return statusMap[status as keyof typeof statusMap] || { text: status, class: 'status-default' };
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.username}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Place Order Button Section */}
      <div className="top-action-section">
        <button onClick={handleNewOrder} className="place-order-btn">
          <span className="btn-icon">🛒</span>
          Place an Order
        </button>
      </div>

      <main className="dashboard-main">
        <div className="dashboard-grid">
          {/* Profile Section */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Customer Profile</h2>
              <button onClick={handleEditProfile} className="edit-profile-btn">
                <span className="edit-icon">✏️</span>
                Edit Profile
              </button>
            </div>
            
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar-large">
                  <div className="avatar-large">
                    {(user.username || user.email || 'U').length > 0 ? (user.username || user.email || 'U').charAt(0).toUpperCase() : 'U'}
                  </div>
                </div>
                <div className="profile-summary">
                  <h3>{user.username || user.email || 'Customer'}</h3>
                  <p className="profile-role-badge">Customer</p>
                  <p className="profile-email-text">{user.email}</p>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-grid">
                  <div className="profile-item">
                    <div className="profile-item-icon">👤</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Username</span>
                      <span className="profile-value">{user.username || user.email || 'Not set'}</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">📧</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Email Address</span>
                      <span className="profile-value">{user.email}</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">📱</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Mobile Number</span>
                      <span className="profile-value">{user.mobile || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="profile-item">
                    <div className="profile-item-icon">👔</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Role</span>
                      <span className="profile-value">Customer</span>
                    </div>
                  </div>

                  {user.garageName && (
                    <div className="profile-item">
                      <div className="profile-item-icon">🏪</div>
                      <div className="profile-item-content">
                        <span className="profile-label">Garage Name</span>
                        <span className="profile-value">{user.garageName}</span>
                      </div>
                    </div>
                  )}

                  {user.registrationNumber && (
                    <div className="profile-item">
                      <div className="profile-item-icon">🚗</div>
                      <div className="profile-item-content">
                        <span className="profile-label">Registration Number</span>
                        <span className="profile-value">{user.registrationNumber}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Orders Section */}
          <section className="orders-section">
            <h2>Previous Orders</h2>
            <div className="orders-list">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <span className="order-id">#{order.id}</span>
                      <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                        {getStatusBadge(order.status).text}
                      </span>
                    </div>
                    <div className="order-details">
                      <p className="order-items">
                        <strong>Items:</strong> {order.items.join(', ')}
                      </p>
                      <div className="order-meta">
                        <span className="order-amount">Rs. {order.amount.toFixed(2)}</span>
                        <span className="order-date">
                          {(() => {
                            try {
                              const date = new Date(order.orderDate);
                              return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                            } catch {
                              return 'Invalid Date';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-orders">No previous orders found.</p>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          user={user}
          onClose={handleCloseEditProfile}
          onUpdate={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;