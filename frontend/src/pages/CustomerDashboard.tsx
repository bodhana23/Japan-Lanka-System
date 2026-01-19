import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import { ordersApi, returnsApi, Order as ApiOrder, ReturnRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/dateUtils';
import './CustomerDashboard.css';

interface Order {
  id: string;
  items: string[];
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'ready_to_pickup' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryMethod: 'pickup' | 'shipping';
}

// Product categories for quick navigation
const categories = [
  { id: 'engine', name: 'Engine Parts', icon: '⚙️', color: '#3498db' },
  { id: 'brake', name: 'Brake System', icon: '🛑', color: '#e74c3c' },
  { id: 'suspension', name: 'Suspension', icon: '🔧', color: '#9b59b6' },
  { id: 'electrical', name: 'Electrical', icon: '⚡', color: '#f39c12' },
  { id: 'filters', name: 'Filters', icon: '🌬️', color: '#1abc9c' },
  { id: 'body', name: 'Body Parts', icon: '🚗', color: '#34495e' },
];

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current date formatted nicely
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Motivational messages
  const greetings = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { greeting: 'Good Morning', message: 'Start your day with quality parts!' };
    if (hour < 17) return { greeting: 'Good Afternoon', message: 'Ready to find your next part?' };
    return { greeting: 'Good Evening', message: 'Browse our collection tonight!' };
  }, []);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await ordersApi.getMyOrders();
        const transformedOrders: Order[] = response.items.map((o: ApiOrder) => ({
          id: o.id,
          items: o.items.map(item => item.product_name || `Product ${item.product_id}`),
          amount: o.total_amount,
          status: o.status,
          orderDate: o.created_at,
          deliveryMethod: o.delivery_method,
        }));
        setOrders(transformedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch return requests from API
  useEffect(() => {
    const fetchReturnRequests = async () => {
      try {
        setIsLoadingReturns(true);
        const response = await returnsApi.getMyReturns();
        setReturnRequests(response.items);
      } catch (err) {
        console.error('Error fetching return requests:', err);
      } finally {
        setIsLoadingReturns(false);
      }
    };

    fetchReturnRequests();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const completed = orders.filter(o => o.status === 'delivered').length;
    const inProgress = orders.filter(o => o.status === 'shipped' || o.status === 'ready_to_pickup').length;
    return { total, pending, completed, inProgress };
  }, [orders]);

  // Get recent orders (last 5)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
      .slice(0, 5);
  }, [orders]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleBrowseParts = () => {
    navigate('/shop');
  };

  const handleViewOrders = () => {
    navigate('/my-orders');
  };

  const handleRequestReturn = () => {
    navigate('/request-return');
  };

  const handleCategoryClick = (categoryId: string) => {
    // Navigate to shop with category filter
    navigate(`/shop?category=${categoryId}`);
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
      'pending': { text: 'Pending', color: '#f39c12', bgColor: '#fef9e7' },
      'confirmed': { text: 'Confirmed', color: '#3498db', bgColor: '#ebf5fb' },
      'shipped': { text: 'Shipped', color: '#9b59b6', bgColor: '#f5eef8' },
      'ready_to_pickup': { text: 'Ready', color: '#1abc9c', bgColor: '#e8f8f5' },
      'delivered': { text: 'Delivered', color: '#27ae60', bgColor: '#eafaf1' },
      'cancelled': { text: 'Cancelled', color: '#e74c3c', bgColor: '#fdedec' },
    };
    return statusMap[status] || { text: status, color: '#7f8c8d', bgColor: '#f8f9fa' };
  };

  const getReturnStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
      'pending': { text: 'Pending', color: '#f39c12', bgColor: '#fef9e7' },
      'approved': { text: 'Approved', color: '#27ae60', bgColor: '#eafaf1' },
      'rejected': { text: 'Rejected', color: '#e74c3c', bgColor: '#fdedec' },
      'completed': { text: 'Completed', color: '#3498db', bgColor: '#ebf5fb' },
    };
    return statusMap[status] || { text: status, color: '#7f8c8d', bgColor: '#f8f9fa' };
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  // Get user's first name for greeting
  const firstName = user?.full_name?.split(' ')[0] || 'Customer';

  return (
    <div className="customer-dashboard">
      {/* Header */}
      <header className="cd-header">
        <div className="cd-header-content">
          <div className="cd-logo">
            <span className="cd-logo-icon">🚗</span>
            <span className="cd-logo-text">Japan Lanka</span>
          </div>
          <div className="cd-header-actions">
            <button 
              className="cd-profile-btn"
              onClick={() => setShowProfile(true)}
            >
              <span className="cd-profile-avatar">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <span className="cd-profile-name">{firstName}</span>
            </button>
            <button onClick={handleLogout} className="cd-logout-btn">
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="cd-main">
        {/* Welcome Section */}
        <section className="cd-welcome-section">
          <div className="cd-welcome-content">
            <div className="cd-welcome-text">
              <span className="cd-greeting-label">{greetings.greeting},</span>
              <h1 className="cd-greeting-name">{user?.full_name || 'Customer'}! 👋</h1>
              <p className="cd-greeting-message">{greetings.message}</p>
            </div>
            <div className="cd-welcome-date">
              <span className="cd-date-icon">📅</span>
              <span className="cd-date-text">{currentDate}</span>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="cd-stats-section">
          <div className="cd-stats-grid">
            <div className="cd-stat-card cd-stat-total">
              <div className="cd-stat-icon">📦</div>
              <div className="cd-stat-info">
                <span className="cd-stat-number">{isLoading ? '...' : stats.total}</span>
                <span className="cd-stat-label">Total Orders</span>
              </div>
            </div>
            <div className="cd-stat-card cd-stat-pending">
              <div className="cd-stat-icon">⏳</div>
              <div className="cd-stat-info">
                <span className="cd-stat-number">{isLoading ? '...' : stats.pending}</span>
                <span className="cd-stat-label">Pending</span>
              </div>
            </div>
            <div className="cd-stat-card cd-stat-progress">
              <div className="cd-stat-icon">🚚</div>
              <div className="cd-stat-info">
                <span className="cd-stat-number">{isLoading ? '...' : stats.inProgress}</span>
                <span className="cd-stat-label">In Transit</span>
              </div>
            </div>
            <div className="cd-stat-card cd-stat-completed">
              <div className="cd-stat-icon">✅</div>
              <div className="cd-stat-info">
                <span className="cd-stat-number">{isLoading ? '...' : stats.completed}</span>
                <span className="cd-stat-label">Completed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Action Buttons */}
        <section className="cd-actions-section">
          <button className="cd-action-btn cd-action-primary" onClick={handleBrowseParts}>
            <span className="cd-action-icon">🛒</span>
            <span className="cd-action-text">
              <span className="cd-action-title">Browse Parts</span>
              <span className="cd-action-subtitle">Find quality auto parts</span>
            </span>
            <span className="cd-action-arrow">→</span>
          </button>
          <button className="cd-action-btn cd-action-secondary" onClick={handleRequestReturn}>
            <span className="cd-action-icon">🔄</span>
            <span className="cd-action-text">
              <span className="cd-action-title">Request Returns</span>
              <span className="cd-action-subtitle">Return delivered items</span>
            </span>
            <span className="cd-action-arrow">→</span>
          </button>
        </section>

        {/* Recent Orders Section */}
        <section className="cd-recent-orders-section">
          <div className="cd-section-header">
            <h2 className="cd-section-title">
              <span className="cd-section-icon">📦</span>
              Recent Orders
            </h2>
            {orders.length > 5 && (
              <button className="cd-view-all-btn" onClick={handleViewOrders}>
                View All →
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="cd-loading">
              <div className="cd-loading-spinner"></div>
              <p>Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="cd-error">
              <span className="cd-error-icon">⚠️</span>
              <p>{error}</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="cd-empty-orders">
              <span className="cd-empty-icon">📭</span>
              <h3>No orders yet</h3>
              <p>Start shopping to see your orders here!</p>
              <button className="cd-shop-now-btn" onClick={handleBrowseParts}>
                Shop Now
              </button>
            </div>
          ) : (
            <div className="cd-orders-grid">
              {recentOrders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div key={order.id} className="cd-order-card">
                    <div className="cd-order-header">
                      <span className="cd-order-id">#{order.id.slice(-8).toUpperCase()}</span>
                      <span
                        className="cd-order-status"
                        style={{
                          color: statusInfo.color,
                          backgroundColor: statusInfo.bgColor
                        }}
                      >
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="cd-order-body">
                      <div className="cd-order-date">
                        <span className="cd-order-date-icon">📅</span>
                        {formatDateTime(order.orderDate)}
                      </div>
                      <div className="cd-order-items">
                        {order.items.slice(0, 2).join(', ')}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                    </div>
                    <div className="cd-order-footer">
                      <span className="cd-order-amount">{formatCurrency(order.amount)}</span>
                      <span className="cd-order-delivery">
                        {order.deliveryMethod === 'pickup' ? '🏪 Pickup' : '🚚 Delivery'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Return Requests Section */}
        <section className="cd-recent-orders-section cd-returns-section">
          <div className="cd-section-header">
            <h2 className="cd-section-title">
              <span className="cd-section-icon">🔄</span>
              My Return Requests
            </h2>
            {returnRequests.length > 0 && (
              <button className="cd-view-all-btn" onClick={handleRequestReturn}>
                New Request →
              </button>
            )}
          </div>

          {isLoadingReturns ? (
            <div className="cd-loading">
              <div className="cd-loading-spinner"></div>
              <p>Loading return requests...</p>
            </div>
          ) : returnRequests.length === 0 ? (
            <div className="cd-empty-orders">
              <span className="cd-empty-icon">✅</span>
              <h3>No return requests</h3>
              <p>You haven't submitted any return requests yet.</p>
              <button className="cd-shop-now-btn" onClick={handleRequestReturn}>
                Request a Return
              </button>
            </div>
          ) : (
            <div className="cd-orders-grid">
              {returnRequests.slice(0, 5).map((request) => {
                const statusInfo = getReturnStatusInfo(request.status);
                return (
                  <div key={request.id} className="cd-order-card cd-return-card">
                    <div className="cd-order-header">
                      <div className="cd-return-ids">
                        <span className="cd-order-id">Return #{request.id.slice(-8).toUpperCase()}</span>
                        <span className="cd-return-order-ref">Order #{request.order_id.slice(-8).toUpperCase()}</span>
                      </div>
                      <span
                        className="cd-order-status"
                        style={{
                          color: statusInfo.color,
                          backgroundColor: statusInfo.bgColor
                        }}
                      >
                        {statusInfo.text}
                      </span>
                    </div>
                    <div className="cd-order-body">
                      <div className="cd-order-date">
                        <span className="cd-order-date-icon">📅</span>
                        {formatDateTime(request.created_at)}
                      </div>
                      <div className="cd-return-reason">
                        <span className="cd-reason-label">Reason:</span> {request.reason}
                      </div>
                      {request.description && (
                        <div className="cd-order-items">
                          {request.description.length > 60
                            ? `${request.description.substring(0, 60)}...`
                            : request.description}
                        </div>
                      )}
                      {request.items && request.items.length > 0 && (
                        <div className="cd-return-items-count">
                          {request.items.length} item{request.items.length > 1 ? 's' : ''} to return
                        </div>
                      )}
                    </div>
                    {request.admin_notes && (
                      <div className="cd-order-footer">
                        <span className="cd-admin-note">
                          <span className="cd-admin-label">Admin Note:</span>
                          {request.admin_notes.length > 50
                            ? `${request.admin_notes.substring(0, 50)}...`
                            : request.admin_notes}
                        </span>
                      </div>
                    )}
                    {request.order_total && (
                      <div className="cd-order-footer">
                        <span className="cd-order-amount">{formatCurrency(request.order_total)}</span>
                        <span className="cd-order-delivery">Original Order</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Categories Section */}
        <section className="cd-categories-section">
          <div className="cd-section-header">
            <h2 className="cd-section-title">
              <span className="cd-section-icon">🏷️</span>
              Quick Categories
            </h2>
          </div>
          <div className="cd-categories-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className="cd-category-card"
                onClick={() => handleCategoryClick(category.id)}
                style={{ '--category-color': category.color } as React.CSSProperties}
              >
                <span className="cd-category-icon">{category.icon}</span>
                <span className="cd-category-name">{category.name}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      {/* Profile Modal */}
      {showProfile && user && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          user={{
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            phoneNumber: user.phone_number || ''
          }}
          roleLabel="Customer"
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
