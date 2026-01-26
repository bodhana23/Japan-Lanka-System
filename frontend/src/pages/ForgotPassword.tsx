import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordReset } from '../config/firebase';
import { sanitizeInput, getEmailValidationError } from '../utils/validation';
import './Login.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedEmail = sanitizeInput(e.target.value);
    setEmail(sanitizedEmail);
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailError = getEmailValidationError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);

    try {
      // Use Firebase's built-in password reset email service
      await sendPasswordReset(email);
      // Always show success for security (prevents email enumeration)
      setIsSubmitted(true);
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      // For security, show generic message for most errors to prevent email enumeration
      // Only show specific error for rate limiting
      if (firebaseError.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else if (firebaseError.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        // Show success even if user doesn't exist (security best practice)
        setIsSubmitted(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate('/login');
  };

  // Success state after submission
  if (isSubmitted) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="company-header">
            <h1>Japan Lanka Enterprises</h1>
            <p>Management System</p>
          </div>

          <div className="login-form">
            <h2>Check Your Email</h2>

            <div style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              color: '#166534',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              If an account exists with this email, a password reset link has been sent.
            </div>

            <p style={{
              color: '#666',
              textAlign: 'center',
              marginBottom: '1.5rem',
              fontSize: '0.95rem'
            }}>
              Please check your inbox and follow the instructions to reset your password.
              The link will expire in 1 hour.
            </p>

            <Link
              to="/login"
              className="login-btn"
              style={{
                display: 'block',
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <button className="go-back-btn" onClick={handleGoBack} type="button">
          ← Back to Login
        </button>

        <div className="company-header">
          <h1>Japan Lanka Enterprises</h1>
          <p>Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>Forgot Password</h2>

          <p style={{
            color: '#666',
            textAlign: 'center',
            marginBottom: '1.5rem',
            fontSize: '0.95rem'
          }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="form-error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email address"
              autoComplete="email"
              autoFocus
              required
              disabled={isLoading}
              className={error ? 'error' : ''}
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <div className="register-section">
            <p>Remember your password?</p>
            <Link
              to="/login"
              className="register-btn"
              style={{ textDecoration: 'none', display: 'inline-block' }}
            >
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
