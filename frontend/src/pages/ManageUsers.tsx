import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput, getEmailValidationError } from '../utils/validation';
import {
  Users, Briefcase, Search, User, Mail, Lock, CheckCircle,
  Trash2, UserCheck, UserX, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, X
} from 'lucide-react';
import { usersApi, Customer, Employee } from '../services/api';
import './ManageUsers.css';

interface UserForm {
  name: string;
  email: string;
  password: string;
}

type TabType = 'customers' | 'employees';

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('customers');

  // Form states
  const [activeForm, setActiveForm] = useState<'manager' | 'auditor' | null>(null);
  const [managerForm, setManagerForm] = useState<UserForm>({ name: '', email: '', password: '' });
  const [auditorForm, setAuditorForm] = useState<UserForm>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // User list states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination
  const [customerPage, setCustomerPage] = useState(1);
  const [employeePage, setEmployeePage] = useState(1);
  const [customerTotalPages, setCustomerTotalPages] = useState(1);
  const [employeeTotalPages, setEmployeeTotalPages] = useState(1);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [employeeTotal, setEmployeeTotal] = useState(0);

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{type: 'customer' | 'employee', id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch customers
  const fetchCustomers = async (page: number = 1, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getCustomers({
        page,
        page_size: 10,
        search: search || undefined
      });
      setCustomers(response.items);
      setCustomerTotalPages(response.total_pages);
      setCustomerTotal(response.total);
      setCustomerPage(page);
    } catch (err: any) {
      console.error('Error fetching customers:', err);
      setError(err.response?.data?.detail || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees
  const fetchEmployees = async (page: number = 1, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersApi.getEmployees({
        page,
        page_size: 10,
        search: search || undefined
      });
      setEmployees(response.items);
      setEmployeeTotalPages(response.total_pages);
      setEmployeeTotal(response.total);
      setEmployeePage(page);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.response?.data?.detail || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers(1, searchTerm);
    } else {
      fetchEmployees(1, searchTerm);
    }
  }, [activeTab]);

  // Search handler
  const handleSearch = () => {
    if (activeTab === 'customers') {
      fetchCustomers(1, searchTerm);
    } else {
      fetchEmployees(1, searchTerm);
    }
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setManagerForm(prev => ({ ...prev, [name]: sanitizedValue }));

    if (errors[`manager_${name}`]) {
      setErrors(prev => ({ ...prev, [`manager_${name}`]: '' }));
    }
  };

  const handleAuditorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setAuditorForm(prev => ({ ...prev, [name]: sanitizedValue }));

    if (errors[`auditor_${name}`]) {
      setErrors(prev => ({ ...prev, [`auditor_${name}`]: '' }));
    }
  };

  const validateManagerForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!managerForm.name.trim()) {
      newErrors.manager_name = 'Manager name is required';
    } else if (managerForm.name.trim().length < 2) {
      newErrors.manager_name = 'Name must be at least 2 characters long';
    }

    const emailError = getEmailValidationError(managerForm.email);
    if (emailError) {
      newErrors.manager_email = emailError;
    }

    if (!managerForm.password || managerForm.password.length < 6) {
      newErrors.manager_password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAuditorForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!auditorForm.name.trim()) {
      newErrors.auditor_name = 'Auditor name is required';
    } else if (auditorForm.name.trim().length < 2) {
      newErrors.auditor_name = 'Name must be at least 2 characters long';
    }

    const emailError = getEmailValidationError(auditorForm.email);
    if (emailError) {
      newErrors.auditor_email = emailError;
    }

    if (!auditorForm.password || auditorForm.password.length < 6) {
      newErrors.auditor_password = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateManagerForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.createStaff({
        email: managerForm.email.trim().toLowerCase(),
        full_name: managerForm.name.trim(),
        password: managerForm.password,
        role: 'MANAGER'
      });

      setSuccessMessage(`Manager "${response.full_name}" created successfully!`);
      setManagerForm({ name: '', email: '', password: '' });
      setActiveForm(null);

      // Refresh employees list if on employees tab
      if (activeTab === 'employees') {
        fetchEmployees(1);
      }

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error creating manager:', err);
      setErrors({ manager_email: err.response?.data?.detail || 'Failed to create manager' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAuditor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAuditorForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await usersApi.createStaff({
        email: auditorForm.email.trim().toLowerCase(),
        full_name: auditorForm.name.trim(),
        password: auditorForm.password,
        role: 'AUDITOR'
      });

      setSuccessMessage(`Auditor "${response.full_name}" created successfully!`);
      setAuditorForm({ name: '', email: '', password: '' });
      setActiveForm(null);

      // Refresh employees list if on employees tab
      if (activeTab === 'employees') {
        fetchEmployees(1);
      }

      // Auto-hide success message
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error creating auditor:', err);
      setErrors({ auditor_email: err.response?.data?.detail || 'Failed to create auditor' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelManager = () => {
    setManagerForm({ name: '', email: '', password: '' });
    setErrors({});
    setActiveForm(null);
  };

  const handleCancelAuditor = () => {
    setAuditorForm({ name: '', email: '', password: '' });
    setErrors({});
    setActiveForm(null);
  };

  // Delete handlers
  const handleDeleteClick = (type: 'customer' | 'employee', id: string, name: string) => {
    setDeleteConfirm({ type, id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    setError(null);

    try {
      if (deleteConfirm.type === 'customer') {
        await usersApi.deleteCustomer(deleteConfirm.id);
        setSuccessMessage(`Customer "${deleteConfirm.name}" deleted successfully`);
        fetchCustomers(customerPage, searchTerm);
      } else {
        await usersApi.deleteEmployee(deleteConfirm.id);
        setSuccessMessage(`Employee "${deleteConfirm.name}" deleted successfully`);
        fetchEmployees(employeePage, searchTerm);
      }

      setDeleteConfirm(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  // Toggle user status
  const handleToggleStatus = async (type: 'customer' | 'employee', id: string, currentStatus: boolean) => {
    setError(null);
    try {
      if (type === 'customer') {
        await usersApi.updateCustomerStatus(id, !currentStatus);
        fetchCustomers(customerPage, searchTerm);
      } else {
        await usersApi.updateEmployeeStatus(id, !currentStatus);
        fetchEmployees(employeePage, searchTerm);
      }
      setSuccessMessage(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.detail || 'Failed to update user status');
    }
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  return (
    <div className="manage-users-container">
      <header className="manage-users-header">
        <div className="header-content">
          <h1><Users size={24} /> Manage Users</h1>
          <button onClick={handleBackToDashboard} className="back-btn">
            <ChevronLeft size={18} /> Back to Dashboard
          </button>
        </div>
      </header>

      <main className="manage-users-main">
        {/* Success Message */}
        {successMessage && (
          <div className="success-banner">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="close-banner" aria-label="Close success message">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="close-banner" aria-label="Close error message">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Add Staff Section */}
        <div className="intro-section">
          <h2>Add New Staff Members</h2>
          <p>Create new Manager or Auditor accounts for Japan Lanka Enterprises</p>
        </div>

        <div className="user-type-selection">
          <div className="user-type-card">
            <div className="user-type-icon"><Briefcase size={32} /></div>
            <h3>Manager</h3>
            <p>Manages inventory, orders, and returns</p>
            <button
              onClick={() => setActiveForm('manager')}
              className="select-user-btn manager-btn"
            >
              + Add New Manager
            </button>
          </div>

          <div className="user-type-card">
            <div className="user-type-icon"><Search size={32} /></div>
            <h3>Auditor</h3>
            <p>Reviews logs and monitors activities</p>
            <button
              onClick={() => setActiveForm('auditor')}
              className="select-user-btn auditor-btn"
            >
              + Add New Auditor
            </button>
          </div>
        </div>

        {/* Manager Form */}
        {activeForm === 'manager' && (
          <div className="user-form-section">
            <div className="form-card">
              <div className="form-header">
                <h3><Briefcase size={20} /> Create New Manager Account</h3>
              </div>
              <form onSubmit={handleAddManager} className="user-form">
                <div className="form-group">
                  <label htmlFor="manager-name">
                    <User size={16} className="label-icon" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="manager-name"
                    name="name"
                    value={managerForm.name}
                    onChange={handleManagerChange}
                    placeholder="Enter manager's full name"
                    required
                    className={errors.manager_name ? 'error' : ''}
                  />
                  {errors.manager_name && (
                    <span className="error-message">{errors.manager_name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="manager-email">
                    <Mail size={16} className="label-icon" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="manager-email"
                    name="email"
                    value={managerForm.email}
                    onChange={handleManagerChange}
                    placeholder="manager@example.com"
                    required
                    className={errors.manager_email ? 'error' : ''}
                  />
                  {errors.manager_email && (
                    <span className="error-message">{errors.manager_email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="manager-password">
                    <Lock size={16} className="label-icon" />
                    Password *
                  </label>
                  <input
                    type="password"
                    id="manager-password"
                    name="password"
                    value={managerForm.password}
                    onChange={handleManagerChange}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className={errors.manager_password ? 'error' : ''}
                  />
                  {errors.manager_password && (
                    <span className="error-message">{errors.manager_password}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn manager-submit" disabled={loading}>
                    {loading ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}
                    {loading ? 'Creating...' : 'Create Manager Account'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelManager}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Auditor Form */}
        {activeForm === 'auditor' && (
          <div className="user-form-section">
            <div className="form-card">
              <div className="form-header">
                <h3><Search size={20} /> Create New Auditor Account</h3>
              </div>
              <form onSubmit={handleAddAuditor} className="user-form">
                <div className="form-group">
                  <label htmlFor="auditor-name">
                    <User size={16} className="label-icon" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="auditor-name"
                    name="name"
                    value={auditorForm.name}
                    onChange={handleAuditorChange}
                    placeholder="Enter auditor's full name"
                    required
                    className={errors.auditor_name ? 'error' : ''}
                  />
                  {errors.auditor_name && (
                    <span className="error-message">{errors.auditor_name}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="auditor-email">
                    <span className="label-icon"><Mail size={16} /></span>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="auditor-email"
                    name="email"
                    value={auditorForm.email}
                    onChange={handleAuditorChange}
                    placeholder="auditor@example.com"
                    required
                    className={errors.auditor_email ? 'error' : ''}
                  />
                  {errors.auditor_email && (
                    <span className="error-message">{errors.auditor_email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="auditor-password">
                    <span className="label-icon"><Lock size={16} /></span>
                    Password *
                  </label>
                  <input
                    type="password"
                    id="auditor-password"
                    name="password"
                    value={auditorForm.password}
                    onChange={handleAuditorChange}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className={errors.auditor_password ? 'error' : ''}
                  />
                  {errors.auditor_password && (
                    <span className="error-message">{errors.auditor_password}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn auditor-submit" disabled={loading}>
                    {loading ? <RefreshCw size={16} className="spin" /> : <CheckCircle size={16} />}
                    {loading ? 'Creating...' : 'Create Auditor Account'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAuditor}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User List Section */}
        <div className="users-list-section">
          <div className="section-header">
            <h2>All Users</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
              />
              <button onClick={handleSearch} className="search-btn">
                <Search size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => setActiveTab('customers')}
            >
              <User size={18} />
              Customers ({customerTotal})
            </button>
            <button
              className={`tab ${activeTab === 'employees' ? 'active' : ''}`}
              onClick={() => setActiveTab('employees')}
            >
              <Briefcase size={18} />
              Employees ({employeeTotal})
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <RefreshCw size={24} className="spin" />
              <span>Loading users...</span>
            </div>
          )}

          {/* Customers Table */}
          {activeTab === 'customers' && !loading && (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-data">No customers found</td>
                      </tr>
                    ) : (
                      customers.map(customer => (
                        <tr key={customer.id}>
                          <td className="name-cell">
                            <User size={16} />
                            {customer.full_name}
                          </td>
                          <td>{customer.email}</td>
                          <td>{customer.phone_number || '-'}</td>
                          <td>
                            <span className={`status-badge ${customer.is_active ? 'active' : 'inactive'}`}>
                              {customer.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button
                              onClick={() => handleToggleStatus('customer', customer.id, customer.is_active)}
                              className={`action-btn ${customer.is_active ? 'deactivate' : 'activate'}`}
                              title={customer.is_active ? 'Deactivate' : 'Activate'}
                              aria-label={customer.is_active ? `Deactivate ${customer.full_name}` : `Activate ${customer.full_name}`}
                            >
                              {customer.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteClick('customer', customer.id, customer.full_name)}
                              className="action-btn delete"
                              title="Delete"
                              aria-label={`Delete customer ${customer.full_name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {customerTotalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchCustomers(customerPage - 1, searchTerm)}
                    disabled={customerPage === 1}
                    className="page-btn"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="page-info">
                    Page {customerPage} of {customerTotalPages}
                  </span>
                  <button
                    onClick={() => fetchCustomers(customerPage + 1, searchTerm)}
                    disabled={customerPage === customerTotalPages}
                    className="page-btn"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Employees Table */}
          {activeTab === 'employees' && !loading && (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="no-data">No employees found</td>
                      </tr>
                    ) : (
                      employees.map(employee => (
                        <tr key={employee.id}>
                          <td className="name-cell">
                            <Briefcase size={16} />
                            {employee.full_name}
                          </td>
                          <td>{employee.email}</td>
                          <td>
                            <span className={`role-badge ${employee.role.toLowerCase()}`}>
                              {formatRole(employee.role)}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${employee.is_active ? 'active' : 'inactive'}`}>
                              {employee.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button
                              onClick={() => handleToggleStatus('employee', employee.id, employee.is_active)}
                              className={`action-btn ${employee.is_active ? 'deactivate' : 'activate'}`}
                              title={employee.is_active ? 'Deactivate' : 'Activate'}
                              aria-label={employee.is_active ? `Deactivate ${employee.full_name}` : `Activate ${employee.full_name}`}
                            >
                              {employee.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteClick('employee', employee.id, employee.full_name)}
                              className="action-btn delete"
                              title="Delete"
                              aria-label={`Delete employee ${employee.full_name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {employeeTotalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchEmployees(employeePage - 1, searchTerm)}
                    disabled={employeePage === 1}
                    className="page-btn"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="page-info">
                    Page {employeePage} of {employeeTotalPages}
                  </span>
                  <button
                    onClick={() => fetchEmployees(employeePage + 1, searchTerm)}
                    disabled={employeePage === employeeTotalPages}
                    className="page-btn"
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-icon delete">
              <Trash2 size={32} />
            </div>
            <h3>Delete {deleteConfirm.type === 'customer' ? 'Customer' : 'Employee'}</h3>
            <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?</p>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                onClick={handleDeleteConfirm}
                className="confirm-delete-btn"
                disabled={deleting}
              >
                {deleting ? <RefreshCw size={16} className="spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={handleDeleteCancel} className="cancel-modal-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
