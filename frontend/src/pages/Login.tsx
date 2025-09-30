import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  console.log('Current state - email:', email, 'password:', password);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Email change:', e.target.value);
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Password change:', e.target.value);
    setPassword(e.target.value);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hardcoded customer credentials for testing
    if (email === 'customer1@gmail.com' && password === 'customer@1') {
      // Store user info in localStorage for demo purposes
      localStorage.setItem('currentUser', JSON.stringify({
        email: 'customer1@gmail.com',
        username: 'customer1',
        role: 'customer',
        mobile: '+94 77 123 4567',
        garageName: 'Lanka Auto Service',
        registrationNumber: 'REG-001'
      }));
      navigate('/dashboard');
      return;
    }

    // Hardcoded manager credentials for testing
    if (email === 'manager1@gmail.com' && password === 'manager@1') {
      // Store manager info in localStorage for demo purposes
      localStorage.setItem('currentUser', JSON.stringify({
        email: 'manager1@gmail.com',
        username: 'manager1',
        role: 'manager',
        mobile: '+94 77 987 6543',
        garageName: 'Lanka Auto Service',
        registrationNumber: 'MNG-001'
      }));
      navigate('/manager-dashboard');
      return;
    }
    
    // TODO: Implement real login logic
    console.log('Login attempt:', { email, password });
    alert('Invalid credentials. Use customer1@gmail.com / customer@1 for demo.');
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
              onFocus={() => console.log('Email field focused')}
              onClick={() => console.log('Email field clicked')}
              placeholder="Enter your email address"
              autoComplete="email"
              tabIndex={1}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={() => console.log('Password field focused')}
              onClick={() => console.log('Password field clicked')}
              placeholder="Enter your password"
              autoComplete="current-password"
              tabIndex={2}
              required
            />
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