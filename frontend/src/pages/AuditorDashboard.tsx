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

  // TODO: Replace with API call when audit logs endpoint is available
  // Currently no logs - will be populated from backend when audit logging is implemented
  const [inventoryLogs] = useState<InventoryLog[]>([]);

  // TODO: Replace with API call when activity logs endpoint is available
  // Currently no logs - will be populated from backend when activity logging is implemented
  const [activityLogs] = useState<ActivityLog[]>([]);

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
