import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Hardcoded admin credentials for testing
    if (email === 'admin@gmail.com' && password === 'admin@1') {
      // Store admin info in localStorage for demo purposes
      localStorage.setItem('currentUser', JSON.stringify({
        email: 'admin@gmail.com',
        username: 'admin',
        role: 'admin',
        mobile: '+94 77 555 0001',
        department: 'Administration',
        employeeId: 'ADM-001'
      }));
      navigate('/admin-dashboard');
      return;
    }

    // Hardcoded auditor credentials for testing
    if (email === 'auditor1@gmail.com' && password === 'auditor@1') {
      // Store auditor info in localStorage for demo purposes
      localStorage.setItem('currentUser', JSON.stringify({
        email: 'auditor1@gmail.com',
        name: 'Auditor User',
        role: 'auditor',
        phone: '+94 77 555 0002',
        department: 'Audit & Compliance',
        employeeId: 'AUD-001',
        joinDate: '2023-03-01'
      }));
      navigate('/auditor-dashboard');
      return;
    }
    
    // TODO: Implement real login logic
    alert('Invalid credentials. Try:\nCustomer: customer1@gmail.com / customer@1\nManager: manager1@gmail.com / manager@1\nAdmin: admin@gmail.com / admin@1\nAuditor: auditor1@gmail.com / auditor@1');
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