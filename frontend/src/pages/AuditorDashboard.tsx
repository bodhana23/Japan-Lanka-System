import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AuditorDashboard.css';

interface ActivityLog {
  id: string;
  timestamp: string;
  user: {
    email: string;
    role: 'customer' | 'manager' | 'admin';
    name: string;
  };
  action: string;
  category: 'ORDER' | 'INVENTORY' | 'RETURN' | 'PROFILE' | 'LOGIN' | 'SYSTEM';
  details: string;
  metadata?: {
    orderId?: string;
    productId?: string;
    amount?: number;
    quantity?: number;
    status?: string;
  };
}

interface UserProfile {
  email: string;
  name: string;
  role: string;
  phone: string;
  department: string;
  employeeId: string;
  joinDate: string;
}

interface EditProfileModalProps {
  user: UserProfile | null;
  onClose: () => void;
  onUpdate: (user: UserProfile) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    employeeId: user?.employeeId || '',
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
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department,
      employeeId: formData.employeeId
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
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
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
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+94 77 123 4567"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="employeeId">Employee ID</label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
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

const AuditorDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'logs' | 'analytics' | 'profile'>('logs');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Mock activity logs - In real system, this would come from backend
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: 'LOG-001',
      timestamp: '2025-01-20 14:30:25',
      user: { email: 'customer1@gmail.com', role: 'customer', name: 'John Doe' },
      action: 'ORDER_PLACED',
      category: 'ORDER',
      details: 'Customer placed an order for vehicle parts',
      metadata: { orderId: 'ORD-001', amount: 8700.00, quantity: 2 }
    },
    {
      id: 'LOG-002',
      timestamp: '2025-01-20 14:15:12',
      user: { email: 'customer1@gmail.com', role: 'customer', name: 'John Doe' },
      action: 'CART_ADD_ITEM',
      category: 'ORDER',
      details: 'Added Spark Plugs Set (Nissan Altima) to cart',
      metadata: { productId: 'P005', quantity: 1 }
    },
    {
      id: 'LOG-003',
      timestamp: '2025-01-20 13:45:30',
      user: { email: 'manager1@gmail.com', role: 'manager', name: 'Manager Smith' },
      action: 'INVENTORY_UPDATE',
      category: 'INVENTORY',
      details: 'Updated inventory quantity for Brake Pads Set',
      metadata: { productId: 'P001', quantity: 25 }
    },
    {
      id: 'LOG-004',
      timestamp: '2025-01-20 13:30:45',
      user: { email: 'manager1@gmail.com', role: 'manager', name: 'Manager Smith' },
      action: 'RETURN_REQUEST_APPROVED',
      category: 'RETURN',
      details: 'Approved return request for Engine Oil Filter',
      metadata: { orderId: 'ORD-002', productId: 'P002', status: 'approved' }
    },
    {
      id: 'LOG-005',
      timestamp: '2025-01-20 12:20:18',
      user: { email: 'customer2@gmail.com', role: 'customer', name: 'Jane Wilson' },
      action: 'RETURN_REQUEST_SUBMITTED',
      category: 'RETURN',
      details: 'Submitted return request for defective LED Headlight Bulbs',
      metadata: { orderId: 'ORD-003', productId: 'P003' }
    },
    {
      id: 'LOG-006',
      timestamp: '2025-01-20 11:15:22',
      user: { email: 'admin@gmail.com', role: 'admin', name: 'Admin User' },
      action: 'LOW_STOCK_ALERT_VIEWED',
      category: 'SYSTEM',
      details: 'Viewed low stock alerts for Engine Oil Filter and LED Headlight Bulbs',
      metadata: { }
    },
    {
      id: 'LOG-007',
      timestamp: '2025-01-20 10:45:33',
      user: { email: 'customer1@gmail.com', role: 'customer', name: 'John Doe' },
      action: 'PROFILE_UPDATED',
      category: 'PROFILE',
      details: 'Updated profile information - changed mobile number',
      metadata: { }
    },
    {
      id: 'LOG-008',
      timestamp: '2025-01-20 09:30:15',
      user: { email: 'manager1@gmail.com', role: 'manager', name: 'Manager Smith' },
      action: 'LOGIN',
      category: 'LOGIN',
      details: 'User logged into manager dashboard',
      metadata: { }
    },
    {
      id: 'LOG-009',
      timestamp: '2025-01-20 09:15:40',
      user: { email: 'customer3@gmail.com', role: 'customer', name: 'Mike Johnson' },
      action: 'ORDER_CANCELLED',
      category: 'ORDER',
      details: 'Customer cancelled order for Air Filter',
      metadata: { orderId: 'ORD-004', amount: 1850.00 }
    },
    {
      id: 'LOG-010',
      timestamp: '2025-01-20 08:45:28',
      user: { email: 'admin@gmail.com', role: 'admin', name: 'Admin User' },
      action: 'SYSTEM_BACKUP',
      category: 'SYSTEM',
      details: 'Daily system backup completed successfully',
      metadata: { }
    }
  ]);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        localStorage.removeItem('currentUser');
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

  const getFilteredLogs = () => {
    return activityLogs.filter(log => {
      const matchesCategory = filterCategory === 'ALL' || log.category === filterCategory;
      const matchesUser = filterUser === 'ALL' || log.user.role === filterUser;
      const matchesSearch = searchTerm === '' || 
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesUser && matchesSearch;
    });
  };

  const getCategoryBadgeClass = (category: string) => {
    const categoryClasses = {
      'ORDER': 'category-order',
      'INVENTORY': 'category-inventory',
      'RETURN': 'category-return',
      'PROFILE': 'category-profile',
      'LOGIN': 'category-login',
      'SYSTEM': 'category-system'
    };
    return categoryClasses[category as keyof typeof categoryClasses] || 'category-default';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('ORDER')) return '📦';
    if (action.includes('INVENTORY')) return '📊';
    if (action.includes('RETURN')) return '↩️';
    if (action.includes('PROFILE')) return '👤';
    if (action.includes('LOGIN')) return '🔑';
    if (action.includes('SYSTEM')) return '⚙️';
    return '📋';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="auditor-dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises - Audit Dashboard</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.name}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📋 Activity Logs
        </button>
        <button 
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
        <button 
          className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'logs' && (
          <div className="logs-section">
            <div className="logs-header">
              <h2>System Activity Logs</h2>
              <div className="logs-filters">
                <div className="filter-group">
                  <label>Category:</label>
                  <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="ORDER">Orders</option>
                    <option value="INVENTORY">Inventory</option>
                    <option value="RETURN">Returns</option>
                    <option value="PROFILE">Profile</option>
                    <option value="LOGIN">Login</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>User Role:</label>
                  <select 
                    value={filterUser} 
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="filter-select"
                  >
                    <option value="ALL">All Users</option>
                    <option value="customer">Customers</option>
                    <option value="manager">Managers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Search:</label>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
            </div>

            <div className="logs-list">
              {getFilteredLogs().map((log) => (
                <div key={log.id} className="log-entry">
                  <div className="log-header">
                    <div className="log-icon">{getActionIcon(log.action)}</div>
                    <div className="log-info">
                      <span className="log-timestamp">{log.timestamp}</span>
                      <span className={`log-category ${getCategoryBadgeClass(log.category)}`}>
                        {log.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="log-content">
                    <div className="log-user">
                      <strong>{log.user.name}</strong> ({log.user.email})
                      <span className="user-role">{log.user.role}</span>
                    </div>
                    <div className="log-action">{log.action.replace(/_/g, ' ')}</div>
                    <div className="log-details">{log.details}</div>
                    
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="log-metadata">
                        <strong>Metadata:</strong>
                        {Object.entries(log.metadata).map(([key, value]) => (
                          <span key={key} className="metadata-item">
                            {key}: {value != null ? String(value) : 'N/A'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h2>System Analytics</h2>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>📦 Order Activities</h3>
                <div className="stat-number">
                  {activityLogs.filter(log => log.category === 'ORDER').length}
                </div>
                <p>Total order-related activities today</p>
              </div>
              
              <div className="analytics-card">
                <h3>📊 Inventory Updates</h3>
                <div className="stat-number">
                  {activityLogs.filter(log => log.category === 'INVENTORY').length}
                </div>
                <p>Inventory modifications today</p>
              </div>
              
              <div className="analytics-card">
                <h3>↩️ Return Requests</h3>
                <div className="stat-number">
                  {activityLogs.filter(log => log.category === 'RETURN').length}
                </div>
                <p>Return-related activities today</p>
              </div>
              
              <div className="analytics-card">
                <h3>👤 User Activities</h3>
                <div className="stat-number">
                  {activityLogs.filter(log => log.category === 'PROFILE' || log.category === 'LOGIN').length}
                </div>
                <p>User profile and login activities</p>
              </div>
              
              <div className="analytics-card">
                <h3>⚙️ System Events</h3>
                <div className="stat-number">
                  {activityLogs.filter(log => log.category === 'SYSTEM').length}
                </div>
                <p>System maintenance and alerts</p>
              </div>
              
              <div className="analytics-card">
                <h3>📈 Total Activities</h3>
                <div className="stat-number">{activityLogs.length}</div>
                <p>All activities recorded today</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="profile-section">
            <div className="profile-header">
              <h2>Auditor Profile</h2>
              <button onClick={handleEditProfile} className="edit-profile-btn">
                ✏️ Edit Profile
              </button>
            </div>
            <div className="profile-card">
              <div className="profile-item">
                <label>Full Name:</label>
                <span>{user.name}</span>
              </div>
              <div className="profile-item">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="profile-item">
                <label>Phone:</label>
                <span>{user.phone}</span>
              </div>
              <div className="profile-item">
                <label>Role:</label>
                <span className="role-badge">{user.role}</span>
              </div>
              <div className="profile-item">
                <label>Department:</label>
                <span>{user.department}</span>
              </div>
              <div className="profile-item">
                <label>Employee ID:</label>
                <span>{user.employeeId}</span>
              </div>
              <div className="profile-item">
                <label>Join Date:</label>
                <span>{new Date(user.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
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

export default AuditorDashboard;