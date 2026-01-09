import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import './AuditorDashboard.css';

interface UserProfile {
  email: string;
  name: string;
  fullName?: string;
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

const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inventory' | 'activity' | 'financial'>('inventory');
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Sample inventory logs
  const [inventoryLogs] = useState<InventoryLog[]>([
    {
      id: 1,
      productName: 'Brake Pads Set - Toyota Camry',
      action: 'Stock Added',
      user: 'Manager User',
      timestamp: '2025-01-07 10:30:00',
      previousQuantity: 25,
      newQuantity: 50,
      details: 'Added 25 units to inventory'
    },
    {
      id: 2,
      productName: 'Engine Oil Filter - Honda Civic',
      action: 'Stock Updated',
      user: 'Manager User',
      timestamp: '2025-01-07 09:15:00',
      previousQuantity: 10,
      newQuantity: 2,
      details: 'Sold 8 units to customer'
    },
    {
      id: 3,
      productName: 'LED Headlight Bulbs - Ford Focus',
      action: 'Product Added',
      user: 'Manager User',
      timestamp: '2025-01-06 14:20:00',
      newQuantity: 20,
      details: 'New product added to inventory'
    },
    {
      id: 4,
      productName: 'Air Filter - Nissan Altima',
      action: 'Stock Updated',
      user: 'Manager User',
      timestamp: '2025-01-06 11:45:00',
      previousQuantity: 30,
      newQuantity: 28,
      details: 'Sold 2 units to customer'
    },
    {
      id: 5,
      productName: 'Spark Plugs Set - Honda Accord',
      action: 'Price Updated',
      user: 'Manager User',
      timestamp: '2025-01-05 16:30:00',
      details: 'Price changed from Rs. 3000 to Rs. 3200'
    }
  ]);

  // Sample activity logs
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: 1,
      activity: 'User Login',
      user: 'manager@japanlanka.com',
      timestamp: '2025-01-07 10:25:00',
      type: 'success',
      details: 'Successful login from Manager Dashboard'
    },
    {
      id: 2,
      activity: 'Order Status Updated',
      user: 'manager@japanlanka.com',
      timestamp: '2025-01-07 10:20:00',
      type: 'info',
      details: 'Order #ORD-001 status changed to In Progress'
    },
    {
      id: 3,
      activity: 'Product Deleted',
      user: 'manager@japanlanka.com',
      timestamp: '2025-01-07 09:50:00',
      type: 'warning',
      details: 'Product "Wiper Blades" removed from inventory'
    },
    {
      id: 4,
      activity: 'Failed Login Attempt',
      user: 'unknown@domain.com',
      timestamp: '2025-01-07 08:30:00',
      type: 'error',
      details: 'Multiple failed login attempts detected'
    },
    {
      id: 5,
      activity: 'Customer Registration',
      user: 'newcustomer@gmail.com',
      timestamp: '2025-01-06 15:45:00',
      type: 'success',
      details: 'New customer account created'
    },
    {
      id: 6,
      activity: 'Password Changed',
      user: 'customer@gmail.com',
      timestamp: '2025-01-06 14:30:00',
      type: 'info',
      details: 'Customer password successfully updated'
    },
    {
      id: 7,
      activity: 'System Backup',
      user: 'system',
      timestamp: '2025-01-06 02:00:00',
      type: 'success',
      details: 'Automated daily backup completed successfully'
    }
  ]);

  // Check authentication on mount
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
          name: userData.name || userData.fullName || 'Auditor User',
          fullName: userData.fullName || userData.name || 'Auditor User',
          role: userData.role,
          password: userData.password || ''
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

  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  const handleDownloadFinancialStats = () => {
    // Placeholder function for Excel download
    // Backend logic will be implemented later
    alert('Financial stats download will be implemented with backend integration');
    console.log('Download financial stats as Excel - Backend integration pending');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="auditor-dashboard">
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          roleLabel="Auditor"
        />
      )}

      <header className="dashboard-header">
        <div className="header-content">
          <h1>🔍 Auditor Dashboard</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.name}!</span>
            <button
              className="profile-header-btn"
              onClick={() => setShowProfile(true)}
            >
              <span className="profile-btn-icon">👤</span>
              Show Profile
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
          <button
            className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            💰 Financial Stats
          </button>
        </nav>

        {activeTab === 'inventory' && (
          <section className="logs-section">
            <h2>Inventory Logs</h2>
            <div className="logs-table-container">
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
                      <td>
                        <span className="action-badge">{log.action}</span>
                      </td>
                      <td>{log.user}</td>
                      <td className="quantity">{log.previousQuantity ?? '-'}</td>
                      <td className="quantity">{log.newQuantity ?? '-'}</td>
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
            <div className="logs-table-container">
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
                          {getActivityIcon(log.type)}
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

        {activeTab === 'financial' && (
          <section className="logs-section financial-stats-section">
            <h2>Financial Statistics</h2>
            <div className="financial-stats-content">
              <div className="financial-info">
                <div className="info-icon">📊</div>
                <h3>Download Financial Report</h3>
                <p>Export comprehensive financial statistics and reports as an Excel spreadsheet.</p>
                <p className="info-note">The report includes sales data, revenue analytics, order statistics, and inventory valuations.</p>
              </div>
              <button className="download-excel-btn" onClick={handleDownloadFinancialStats}>
                <span className="download-icon">📥</span>
                <span className="download-text">Download Financial Stats (Excel)</span>
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AuditorDashboard;
