import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import { formatDateTime } from '../utils/dateUtils';
import {
  auditorApi,
  InventoryLog,
  ActivityLog,
  InventoryLogListResponse,
  ActivityLogListResponse
} from '../services/api';
import {
  Search, User, Package, BarChart2, DollarSign, CheckCircle,
  AlertTriangle, Info, XCircle, FileText, Download, RefreshCw,
  ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import './AuditorDashboard.css';

interface UserProfile {
  email: string;
  name: string;
  fullName?: string;
  role: string;
  password: string;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  order_placed: 'Order Placed',
  order_status_changed: 'Order Status Changed',
  product_created: 'Product Created',
  product_updated: 'Product Updated',
  product_deleted: 'Product Deleted',
  stock_adjusted: 'Stock Adjusted',
  return_created: 'Return Created',
  return_approved: 'Return Approved',
  return_rejected: 'Return Rejected',
  return_completed: 'Return Completed',
};

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  customer_registered: 'Customer Registered',
  customer_login: 'Customer Login',
  customer_login_failed: 'Customer Login Failed',
  customer_logout: 'Customer Logout',
  customer_password_changed: 'Password Changed',
  customer_password_change_failed: 'Password Change Failed',
  customer_password_reset_requested: 'Password Reset Requested',
  customer_profile_updated: 'Profile Updated',
  customer_google_login: 'Google Login',
  customer_google_registered: 'Google Registration',
  customer_email_verified: 'Email Verified',
  customer_verification_email_resent: 'Verification Email Resent',
  customer_status_updated: 'Status Updated',
  customer_deleted: 'Customer Deleted',
  employee_login: 'Employee Login',
  employee_login_failed: 'Employee Login Failed',
  employee_logout: 'Employee Logout',
  employee_password_reset_requested: 'Password Reset Requested',
  employee_profile_updated: 'Profile Updated',
  employee_google_login: 'Google Login',
  employee_role_updated: 'Role Updated',
  employee_status_updated: 'Status Updated',
  employee_created: 'Employee Created',
  employee_deleted: 'Employee Deleted',
};

const AuditorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inventory' | 'activity' | 'financial'>('inventory');
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // Inventory logs state
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotalPages, setInventoryTotalPages] = useState(1);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [inventoryActionFilter, setInventoryActionFilter] = useState<string>('');

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotalPages, setActivityTotalPages] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('');
  const [activityUserTypeFilter, setActivityUserTypeFilter] = useState<string>('');

  const PAGE_SIZE = 20;

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

  // Fetch inventory logs
  const fetchInventoryLogs = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const params: Record<string, string | number> = {
        page: inventoryPage,
        page_size: PAGE_SIZE,
      };
      if (inventoryActionFilter) {
        params.action_type = inventoryActionFilter;
      }
      const response: InventoryLogListResponse = await auditorApi.getInventoryLogs(params);
      setInventoryLogs(response.items);
      setInventoryTotalPages(response.total_pages);
      setInventoryTotal(response.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory logs';
      setInventoryError(errorMessage);
    } finally {
      setInventoryLoading(false);
    }
  }, [inventoryPage, inventoryActionFilter]);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const params: Record<string, string | number> = {
        page: activityPage,
        page_size: PAGE_SIZE,
      };
      if (activityTypeFilter) {
        params.activity_type = activityTypeFilter;
      }
      if (activityUserTypeFilter) {
        params.user_type = activityUserTypeFilter;
      }
      const response: ActivityLogListResponse = await auditorApi.getActivityLogs(params);
      setActivityLogs(response.items);
      setActivityTotalPages(response.total_pages);
      setActivityTotal(response.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity logs';
      setActivityError(errorMessage);
    } finally {
      setActivityLoading(false);
    }
  }, [activityPage, activityTypeFilter, activityUserTypeFilter]);

  // Fetch logs when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'inventory') {
      fetchInventoryLogs();
    } else if (activeTab === 'activity') {
      fetchActivityLogs();
    }
  }, [activeTab, fetchInventoryLogs, fetchActivityLogs]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    navigate('/');
  };

  const getActivityTypeClass = (activityType: string): string => {
    if (activityType.includes('failed') || activityType.includes('deleted')) {
      return 'error';
    }
    if (activityType.includes('login') || activityType.includes('registered') || activityType.includes('created')) {
      return 'success';
    }
    if (activityType.includes('reset') || activityType.includes('changed')) {
      return 'warning';
    }
    return 'info';
  };

  const getActivityIcon = (activityType: string) => {
    const type = getActivityTypeClass(activityType);
    switch (type) {
      case 'success': return <CheckCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'info': return <Info size={16} />;
      case 'error': return <XCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const handleDownloadFinancialStats = () => {
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
          <h1><Search size={24} /> Auditor Dashboard</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.name}!</span>
            <button
              className="profile-header-btn"
              onClick={() => setShowProfile(true)}
            >
              <User size={16} className="profile-btn-icon" />
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
            <Package size={16} /> Inventory Logs
          </button>
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <BarChart2 size={16} /> Activity Logs
          </button>
          <button
            className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => setActiveTab('financial')}
          >
            <DollarSign size={16} /> Financial Stats
          </button>
        </nav>

        {activeTab === 'inventory' && (
          <section className="logs-section">
            <div className="logs-header">
              <h2>Inventory Logs</h2>
              <div className="logs-actions">
                <div className="filter-group">
                  <Filter size={16} />
                  <select
                    value={inventoryActionFilter}
                    onChange={(e) => {
                      setInventoryActionFilter(e.target.value);
                      setInventoryPage(1);
                    }}
                    className="filter-select"
                  >
                    <option value="">All Actions</option>
                    <option value="order_placed">Order Placed</option>
                    <option value="order_status_changed">Order Status Changed</option>
                    <option value="product_created">Product Created</option>
                    <option value="product_updated">Product Updated</option>
                    <option value="product_deleted">Product Deleted</option>
                    <option value="stock_adjusted">Stock Adjusted</option>
                    <option value="return_created">Return Created</option>
                    <option value="return_approved">Return Approved</option>
                    <option value="return_rejected">Return Rejected</option>
                    <option value="return_completed">Return Completed</option>
                  </select>
                </div>
                <button
                  className="refresh-btn"
                  onClick={fetchInventoryLogs}
                  disabled={inventoryLoading}
                >
                  <RefreshCw size={16} className={inventoryLoading ? 'spinning' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {inventoryError && (
              <div className="error-message">{inventoryError}</div>
            )}

            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Description</th>
                    <th>Related Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryLoading ? (
                    <tr>
                      <td colSpan={5} className="loading-cell">Loading...</td>
                    </tr>
                  ) : inventoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-cell">No inventory logs found</td>
                    </tr>
                  ) : (
                    inventoryLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="timestamp">{formatDateTime(log.created_at)}</td>
                        <td>
                          <span className={`action-badge action-${log.action_type}`}>
                            {ACTION_TYPE_LABELS[log.action_type] || log.action_type}
                          </span>
                        </td>
                        <td>
                          <div className="user-info">
                            <span className="user-name">{log.actor_name || 'System'}</span>
                            {log.actor_email && (
                              <span className="user-email">{log.actor_email}</span>
                            )}
                            {log.actor_type && (
                              <span className={`user-type-badge ${log.actor_type}`}>
                                {log.actor_type}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="description">{log.description}</td>
                        <td>
                          {log.related_entity_type && (
                            <div className="related-entity">
                              <span className={`entity-type-badge ${log.related_entity_type}`}>
                                {log.related_entity_type}
                              </span>
                              {log.related_entity_summary && (
                                <span className="entity-summary">{log.related_entity_summary}</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {inventoryTotalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  Showing {((inventoryPage - 1) * PAGE_SIZE) + 1} - {Math.min(inventoryPage * PAGE_SIZE, inventoryTotal)} of {inventoryTotal}
                </span>
                <div className="pagination-buttons">
                  <button
                    className="pagination-btn"
                    onClick={() => setInventoryPage(p => p - 1)}
                    disabled={inventoryPage <= 1}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="page-number">Page {inventoryPage} of {inventoryTotalPages}</span>
                  <button
                    className="pagination-btn"
                    onClick={() => setInventoryPage(p => p + 1)}
                    disabled={inventoryPage >= inventoryTotalPages}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'activity' && (
          <section className="logs-section">
            <div className="logs-header">
              <h2>Activity Logs</h2>
              <div className="logs-actions">
                <div className="filter-group">
                  <Filter size={16} />
                  <select
                    value={activityUserTypeFilter}
                    onChange={(e) => {
                      setActivityUserTypeFilter(e.target.value);
                      setActivityPage(1);
                    }}
                    className="filter-select"
                  >
                    <option value="">All Users</option>
                    <option value="customer">Customers</option>
                    <option value="employee">Employees</option>
                  </select>
                  <select
                    value={activityTypeFilter}
                    onChange={(e) => {
                      setActivityTypeFilter(e.target.value);
                      setActivityPage(1);
                    }}
                    className="filter-select"
                  >
                    <option value="">All Activities</option>
                    <optgroup label="Customer Activities">
                      <option value="customer_registered">Registration</option>
                      <option value="customer_login">Login</option>
                      <option value="customer_login_failed">Login Failed</option>
                      <option value="customer_google_login">Google Login</option>
                      <option value="customer_password_changed">Password Changed</option>
                      <option value="customer_profile_updated">Profile Updated</option>
                      <option value="customer_status_updated">Status Updated</option>
                      <option value="customer_deleted">Deleted</option>
                    </optgroup>
                    <optgroup label="Employee Activities">
                      <option value="employee_login">Login</option>
                      <option value="employee_login_failed">Login Failed</option>
                      <option value="employee_google_login">Google Login</option>
                      <option value="employee_profile_updated">Profile Updated</option>
                      <option value="employee_role_updated">Role Updated</option>
                      <option value="employee_status_updated">Status Updated</option>
                      <option value="employee_created">Created</option>
                      <option value="employee_deleted">Deleted</option>
                    </optgroup>
                  </select>
                </div>
                <button
                  className="refresh-btn"
                  onClick={fetchActivityLogs}
                  disabled={activityLoading}
                >
                  <RefreshCw size={16} className={activityLoading ? 'spinning' : ''} />
                  Refresh
                </button>
              </div>
            </div>

            {activityError && (
              <div className="error-message">{activityError}</div>
            )}

            <div className="logs-table-container">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Timestamp</th>
                    <th>Activity</th>
                    <th>User</th>
                    <th>Description</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLoading ? (
                    <tr>
                      <td colSpan={6} className="loading-cell">Loading...</td>
                    </tr>
                  ) : activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-cell">No activity logs found</td>
                    </tr>
                  ) : (
                    activityLogs.map((log) => (
                      <tr key={log.id} className={`log-row-${getActivityTypeClass(log.activity_type)}`}>
                        <td className="log-type">
                          <span className={`log-icon log-${getActivityTypeClass(log.activity_type)}`}>
                            {getActivityIcon(log.activity_type)}
                          </span>
                        </td>
                        <td className="timestamp">{formatDateTime(log.created_at)}</td>
                        <td>
                          <span className={`activity-badge activity-${getActivityTypeClass(log.activity_type)}`}>
                            {ACTIVITY_TYPE_LABELS[log.activity_type] || log.activity_type}
                          </span>
                        </td>
                        <td>
                          <div className="user-info">
                            <span className="user-name">{log.user_name || 'Unknown'}</span>
                            {log.user_email && (
                              <span className="user-email">{log.user_email}</span>
                            )}
                            {log.user_type && (
                              <span className={`user-type-badge ${log.user_type}`}>
                                {log.user_type}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="description">{log.description}</td>
                        <td className="ip-address">{log.ip_address || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {activityTotalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  Showing {((activityPage - 1) * PAGE_SIZE) + 1} - {Math.min(activityPage * PAGE_SIZE, activityTotal)} of {activityTotal}
                </span>
                <div className="pagination-buttons">
                  <button
                    className="pagination-btn"
                    onClick={() => setActivityPage(p => p - 1)}
                    disabled={activityPage <= 1}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="page-number">Page {activityPage} of {activityTotalPages}</span>
                  <button
                    className="pagination-btn"
                    onClick={() => setActivityPage(p => p + 1)}
                    disabled={activityPage >= activityTotalPages}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'financial' && (
          <section className="logs-section financial-stats-section">
            <h2>Financial Statistics</h2>
            <div className="financial-stats-content">
              <div className="financial-info">
                <div className="info-icon"><BarChart2 size={48} /></div>
                <h3>Download Financial Report</h3>
                <p>Export comprehensive financial statistics and reports as an Excel spreadsheet.</p>
                <p className="info-note">The report includes sales data, revenue analytics, order statistics, and inventory valuations.</p>
              </div>
              <button className="download-excel-btn" onClick={handleDownloadFinancialStats}>
                <Download size={16} className="download-icon" />
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
