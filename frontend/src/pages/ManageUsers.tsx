import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput, getEmailValidationError } from '../utils/validation';
import { Users, Briefcase, Search, User, Mail, Lock, CheckCircle } from 'lucide-react';
import './ManageUsers.css';

interface UserForm {
  name: string;
  email: string;
  password: string;
}

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState<'manager' | 'auditor' | null>(null);
  const [managerForm, setManagerForm] = useState<UserForm>({ name: '', email: '', password: '' });
  const [auditorForm, setAuditorForm] = useState<UserForm>({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleBackToDashboard = () => {
    navigate('/admin-dashboard');
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setManagerForm(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[`manager_${name}`]) {
      setErrors(prev => ({ ...prev, [`manager_${name}`]: '' }));
    }
  };

  const handleAuditorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setAuditorForm(prev => ({ ...prev, [name]: sanitizedValue }));
    
    // Clear error when user starts typing
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

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateManagerForm()) {
      return;
    }

    try {
      // Get existing users
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

      // Check if email already exists
      const emailExists = registeredUsers.some((user: any) => 
        user.email.toLowerCase() === managerForm.email.toLowerCase()
      );

      if (emailExists) {
        setErrors({ manager_email: 'An account with this email already exists' });
        return;
      }

      // Create new manager user
      const newManager = {
        email: managerForm.email.trim().toLowerCase(),
        name: managerForm.name.trim(),
        fullName: managerForm.name.trim(),
        role: 'manager',
        password: managerForm.password
      };

      // Add to registered users
      registeredUsers.push(newManager);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

      alert(`Manager "${newManager.name}" created successfully!\n\nLogin Credentials:\nEmail: ${newManager.email}\nPassword: ${newManager.password}\n\nThey can now login to the system.`);

      // Reset form
      setManagerForm({ name: '', email: '', password: '' });
      setActiveForm(null);
    } catch (error) {
      console.error('Error creating manager:', error);
      alert('An error occurred while creating the manager. Please try again.');
    }
  };

  const handleAddAuditor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAuditorForm()) {
      return;
    }

    try {
      // Get existing users
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

      // Check if email already exists
      const emailExists = registeredUsers.some((user: any) => 
        user.email.toLowerCase() === auditorForm.email.toLowerCase()
      );

      if (emailExists) {
        setErrors({ auditor_email: 'An account with this email already exists' });
        return;
      }

      // Create new auditor user
      const newAuditor = {
        email: auditorForm.email.trim().toLowerCase(),
        name: auditorForm.name.trim(),
        fullName: auditorForm.name.trim(),
        role: 'auditor',
        password: auditorForm.password
      };

      // Add to registered users
      registeredUsers.push(newAuditor);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

      alert(`Auditor "${newAuditor.name}" created successfully!\n\nLogin Credentials:\nEmail: ${newAuditor.email}\nPassword: ${newAuditor.password}\n\nThey can now login to the system.`);

      // Reset form
      setAuditorForm({ name: '', email: '', password: '' });
      setActiveForm(null);
    } catch (error) {
      console.error('Error creating auditor:', error);
      alert('An error occurred while creating the auditor. Please try again.');
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

  return (
    <div className="manage-users-container">
      <header className="manage-users-header">
        <div className="header-content">
          <h1><Users size={24} /> Manage Users</h1>
          <button onClick={handleBackToDashboard} className="back-btn">
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="manage-users-main">
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
                  <button type="submit" className="submit-btn manager-submit">
                    <CheckCircle size={16} /> Create Manager Account
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
                  <button type="submit" className="submit-btn auditor-submit">
                    <CheckCircle size={16} /> Create Auditor Account
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
      </main>
    </div>
  );
};

export default ManageUsers;
