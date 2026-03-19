import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateStrongPassword, sanitizeInput, getEmailValidationError } from '../utils/validation';
import { registerWithFirebase, resendVerificationEmail } from '../config/firebase';
import './Register.css';

interface FirebaseError {
  code?: string;
  message?: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPassword, setRegisteredPassword] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = (name === 'password' || name === 'confirmPassword')
      ? value
      : (typeof value === 'string' ? sanitizeInput(value) : value);
    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateFullName = (name: string): string | null => {
    if (!name.trim()) return 'Full Name is required';
    if (name.trim().length < 2) return 'Full Name must be at least 2 characters long';
    if (/\d/.test(name)) return 'Full Name cannot contain numbers';
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name.trim())) return 'Full Name can only contain letters, spaces, hyphens, and apostrophes';
    return null;
  };

  const validateSriLankanPhone = (phone: string): string | null => {
    if (!phone || phone.trim() === '') return null;
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (!/^0\d{9}$/.test(cleaned)) return 'Phone number must be 10 digits starting with 0 (e.g., 0771234567)';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: {[key: string]: string} = {};

    const nameError = validateFullName(formData.fullName);
    if (nameError) newErrors.fullName = nameError;

    const emailError = getEmailValidationError(formData.email);
    if (emailError) newErrors.email = emailError;

    const phoneError = validateSriLankanPhone(formData.phoneNumber);
    if (phoneError) newErrors.phoneNumber = phoneError;

    const passwordValidation = validateStrongPassword(formData.password);
    if (!passwordValidation.isValid) newErrors.password = passwordValidation.errors.join('. ');

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;
      await registerWithFirebase(email, password);
      localStorage.setItem('pendingRegistration', JSON.stringify({
        email,
        full_name: formData.fullName.trim(),
        phone_number: formData.phoneNumber.trim() || null,
      }));
      setRegisteredEmail(email);
      setRegisteredPassword(password);
      setRegistrationSuccess(true);
    } catch (error) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already registered. Please log in instead.' });
      } else if (firebaseError.code === 'auth/weak-password') {
        setErrors({ password: 'Password is too weak. Please use a stronger password.' });
      } else if (firebaseError.code === 'auth/invalid-email') {
        setErrors({ email: 'Please enter a valid email address.' });
      } else if (firebaseError.code === 'auth/network-request-failed') {
        setErrors({ form: 'Network error. Please check your connection and try again.' });
      } else {
        setErrors({ form: firebaseError.message || 'An error occurred during registration. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => navigate('/login');
  const handleBackToHome = () => navigate('/');

  const navigateAfterAuth = () => {
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      navigate(redirectUrl);
      return;
    }
    navigate('/dashboard');
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    try {
      await signInWithGoogle();
      navigateAfterAuth();
    } catch (error) {
      const err = error as Error;
      setErrors({ form: err.message || 'Failed to sign up with Google. Please try again.' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage('');
    try {
      await resendVerificationEmail(registeredEmail, registeredPassword);
      setResendMessage('Verification email sent. Please check your inbox.');
    } catch (error) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/too-many-requests') {
        setResendMessage('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setResendMessage('Failed to resend verification email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  // ── EMAIL VERIFICATION SCREEN ─────────────────────────────────
  if (registrationSuccess) {
    return (
      <div className="verify-page">
        <div className="verify-card">
          <div className="verify-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h2>Check Your Email</h2>
          <p className="verification-message">We've sent a verification link to:</p>
          <p className="verification-email">{registeredEmail}</p>

          <p className="verification-instructions">
            Click the link in the email to verify your account. Once verified, you can log in and start shopping.
          </p>

          {resendMessage && (
            <div className={`resend-message ${resendMessage.includes('Failed') || resendMessage.includes('Too many') ? 'error' : 'success'}`}>
              {resendMessage}
            </div>
          )}

          <div className="verification-actions">
            <button type="button" className="resend-btn" onClick={handleResendVerification} disabled={isResending}>
              {isResending ? 'Sending…' : 'Resend Verification Email'}
            </button>
            <button type="button" className="verify-login-btn" onClick={handleBackToLogin}>
              Go to Login
            </button>
          </div>

          <p className="verification-note">
            Didn't receive the email? Check your spam folder or click resend above.
          </p>
        </div>
      </div>
    );
  }

  // ── EYE ICON SVGs ─────────────────────────────────────────────
  const EyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
  const EyeOn = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  // ── MAIN REGISTER PAGE ────────────────────────────────────────
  return (
    <div className="register-page">

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className="register-left">
        <div className="left-brand">
          <div className="left-brand-logo">
            <div className="left-brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                <rect x="9" y="11" width="14" height="10" rx="2" />
                <circle cx="12" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
              </svg>
            </div>
            <div>
              <div className="left-brand-name">Japan Lanka Enterprises</div>
              <div className="left-brand-tagline">Automobile Parts</div>
            </div>
          </div>

          <h2 className="left-headline">Your trusted source for genuine automobile parts</h2>
          <p className="left-subline">
            Join thousands of customers who rely on us for quality parts, fast delivery, and expert support.
          </p>

          <div className="left-badges">
            <div className="left-badge">
              <div className="left-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="left-badge-text">Genuine OEM &amp; aftermarket parts</span>
            </div>
            <div className="left-badge">
              <div className="left-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="left-badge-text">Island-wide delivery across Sri Lanka</span>
            </div>
            <div className="left-badge">
              <div className="left-badge-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="left-badge-text">Easy returns &amp; dedicated support</span>
            </div>
          </div>
        </div>

        <div className="left-bottom">
          Already have an account?{' '}
          <button type="button" className="left-signin-link" onClick={handleBackToLogin}>
            Sign in →
          </button>
        </div>

        {/* Mobile-only sign in strip */}
        <div className="left-mobile-signin">
          Have an account?
          <button type="button" onClick={handleBackToLogin}>Sign in</button>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div className="register-right">
        <div className="register-form-wrapper">
          <button type="button" className="back-login-btn" onClick={handleBackToHome}>
            ← Back to Home
          </button>
          <div className="register-heading">
            <h2>Create Account</h2>
            <p>Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            {errors.form && (
              <div className="form-error-message">{errors.form}</div>
            )}

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. Saman Perera"
                required
                disabled={isLoading}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">
                Phone Number <span className="optional-label">(optional)</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0771234567"
                disabled={isLoading}
                className={errors.phoneNumber ? 'error' : ''}
              />
              {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 chars with upper, lower, number &amp; symbol"
                  required
                  minLength={8}
                  disabled={isLoading}
                  className={errors.password ? 'error' : ''}
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} aria-label="Toggle password">
                  {showPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
              {!errors.password && (
                <div className="password-requirements">
                  8+ characters · uppercase · lowercase · number · special character
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  disabled={isLoading}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)} tabIndex={-1} aria-label="Toggle confirm password">
                  {showConfirmPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="register-btn" disabled={isLoading || isGoogleLoading}>
              {isLoading ? 'Creating Account…' : 'Create Account'}
            </button>

            <div className="divider"><span>or</span></div>

            <button type="button" className="google-btn" onClick={handleGoogleSignUp} disabled={isLoading || isGoogleLoading}>
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isGoogleLoading ? 'Signing up…' : 'Continue with Google'}
            </button>

            <div className="login-section">
              <p>
                Already have an account?{' '}
                <button type="button" className="back-login-btn" onClick={handleBackToLogin} disabled={isLoading}>
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
