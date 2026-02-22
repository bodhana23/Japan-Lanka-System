import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sanitizeInput, getEmailValidationError } from '../utils/validation';
import { AxiosError } from 'axios';
import './Login.css';

interface ApiError {
  detail: string;
}

interface PendingRegistration {
  email: string;
  full_name: string;
  phone_number: string | null;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signInWithGoogle, completeRegistrationAndLogin } = useAuth();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedEmail = sanitizeInput(e.target.value);
    setEmail(sanitizedEmail);
    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: {[key: string]: string} = {};

    const emailError = getEmailValidationError(email);
    if (emailError) newErrors.email = emailError;
    if (!password || password.length < 6) newErrors.password = 'Password must be at least 6 characters long';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      localStorage.removeItem('pendingRegistration');
      navigateAfterLogin();
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;

      if (axiosError.response?.status === 401) {
        const pendingDataStr = localStorage.getItem('pendingRegistration');
        if (pendingDataStr) {
          try {
            const pendingData: PendingRegistration = JSON.parse(pendingDataStr);
            if (pendingData.email === email.trim().toLowerCase()) {
              try {
                await completeRegistrationAndLogin(email, password, pendingData.full_name, pendingData.phone_number);
                localStorage.removeItem('pendingRegistration');
                navigateAfterLogin();
                return;
              } catch (completeError) {
                const completeAxiosError = completeError as AxiosError<ApiError>;
                if (completeAxiosError.response?.data?.detail) {
                  setErrors({ form: completeAxiosError.response.data.detail });
                } else {
                  setErrors({ form: 'Failed to complete registration. Please try again.' });
                }
                setIsLoading(false);
                return;
              }
            }
          } catch {
            // Invalid JSON in localStorage, ignore
          }
        }
      }

      if (axiosError.response?.data?.detail) {
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

  const navigateAfterLogin = () => {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectUrl);
      return;
    }
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      switch (user.role) {
        case 'manager': navigate('/manager-dashboard'); break;
        case 'admin':   navigate('/admin-dashboard');   break;
        case 'auditor': navigate('/auditor-dashboard'); break;
        default:        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    try {
      await signInWithGoogle();
      navigateAfterLogin();
    } catch (error) {
      const err = error as Error;
      setErrors({ form: err.message || 'Failed to sign in with Google. Please try again.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoBack = () => navigate('/');

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Go Back */}
        <button className="go-back-btn" onClick={handleGoBack} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
              <rect x="9" y="11" width="14" height="10" rx="2" />
              <circle cx="12" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
            </svg>
          </div>
          <div className="login-brand-text">
            <span className="login-brand-name">Japan Lanka</span>
            <span className="login-brand-sub">Automobile Parts</span>
          </div>
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h2>Welcome back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {errors.form && (
            <div className="form-error-message">{errors.form}</div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
              autoComplete="email"
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
                autoComplete="current-password"
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Signing in…' : 'Sign In'}
          </button>

          <div className="divider"><span>or</span></div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="register-section">
            <p>
              Don't have an account?{' '}
              <button type="button" className="register-text-link" onClick={() => navigate('/register')}>
                Create one
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
