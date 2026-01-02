import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import ManageUsers from './pages/ManageUsers';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// 404 Not Found Component
const NotFound: React.FC = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    color: '#333333'
  }}>
    <h1 style={{ color: '#ff6b6b', marginBottom: '20px', fontSize: '4rem' }}>404</h1>
    <h2 style={{ marginBottom: '20px' }}>Page Not Found</h2>
    <p style={{ marginBottom: '30px', maxWidth: '600px' }}>
      The page you're looking for doesn't exist or has been moved.
    </p>
    <button
      onClick={() => window.location.href = '/'}
      style={{
        backgroundColor: '#00b894',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px'
      }}
    >
      Go to Home
    </button>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<CustomerDashboard />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/browse-parts" element={<Shop />} /> {/* Window shopper route */}
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/manager-dashboard" element={<ManagerDashboard />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/auditor-dashboard" element={<AuditorDashboard />} />
              <Route path="/manage-users" element={<ManageUsers />} />
              {/* Catch all route - redirect to 404 */}
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </ErrorBoundary>
  );
}

export default App;