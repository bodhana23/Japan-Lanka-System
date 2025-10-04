import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validation';
import './Register.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: 'customer',
    garageName: '',
    registrationNumber: '',
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation
    if (!formData.username.trim()) {
      alert('Username is required!');
      return;
    }
    
    if (formData.username.length < 3) {
      alert('Username must be at least 3 characters long!');
      return;
    }
    
    if (!validateEmail(formData.email)) {
      alert('Please enter a valid email address!');
      return;
    }
    
    if (!validatePassword(formData.password)) {
      alert('Password must be at least 6 characters long!');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    // Validate optional fields if provided
    if (formData.garageName && formData.garageName.length < 2) {
      alert('Garage name must be at least 2 characters long!');
      return;
    }
    
    if (formData.registrationNumber && formData.registrationNumber.length < 3) {
      alert('Registration number must be at least 3 characters long!');
      return;
    }
    
    // TODO: Implement registration logic with backend
    alert('Registration successful! Please login with your email.');
    navigate('/');
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
          <h2>Register</h2>
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
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
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="customer">Customer</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="garageName">Garage Name (Optional)</label>
            <input
              type="text"
              id="garageName"
              name="garageName"
              value={formData.garageName}
              onChange={handleChange}
              placeholder="Enter garage name if applicable"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="registrationNumber">Registration Number (Optional)</label>
            <input
              type="text"
              id="registrationNumber"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="Enter registration number if any"
            />
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
            />
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
            />
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