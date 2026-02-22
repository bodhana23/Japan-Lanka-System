import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput, getEmailValidationError } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { AxiosError } from 'axios';
import './EmployeeLogin.css';

interface ApiError {
  detail: string;
}

const EmployeeLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginEmployee } = useAuth();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedEmail = sanitizeInput(e.target.value);
    setEmail(sanitizedEmail);

    // Clear email error when user starts typing
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);

    // Clear password error when user starts typing
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
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

    setIsLoading(true);

    try {
      // Login via AuthContext so context state is updated correctly
      const role = await loginEmployee(email, password);

      // Navigate based on role
      if (role === 'manager') {
        navigate('/manager-dashboard');
      } else if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'auditor') {
        navigate('/auditor-dashboard');
      } else {
        // Unknown role — stay on page and show error instead of redirecting to customer portal
        setErrors({ form: `Unrecognised role "${role}". Please contact your administrator.` });
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response?.status === 429) {
        // Rate limited
        setErrors({ form: axiosError.response.data.detail });
      } else if (axiosError.response?.data?.detail) {
        setErrors({ form: axiosError.response.data.detail });
      } else if (axiosError.message === 'Network Error') {
        setErrors({ form: 'Cannot connect to server. Please make sure the backend is running.' });
      } else {
        setErrors({ form: 'An error occurred during login. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    // Go back to home page
    navigate('/');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="employee-login-container">
      <div className="employee-login-card">
        {/* Go Back */}
        <button className="go-back-btn" onClick={handleGoBack} type="button" disabled={isLoading}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Go Back
        </button>

        {/* Brand header */}
        <div className="emp-brand">
          <div className="emp-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
            </svg>
          </div>
          <div className="emp-brand-text">
            <span className="emp-brand-name">Japan Lanka</span>
            <span className="emp-brand-sub">Automobile Parts</span>
          </div>
        </div>

        {/* Staff badge */}
        <div className="emp-staff-badge">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Staff Portal
        </div>

        {/* Heading */}
        <div className="emp-heading">
          <h2>Employee Sign In</h2>
          <p>Access the management portal</p>
        </div>

        <form onSubmit={handleLogin} className="employee-login-form">
          {errors.form && (
            <div className="form-error-message">
              {errors.form}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your employee email"
              autoComplete="off"
              tabIndex={1}
              required
              disabled={isLoading}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                autoComplete="off"
                tabIndex={2}
                required
                disabled={isLoading}
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="employee-login-btn-submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="info-section">
            <p className="info-text">This portal is for employees only — Manager, Admin &amp; Auditor</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
