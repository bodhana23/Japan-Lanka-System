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
  user: UserProfile | null;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    garageName: user?.garageName || '',
    registrationNumber: user?.registrationNumber || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const updatedUser: UserProfile = {
      ...user,
      username: formData.username,
      email: formData.email,
      mobile: formData.mobile,
      garageName: formData.garageName,
      registrationNumber: formData.registrationNumber
    };

    onUpdate(updatedUser);
    alert('Profile updated successfully!');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword) {
      alert('Please enter your current password');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (formData.newPassword.length < 6) {
      alert('New password must be at least 6 characters long!');
      return;
    }

    // TODO: Implement password change logic
    alert('Password changed successfully!');
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Profile</h2>
          <button onClick={onClose} className="close-modal">×</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Personal Info
          </button>
          <button 
            className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'info' ? (
            <form onSubmit={handleInfoSubmit} className="edit-form">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number</label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="+94 77 123 4567"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="garageName">Garage Name (Optional)</label>
                <input
                  type="text"
                  id="garageName"
                  name="garageName"
                  value={formData.garageName}
                  onChange={handleChange}
                  placeholder="Enter garage name if applicable"
                />
              </div>

              <div className="form-group">
                <label htmlFor="registrationNumber">Registration Number (Optional)</label>
                <input
                  type="text"
                  id="registrationNumber"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  placeholder="Enter registration number if any"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={onClose} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="edit-form">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter your current password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={onClose} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Change Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomerDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
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
      const userData = JSON.parse(currentUser);
      // Add mobile number if not present (for existing users)
      if (!userData.mobile) {
        userData.mobile = '+94 77 123 4567'; // Default mobile number
      }
      setUser(userData);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
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
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setShowEditProfile(false);
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
            <div className="profile-header">
              <h2>Profile Details</h2>
              <button onClick={handleEditProfile} className="edit-profile-btn">
                ✏️ Edit Profile
              </button>
            </div>
            <div className="profile-card">
              <div className="profile-item">
                <label>Username:</label>
                <span>{user.username}</span>
              </div>
              <div className="profile-item">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="profile-item">
                <label>Mobile:</label>
                <span>{user.mobile}</span>
              </div>
              <div className="profile-item">
                <label>Role:</label>
                <span className="role-badge">{user.role}</span>
              </div>
              {user.garageName && (
                <div className="profile-item">
                  <label>Garage:</label>
                  <span>{user.garageName}</span>
                </div>
              )}
              {user.registrationNumber && (
                <div className="profile-item">
                  <label>Registration:</label>
                  <span>{user.registrationNumber}</span>
                </div>
              )}
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
                        <span className="order-date">{new Date(order.orderDate).toLocaleDateString()}</span>
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