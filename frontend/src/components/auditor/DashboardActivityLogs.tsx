import React, { useState, useEffect, useCallback } from 'react';
import { formatDateTime } from '../../utils/dateUtils';
import {
  auditorApi,
  ActivityLog,
  ActivityLogListResponse
} from '../../services/api';
import {
  RefreshCw, ChevronLeft, ChevronRight, Filter,
  CheckCircle, AlertTriangle, Info, XCircle, FileText
} from 'lucide-react';
import './DashboardActivityLogs.css';

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

const PAGE_SIZE = 20;

const DashboardActivityLogs: React.FC = () => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('');

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

  const fetchActivityLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: page,
        page_size: PAGE_SIZE,
      };
      if (typeFilter) {
        params.activity_type = typeFilter;
      }
      if (userTypeFilter) {
        params.user_type = userTypeFilter;
      }
      const response: ActivityLogListResponse = await auditorApi.getActivityLogs(params);
      setActivityLogs(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, userTypeFilter]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  return (
    <div className="activity-logs-section">
      <div className="section-header">
        <h2>Activity Audit Logs</h2>
        <p className="section-description">
          Monitor security-related activities including logins, profile changes, and system actions
        </p>
      </div>

      <div className="logs-controls">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={userTypeFilter}
            onChange={(e) => {
              setUserTypeFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Users</option>
            <option value="customer">Customers</option>
            <option value="employee">Employees</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
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
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
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
            {loading ? (
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

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="pagination-buttons">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="page-number">Page {page} of {totalPages}</span>
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardActivityLogs;
