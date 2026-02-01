import React, { useState } from 'react';
import {
  Users, Search, Plus, Trash2, CheckCircle, AlertTriangle,
  Clock, Briefcase, ClipboardList, User as UserIcon
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import './DashboardUsers.css';

interface UserDisplay {
  id: string;
  fullName: string;
  email: string;
  role: 'manager' | 'auditor' | 'customer' | 'admin';
  userType: 'customer' | 'employee';
  dateCreated: string;
  status: 'active' | 'inactive';
}

interface DashboardUsersProps {
  users: UserDisplay[];
  isLoading: boolean;
  error: string | null;
  onToggleStatus: (user: UserDisplay) => void;
  onDeleteUser: (user: UserDisplay) => void;
  onAddUser: () => void;
  onRetry: () => void;
}

const DashboardUsers: React.FC<DashboardUsersProps> = ({
  users,
  isLoading,
  error,
  onToggleStatus,
  onDeleteUser,
  onAddUser,
  onRetry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'manager' | 'auditor' | 'customer' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'role'>('date');

  // Filter and sort users
  const filteredUsers = React.useMemo(() => {
    let filtered = users;

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'date':
          return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
        case 'role':
          return a.role.localeCompare(b.role);
        default:
          return 0;
      }
    });

    return filtered;
  }, [users, roleFilter, searchQuery, sortBy]);

  return (
    <div className="admin-users-container">
      <div className="admin-users-header">
        <div className="admin-users-title-section">
          <h2 className="admin-users-title">
            <Users size={24} className="admin-users-icon" />
            User Management
          </h2>
          <p className="admin-users-subtitle">Manage all users in the system</p>
        </div>
        <button className="admin-add-user-btn" onClick={onAddUser}>
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="admin-users-controls">
        <div className="admin-search-box">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="admin-filter-select"
        >
          <option value="all">All Roles</option>
          <option value="manager">Managers</option>
          <option value="auditor">Auditors</option>
          <option value="admin">Admins</option>
          <option value="customer">Customers</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="admin-filter-select"
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="role">Sort by Role</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="admin-loading-state">
          <Clock size={32} className="admin-loading-icon" />
          <p>Loading users...</p>
        </div>
      ) : error ? (
        <div className="admin-error-state">
          <AlertTriangle size={32} />
          <p>{error}</p>
          <button onClick={onRetry} className="admin-retry-btn">Try Again</button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-empty-state">
          <Search size={48} />
          <h3>No users found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      ) : (
        <div className="admin-users-table-container">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Date Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className={user.status === 'inactive' ? 'admin-inactive-row' : ''}>
                  <td>
                    <span className={`admin-user-type-badge admin-type-${user.userType}`}>
                      {user.userType === 'employee' ? 'Staff' : 'Customer'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-user-name-cell">
                      <div className="admin-user-avatar-small">
                        {user.fullName.charAt(0)}
                      </div>
                      <span>{user.fullName}</span>
                    </div>
                  </td>
                  <td className="admin-email-cell">{user.email}</td>
                  <td>
                    <span className={`admin-role-badge admin-role-${user.role}`}>
                      {user.role === 'manager' && <Briefcase size={14} />}
                      {user.role === 'auditor' && <ClipboardList size={14} />}
                      {user.role === 'customer' && <UserIcon size={14} />}
                      {user.role === 'admin' && <Users size={14} />}
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(user.dateCreated)}</td>
                  <td>
                    <button
                      className={`admin-status-toggle admin-status-${user.status}`}
                      onClick={() => onToggleStatus(user)}
                      disabled={user.role === 'admin'}
                    >
                      {user.status === 'active' ? (
                        <><CheckCircle size={14} /> Active</>
                      ) : (
                        <><AlertTriangle size={14} /> Inactive</>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      className="admin-delete-btn"
                      onClick={() => onDeleteUser(user)}
                      title="Delete user"
                      aria-label={`Delete user ${user.fullName}`}
                      disabled={user.role === 'admin'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Summary */}
      <div className="admin-users-summary">
        <span className="admin-summary-label">Showing:</span>
        <span className="admin-summary-value">{filteredUsers.length} of {users.length} users</span>
      </div>
    </div>
  );
};

export default DashboardUsers;
