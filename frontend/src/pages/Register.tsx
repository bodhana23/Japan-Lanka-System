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
    // Don't sanitize password fields
    const sanitizedValue = (name === 'password' || name === 'confirmPassword')
      ? value
      : (typeof value === 'string' ? sanitizeInput(value) : value);
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));

    // Clear errors for the field being edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateFullName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Full Name is required';
    }
    if (name.trim().length < 2) {
      return 'Full Name must be at least 2 characters long';
    }
    if (/\d/.test(name)) {
      return 'Full Name cannot contain numbers';
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name.trim())) {
      return 'Full Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return null;
  };

  const validateSriLankanPhone = (phone: string): string | null => {
    if (!phone || phone.trim() === '') {
      return null; // Optional field
    }
    const cleaned = phone.replace(/[\s\-()]/g, '');
    if (!/^0\d{9}$/.test(cleaned)) {
      return 'Phone number must be 10 digits starting with 0 (e.g., 0771234567)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});
    const newErrors: {[key: string]: string} = {};

    // Full name validation (matching backend)
    const nameError = validateFullName(formData.fullName);
    if (nameError) {
      newErrors.fullName = nameError;
    }

    // Email validation with specific requirements
    const emailError = getEmailValidationError(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Phone validation - Sri Lankan format (optional)
    const phoneError = validateSriLankanPhone(formData.phoneNumber);
    if (phoneError) {
      newErrors.phoneNumber = phoneError;
    }

    // Strong password validation (matching backend requirements)
    const passwordValidation = validateStrongPassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors.join('. ');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // If there are validation errors, display them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const email = formData.email.trim().toLowerCase();
      const password = formData.password;

      // Create user in Firebase only (not in database yet)
      // User will be added to database on first login after email verification
      await registerWithFirebase(email, password);

      // Store pending registration data for backend to use on first login
      // This data will be sent when the user logs in after verifying email
      const pendingRegistration = {
        email,
        full_name: formData.fullName.trim(),
        phone_number: formData.phoneNumber.trim() || null,
      };
      localStorage.setItem('pendingRegistration', JSON.stringify(pendingRegistration));

      // Show email verification success screen
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

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const navigateAfterAuth = () => {
    // Check if there's a redirect URL (for window shoppers)
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

  // Show verification success screen after registration
  if (registrationSuccess) {
    return (
      <div className="register-container">
        <div className="register-card verification-success-card">
          <div className="company-header">
            <h1>Japan Lanka Enterprises</h1>
            <p>Verify Your Email</p>
          </div>

          <div className="verification-content">
            <div className="verification-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>

            <h2>Check Your Email</h2>

            <p className="verification-message">
              We've sent a verification link to:
            </p>
            <p className="verification-email">{registeredEmail}</p>

            <p className="verification-instructions">
              Click the link in the email to verify your account.
              Once verified, you can log in and start shopping.
            </p>

            {resendMessage && (
              <div className={`resend-message ${resendMessage.includes('Failed') ? 'error' : 'success'}`}>
                {resendMessage}
              </div>
            )}

            <div className="verification-actions">
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>

              <button
                type="button"
                className="back-login-btn"
                onClick={handleBackToLogin}
              >
                Go to Login
              </button>
            </div>

            <p className="verification-note">
              Didn't receive the email? Check your spam folder or click resend above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="company-header">
          <h1>Japan Lanka Enterprises</h1>
          <p>Create New Account</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <h2>Create New Account</h2>
          <p className="form-subtitle">Join Japan Lanka Enterprises as a customer</p>

          {errors.form && (
            <div className="form-error-message">
              {errors.form}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name (letters only)"
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
              placeholder="Enter your email address"
              required
              disabled={isLoading}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number <span className="optional-label">(Optional)</span></label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g., 0771234567 (10 digits starting with 0)"
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
                placeholder="Min 8 chars, upper, lower, number, special"
                required
                minLength={8}
                disabled={isLoading}
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
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
            <div className="password-requirements">
              Password must contain: 8+ characters, uppercase, lowercase, number, special character
            </div>
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
                placeholder="Confirm your password"
                required
                disabled={isLoading}
                className={errors.confirmPassword ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
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
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button type="submit" className="register-btn" disabled={isLoading || isGoogleLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isGoogleLoading ? 'Signing up...' : 'Sign up with Google'}
          </button>

          <div className="login-section">
            <p>Already have an account?</p>
            <button
              type="button"
              className="back-login-btn"
              onClick={handleBackToLogin}
              disabled={isLoading}
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
