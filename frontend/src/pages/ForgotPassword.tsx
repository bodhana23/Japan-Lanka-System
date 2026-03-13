import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
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
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailError = getEmailValidationError(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
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

  // ── Success / Check Email state ──────────────────────────────
  if (isSubmitted) {
    return (
      <div className="login-container">
        <div className="login-card">
          {/* Icon */}
          <div className="fp-icon-wrap">
            <Mail size={30} />
          </div>

          {/* Heading */}
          <div className="fp-heading">
            <h2>Check Your Email</h2>
            <p>We've sent a password reset link to your inbox.</p>
          </div>

          {/* Success box */}
          <div className="fp-success-box">
            <CheckCircle size={18} />
            <span>
              If an account exists with <strong>{email || 'that email'}</strong>, a
              password reset link has been sent. The link will expire in{' '}
              <strong>1 hour</strong>.
            </span>
          </div>

          <p style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Didn't receive the email? Check your spam folder or try again with a different address.
          </p>

          <Link to="/login" className="login-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Back to Login
          </Link>

          <button
            className="fp-back-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
            onClick={() => setIsSubmitted(false)}
          >
            <ArrowLeft size={15} />
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  // ── Request form state ───────────────────────────────────────
  return (
    <div className="login-container">
      <div className="login-card">
        {/* Back button */}
        <button className="go-back-btn" onClick={() => navigate('/login')} type="button">
          <ArrowLeft size={14} />
          Back to Login
        </button>

        {/* Icon */}
        <div className="fp-icon-wrap">
          <KeyRound size={28} />
        </div>

        {/* Heading */}
        <div className="fp-heading">
          <h2>Forgot Password?</h2>
          <p>Enter your email and we'll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="form-error-message">{error}</div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your registered email"
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
        </form>

        <div className="fp-divider" />

        <Link to="/login" className="fp-back-link">
          <ArrowLeft size={15} />
          Remember your password? Log in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
