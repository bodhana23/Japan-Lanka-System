import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeInput, getEmailValidationError } from '../utils/validation';
import './Login.css';

const Login: React.FC = () => {
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
      // First, check registered users (customers who signed up through registration)
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const registeredUser = registeredUsers.find((user: any) => 
        user.email.toLowerCase() === email.toLowerCase() && user.password === password
      );
      
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
          case 'customer':
            navigate('/dashboard');
            break;
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
            navigate('/dashboard');
        }
        return;
      }

      // Fallback: Hardcoded staff credentials for admin/manager access
      if (email === 'manager1@gmail.com' && password === 'manager@1') {
        const userData = {
          email: 'manager1@gmail.com',
          name: 'Manager User',
          fullName: 'Manager User',
          role: 'manager',
          password: 'manager@1'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        navigate('/manager-dashboard');
        return;
      }

      if (email === 'admin@gmail.com' && password === 'admin@1') {
        const userData = {
          email: 'admin@gmail.com',
          name: 'Administrator',
          fullName: 'Administrator',
          role: 'admin',
          password: 'admin@1'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        navigate('/admin-dashboard');
        return;
      }

      if (email === 'auditor1@gmail.com' && password === 'auditor@1') {
        const userData = {
          email: 'auditor1@gmail.com',
          name: 'Auditor User',
          fullName: 'Auditor User',
          role: 'auditor',
          password: 'auditor@1'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        navigate('/auditor-dashboard');
        return;
      }

      // Hardcoded test customer account
      if (email === 'customer2@gmail.com' && password === 'customer@2222') {
        const userData = {
          email: 'customer2@gmail.com',
          name: 'customer2',
          fullName: 'customer2',
          role: 'customer',
          phoneNumber: '0771234567',
          password: 'customer@2222'
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        navigate('/dashboard');
        return;
      }
      
      // Invalid credentials
      alert('Invalid credentials. Please check your email and password.');
      
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="company-header">
          <h1>Japan Lanka Enterprises</h1>
          <p>Management System</p>
        </div>
        
        <form onSubmit={handleLogin} className="login-form">
          <h2>Login</h2>
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email address "
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
              placeholder="Enter your password "
              autoComplete="current-password"
              tabIndex={2}
              required
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <button type="submit" className="login-btn">
            Login
          </button>
          
          <div className="register-section">
            <p>Don't have an account?</p>
            <button 
              type="button" 
              className="register-btn"
              onClick={handleRegister}
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;