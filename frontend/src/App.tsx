import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import EmployeeLogin from './pages/EmployeeLogin';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CustomerDashboard from './pages/CustomerDashboard';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import ManagerDashboard from './pages/ManagerDashboard';
import OfflineSales from './pages/OfflineSales';
import AdminDashboard from './pages/AdminDashboard';
import AuditorDashboard from './pages/AuditorDashboard';
import ManageUsers from './pages/ManageUsers';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Component to sync cart when user authentication changes
// Cart sync should ONLY run for customers, not employees (manager/admin/auditor)
const CartSyncManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, setOnLoginSuccess } = useAuth();
  const { mergeLocalCartToServer, syncCartFromApi } = useCart();
  const hasInitialSynced = React.useRef(false);

  // Check if current user is a customer
  const isCustomer = user?.role === 'customer';

  // Set up the login callback to sync cart (only for customers)
  useEffect(() => {
    setOnLoginSuccess(() => {
      // Check role at callback execution time
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.role === 'customer') {
            mergeLocalCartToServer();
          }
        } catch {
          // Invalid user data, don't sync
        }
      }
    });

    return () => {
      setOnLoginSuccess(undefined);
    };
  }, [setOnLoginSuccess, mergeLocalCartToServer]);

  // Sync cart when customer is already authenticated on app load (only once)
  useEffect(() => {
    if (isAuthenticated && isCustomer && !hasInitialSynced.current) {
      hasInitialSynced.current = true;
      syncCartFromApi();
    }
    // Reset ref when user logs out so it syncs again on next login
    if (!isAuthenticated) {
      hasInitialSynced.current = false;
    }
  }, [isAuthenticated, isCustomer, syncCartFromApi]);

  return <>{children}</>;
};

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
      <AuthProvider>
        <CartProvider>
          <CartSyncManager>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/employee-login" element={<EmployeeLogin />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/dashboard" element={<CustomerDashboard />} />
                  <Route path="/customer" element={<CustomerDashboard />} />
                  {/* Legacy routes - redirect to new dashboard */}
                  <Route path="/my-orders" element={<Navigate to="/customer" replace />} />
                  <Route path="/request-return" element={<Navigate to="/customer?section=returns" replace />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/browse-parts" element={<Shop />} /> {/* Window shopper route */}
                  <Route path="/checkout" element={<Checkout />} />
                  {/* Payment result routes */}
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/cancel" element={<PaymentCancel />} />
                  <Route path="/manager-dashboard" element={<Navigate to="/manager/inventory" replace />} />
                  <Route path="/manager" element={<Navigate to="/manager/inventory" replace />} />
                  <Route path="/manager/inventory" element={<ManagerDashboard />} />
                  <Route path="/manager/orders" element={<ManagerDashboard />} />
                  <Route path="/manager/offline-sales" element={<OfflineSales />} />
                  <Route path="/manager/returns" element={<ManagerDashboard />} />
                  <Route path="/manager/profile" element={<ManagerDashboard />} />
                  <Route path="/admin-dashboard" element={<AdminDashboard />} />
                  <Route path="/auditor-dashboard" element={<AuditorDashboard />} />
                  <Route path="/manage-users" element={<ManageUsers />} />
                  {/* Catch all route - redirect to 404 */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
            </Router>
          </CartSyncManager>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;