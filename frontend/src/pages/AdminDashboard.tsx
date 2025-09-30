import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

interface Product {
  id: string;
  name: string;
  model: string;
  modelYear: string;
  price: number;
  quantityAvailable: number;
  category: string;
  image: string;
  description: string;
}

interface SalesData {
  month: string;
  sales: number;
  orders: number;
}

interface UserProfile {
  email: string;
  username: string;
  role: string;
  mobile: string;
  department?: string;
  employeeId?: string;
}

const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'analytics' | 'inventory' | 'profile'>('analytics');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const navigate = useNavigate();

  // Sample financial data (in real app, this would come from database)
  const [salesData] = useState<SalesData[]>([
    { month: 'August 2025', sales: 1250000, orders: 156 },
    { month: 'September 2025', sales: 1450000, orders: 189 },
    { month: 'October 2025', sales: 980000, orders: 98 } // Current month (partial)
  ]);

  // Sample inventory data (synchronized with manager's database)
  const [inventoryData] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Brake Pads Set',
      model: 'Toyota Camry',
      modelYear: '2018-2023',
      price: 4500.00,
      quantityAvailable: 25,
      category: 'Brake System',
      image: '🔧',
      description: 'High-quality ceramic brake pads for Toyota Camry 2018-2023'
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      model: 'Honda Civic',
      modelYear: '2016-2021',
      price: 1200.00,
      quantityAvailable: 2, // Low stock
      category: 'Engine Parts',
      image: '⚙️',
      description: 'Premium oil filter for Honda Civic 2016-2021'
    },
    {
      id: 'P003',
      name: 'LED Headlight Bulbs',
      model: 'BMW 3 Series',
      modelYear: '2019-2024',
      price: 2800.00,
      quantityAvailable: 1, // Low stock
      category: 'Lighting',
      image: '💡',
      description: 'LED headlight bulb set for BMW 3 Series 2019-2024'
    },
    {
      id: 'P004',
      name: 'Air Filter',
      model: 'Ford Focus',
      modelYear: '2015-2020',
      price: 1850.00,
      quantityAvailable: 30,
      category: 'Engine Parts',
      image: '🌪️',
      description: 'High-flow air filter for Ford Focus 2015-2020'
    },
    {
      id: 'P005',
      name: 'Spark Plugs Set',
      model: 'Nissan Altima',
      modelYear: '2017-2022',
      price: 3200.00,
      quantityAvailable: 15,
      category: 'Engine Parts',
      image: '⚡',
      description: 'Iridium spark plugs for Nissan Altima 2017-2022'
    },
    {
      id: 'P006',
      name: 'Timing Belt',
      model: 'Honda Accord',
      modelYear: '2013-2017',
      price: 5500.00,
      quantityAvailable: 8,
      category: 'Engine Parts',
      image: '⏰',
      description: 'Timing belt kit for Honda Accord 2013-2017'
    }
  ]);

  // Filter low stock items (quantity < 3)
  const lowStockItems = inventoryData.filter(item => item.quantityAvailable < 3);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      if (userData.role !== 'admin') {
        navigate('/dashboard');
        return;
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

  const handleOrderMore = (productId: string) => {
    alert(`Order request sent for Product ID: ${productId}\nThis would normally integrate with supplier systems.`);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <header className="admin-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises - Admin Portal</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.username}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Financial Analytics
          </button>
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Low Stock Alert ({lowStockItems.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile Management
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <div className="analytics-section">
            <h2>Monthly Financial Status</h2>
            <div className="sales-cards">
              {salesData.map((data, index) => (
                <div key={data.month} className={`sales-card ${index === salesData.length - 1 ? 'current-month' : ''}`}>
                  <div className="sales-header">
                    <h3>{data.month}</h3>
                    {index === salesData.length - 1 && <span className="current-badge">Current</span>}
                  </div>
                  <div className="sales-amount">
                    <span className="currency">Rs.</span>
                    <span className="amount">{data.sales.toLocaleString()}</span>
                  </div>
                  <div className="sales-details">
                    <div className="detail-item">
                      <span className="detail-label">Total Orders:</span>
                      <span className="detail-value">{data.orders}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Avg Order:</span>
                      <span className="detail-value">Rs. {Math.round(data.sales / data.orders).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="sales-trend">
                    {index > 0 && (
                      <span className={`trend ${data.sales > salesData[index - 1].sales ? 'up' : 'down'}`}>
                        {data.sales > salesData[index - 1].sales ? '📈' : '📉'}
                        {Math.abs(((data.sales - salesData[index - 1].sales) / salesData[index - 1].sales) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-section">
              <h3>Summary</h3>
              <div className="summary-cards">
                <div className="summary-card">
                  <h4>Total Sales (3 Months)</h4>
                  <p className="summary-amount">Rs. {salesData.reduce((sum, data) => sum + data.sales, 0).toLocaleString()}</p>
                </div>
                <div className="summary-card">
                  <h4>Total Orders</h4>
                  <p className="summary-amount">{salesData.reduce((sum, data) => sum + data.orders, 0)}</p>
                </div>
                <div className="summary-card">
                  <h4>Average Monthly Sales</h4>
                  <p className="summary-amount">Rs. {Math.round(salesData.reduce((sum, data) => sum + data.sales, 0) / salesData.length).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'inventory' ? (
          <div className="inventory-section">
            <div className="section-header">
              <h2>Low Stock Items (Quantity &lt; 3)</h2>
              <div className="alert-badge">
                ⚠️ {lowStockItems.length} items need restocking
              </div>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="no-alerts">
                <h3>✅ All inventory levels are healthy!</h3>
                <p>No items require immediate restocking.</p>
              </div>
            ) : (
              <div className="low-stock-grid">
                {lowStockItems.map(item => (
                  <div key={item.id} className="low-stock-item">
                    <div className="stock-alert">
                      <span className="alert-icon">🚨</span>
                      <span className="stock-level">Only {item.quantityAvailable} left!</span>
                    </div>
                    <div className="item-icon">{item.image}</div>
                    <div className="item-info">
                      <h3>{item.name}</h3>
                      <p className="item-model">{item.model} ({item.modelYear})</p>
                      <p className="item-price">Rs. {item.price.toFixed(2)}</p>
                      <p className="item-category">{item.category}</p>
                    </div>
                    <div className="item-actions">
                      <button 
                        onClick={() => handleOrderMore(item.id)}
                        className="order-btn"
                      >
                        📦 Order More
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="inventory-summary">
              <h3>Inventory Overview</h3>
              <div className="inventory-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Products:</span>
                  <span className="stat-value">{inventoryData.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Low Stock Items:</span>
                  <span className="stat-value critical">{lowStockItems.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Healthy Stock:</span>
                  <span className="stat-value healthy">{inventoryData.length - lowStockItems.length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-section">
            <div className="section-header">
              <h2>Admin Profile</h2>
              <button 
                onClick={() => setShowEditProfile(true)} 
                className="edit-profile-btn"
              >
                ✏️ Edit Profile
              </button>
            </div>
            
            <div className="profile-card">
              <div className="profile-info">
                <div className="profile-item">
                  <span className="profile-label">Username:</span>
                  <span className="profile-value">{user?.username}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{user?.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Role:</span>
                  <span className="profile-value">{user?.role}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Mobile:</span>
                  <span className="profile-value">{user?.mobile}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Department:</span>
                  <span className="profile-value">{user?.department}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Employee ID:</span>
                  <span className="profile-value">{user?.employeeId}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onSave={(updatedProfile: UserProfile) => {
            setUser(updatedProfile);
            localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
            setShowEditProfile(false);
            alert('Profile updated successfully!');
          }}
        />
      )}
    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal: React.FC<{
  user: UserProfile | null;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    department: user?.department || '',
    employeeId: user?.employeeId || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...user!,
      ...formData
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Admin Profile</h2>
          <button onClick={onClose} className="close-modal">×</button>
        </div>
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
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
      </div>
    </div>
  );
};

export default AdminDashboard;