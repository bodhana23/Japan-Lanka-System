import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput, getEmailValidationError } from '../utils/validation';
import './EmployeeLogin.css';

const EmployeeLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedEmail = sanitizeInput(e.target.value);
    setEmail(sanitizedEmail);

    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedPassword = sanitizeInput(e.target.value);
    setPassword(sanitizedPassword);

    // Clear password error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    const newErrors: {[key: string]: string} = {};

    // Enhanced validation with specific error messages
    const emailError = getEmailValidationError(email);
    if (emailError) {
      newErrors.email = emailError;
    }

    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    // If there are validation errors, display them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Check registered users for staff roles only (manager, admin, auditor)
      const registeredUsersStr = localStorage.getItem('registeredUsers') || '[]';
      const registeredUsers = JSON.parse(registeredUsersStr);

      // Validate registeredUsers is an array
      if (Array.isArray(registeredUsers)) {
        const registeredUser = registeredUsers.find((user: any) => {
          if (!user || typeof user !== 'object' || !user.email || !user.password) {
            return false;
          }
          // Only allow manager, admin, or auditor roles
          const isStaff = ['manager', 'admin', 'auditor'].includes(user.role);
          return isStaff && user.email.toLowerCase() === email.toLowerCase() && user.password === password;
        });

        if (registeredUser) {
          // Store user info in localStorage for session management
          const userData = {
            email: registeredUser.email,
            fullName: registeredUser.fullName,
            role: registeredUser.role,
            phoneNumber: registeredUser.phoneNumber,
            password: registeredUser.password
          };

          localStorage.setItem('currentUser', JSON.stringify(userData));

          // Navigate based on role
          switch (registeredUser.role) {
            case 'manager':
              navigate('/manager-dashboard');
              break;
            case 'admin':
              navigate('/admin-dashboard');
              break;
            case 'auditor':
              navigate('/auditor-dashboard');
              break;
            default:
              navigate('/');
          }
          return;
        }
      }

      // Hardcoded staff credentials
      if (email === 'manager1@gmail.com' && password === 'manager@1') {
        const userData = {
          email: 'manager1@gmail.com',
          fullName: 'Manager User',
          role: 'manager',
          phoneNumber: '0112345678',
          password: 'manager@1'
        };

        localStorage.setItem('currentUser', JSON.stringify(userData));
        navigate('/manager-dashboard');
        return;
      }

      if (email === 'admin@gmail.com' && password === 'admin@1') {
        const userData = {
          email: 'admin@gmail.com',
          fullName: 'Administrator',
          role: 'admin',
          phoneNumber: '0112345679',
          password: 'admin@1'
        };

        localStorage.setItem('currentUser', JSON.stringify(userData));
        navigate('/admin-dashboard');
        return;
      }

      if (email === 'auditor1@gmail.com' && password === 'auditor@1') {
        const userData = {
          email: 'auditor1@gmail.com',
          fullName: 'Auditor User',
          role: 'auditor',
          phoneNumber: '0112345680',
          password: 'auditor@1'
        };

        localStorage.setItem('currentUser', JSON.stringify(userData));
        navigate('/auditor-dashboard');
        return;
      }

      // Invalid credentials
      alert('Invalid employee credentials. Please check your email and password.');

    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleGoBack = () => {
    // Go back to home page
    navigate('/');
  };

  return (
    <div className="employee-login-container">
      <div className="employee-login-card">
        <button className="go-back-btn" onClick={handleGoBack} type="button">
          ← Go Back
        </button>
        <div className="company-header">
          <h1>Japan Lanka Enterprises</h1>
          <p>Management System</p>
        </div>

        <form onSubmit={handleLogin} className="employee-login-form">
          <h2>Employee Login</h2>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your employee email"
              autoComplete="email"
              tabIndex={1}
              required
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              tabIndex={2}
              required
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="employee-login-btn-submit">
            Login
          </button>

          <div className="info-section">
            <p className="info-text">This portal is for employees only (Manager, Admin, Auditor)</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
