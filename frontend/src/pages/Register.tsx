import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validatePassword, sanitizeInput, getEmailValidationError, getOptionalPhoneValidationError } from '../utils/validation';
import './Register.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    const newErrors: {[key: string]: string} = {};
    
    // Comprehensive validation with specific error messages
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full Name must be at least 2 characters long';
    }
    
    // Email validation with specific requirements
    const emailError = getEmailValidationError(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Phone validation - optional during registration
    const phoneError = getOptionalPhoneValidationError(formData.phoneNumber);
    if (phoneError) {
      newErrors.phoneNumber = phoneError;
    }
    
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // If there are validation errors, display them and stop submission
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Store user registration data
    const userData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      phoneNumber: formData.phoneNumber.trim(),
      role: 'customer', // Default role for all new registrations
      password: formData.password // In real app, this should be hashed
    };
    
    // For now, store in localStorage (in production, send to backend)
    try {
      const existingUsersStr = localStorage.getItem('registeredUsers') || '[]';
      const existingUsers = JSON.parse(existingUsersStr);
      
      // Validate existingUsers is an array
      if (!Array.isArray(existingUsers)) {
        console.error('registeredUsers is not an array, resetting');
        localStorage.setItem('registeredUsers', JSON.stringify([userData]));
        alert('Registration successful! Please login with your new credentials.');
        navigate('/');
        return;
      }
      
      // Check if email already exists (case-insensitive)
      const emailExists = existingUsers.some((user: any) => {
        if (!user || typeof user !== 'object' || !user.email) {
          return false;
        }
        return user.email.toLowerCase() === userData.email;
      });
      
      if (emailExists) {
        setErrors({ email: 'An account with this email already exists' });
        return;
      }
      
      existingUsers.push(userData);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));

      // Auto-login the newly registered user
      localStorage.setItem('currentUser', JSON.stringify(userData));

      // Check if there's a redirect URL (for window shoppers who register)
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        alert('Registration successful! Redirecting to checkout...');
        navigate(redirectUrl);
        return;
      }

      alert('Registration successful! Welcome to Japan Lanka Enterprises.');
      navigate('/dashboard'); // Redirect to customer dashboard
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      alert('An error occurred during registration. Please try again.');
      return;
    }
  };

  const handleBackToLogin = () => {
    navigate('/');
  };

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
          
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
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
              placeholder="Enter your email address (must contain @)"
              required
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
              placeholder="Enter 10 digits (e.g., 0771234567) - Optional"
              className={errors.phoneNumber ? 'error' : ''}
            />
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password (min 6 characters)"
              required
              minLength={6}
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              className={errors.confirmPassword ? 'error' : ''}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
          
          <button type="submit" className="register-btn">
            Create Account
          </button>
          
          <div className="login-section">
            <p>Already have an account?</p>
            <button 
              type="button" 
              className="back-login-btn"
              onClick={handleBackToLogin}
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