import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, returnsApi, Order as ApiOrder, ReturnRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateUtils';
import {
  Calendar, Package, Clock, Truck, CheckCircle,
  ShoppingCart, RotateCcw, ArrowRight, AlertTriangle, Inbox,
  Store, Cog, Octagon, Wrench, Zap, Wind
} from 'lucide-react';
import AdsCarousel from '../AdsCarousel';
import './DashboardOverview.css';

interface Order {
  id: string;
  items: string[];
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'ready_to_pickup' | 'delivered' | 'cancelled' | 'return_approved' | 'picked_up';
  orderDate: string;
  deliveryMethod: 'pickup' | 'shipping';
}

// Product categories for quick navigation
const categories = [
  { id: 'engine', name: 'Engine Parts', icon: 'cog', color: '#3498db' },
  { id: 'brake', name: 'Brake System', icon: 'octagon', color: '#e74c3c' },
  { id: 'suspension', name: 'Suspension', icon: 'wrench', color: '#9b59b6' },
  { id: 'electrical', name: 'Electrical', icon: 'zap', color: '#f39c12' },
  { id: 'filters', name: 'Filters', icon: 'wind', color: '#1abc9c' },
  { id: 'body', name: 'Body Parts', icon: 'car', color: '#34495e' },
];

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardOverviewProps {
  onNavigate: (section: NavItemId) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await ordersApi.getMyOrders();
        if (isMounted) {
          const transformedOrders: Order[] = response.items.map((o: ApiOrder) => ({
            id: o.id,
            items: o.items.map(item => item.product_name || `Product ${item.product_id}`),
            amount: o.total_amount,
            status: o.status,
            orderDate: o.created_at,
            deliveryMethod: o.delivery_method,
          }));
          setOrders(transformedOrders);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching orders:', err);
          setError('Failed to load orders');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch return requests from API
  useEffect(() => {
    let isMounted = true;

    const fetchReturnRequests = async () => {
      try {
        setIsLoadingReturns(true);
        const response = await returnsApi.getMyReturns();
        if (isMounted) {
          setReturnRequests(response.items);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching return requests:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoadingReturns(false);
        }
      }
    };

    fetchReturnRequests();

    return () => {
      isMounted = false;
    };
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

  const handleBrowseParts = () => {
    navigate('/shop');
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

  return (
    <div className="do-container">
      {/* Welcome Section */}
      <section className="do-welcome-section">
        <div className="do-welcome-content">
          <div className="do-welcome-text">
            <span className="do-greeting-label">{greetings.greeting},</span>
            <h1 className="do-greeting-name">{user?.full_name || 'Customer'}!</h1>
            <p className="do-greeting-message">{greetings.message}</p>
          </div>
          <div className="do-welcome-date">
            <Calendar size={16} className="do-date-icon" />
            <span className="do-date-text">{currentDate}</span>
          </div>
        </div>
      </section>

      {/* Advertisement Banner */}
      <div className="do-ads-banner">
        <AdsCarousel />
      </div>

      {/* Stats Cards */}
      <section className="do-stats-section">
        <div className="do-stats-grid">
          <div className="do-stat-card do-stat-total">
            <div className="do-stat-icon"><Package size={24} /></div>
            <div className="do-stat-info">
              <span className="do-stat-number">{isLoading ? '...' : stats.total}</span>
              <span className="do-stat-label">Total Orders</span>
            </div>
          </div>
          <div className="do-stat-card do-stat-pending">
            <div className="do-stat-icon"><Clock size={24} /></div>
            <div className="do-stat-info">
              <span className="do-stat-number">{isLoading ? '...' : stats.pending}</span>
              <span className="do-stat-label">Pending</span>
            </div>
          </div>
          <div className="do-stat-card do-stat-progress">
            <div className="do-stat-icon"><Truck size={24} /></div>
            <div className="do-stat-info">
              <span className="do-stat-number">{isLoading ? '...' : stats.inProgress}</span>
              <span className="do-stat-label">In Transit</span>
            </div>
          </div>
          <div className="do-stat-card do-stat-completed">
            <div className="do-stat-icon"><CheckCircle size={24} /></div>
            <div className="do-stat-info">
              <span className="do-stat-number">{isLoading ? '...' : stats.completed}</span>
              <span className="do-stat-label">Completed</span>
            </div>
          </div>
        </div>
      </section>


      {/* Recent Orders Section */}
      <section className="do-recent-orders-section">
        <div className="do-section-header">
          <h2 className="do-section-title">
            <Package size={20} className="do-section-icon" />
            Recent Orders
          </h2>
          {orders.length > 5 && (
            <button className="do-view-all-btn" onClick={() => onNavigate('orders')}>
              View All
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="do-loading">
            <div className="do-loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="do-error">
            <AlertTriangle size={24} className="do-error-icon" />
            <p>{error}</p>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="do-empty-orders">
            <Inbox size={48} className="do-empty-icon" />
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
          </div>
        ) : (
          <div className="do-orders-grid">
            {recentOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              return (
                <div key={order.id} className="do-order-card">
                  <div className="do-order-header">
                    <span className="do-order-id">#{order.id.slice(-8).toUpperCase()}</span>
                    <span
                      className="do-order-status"
                      style={{
                        color: statusInfo.color,
                        backgroundColor: statusInfo.bgColor
                      }}
                    >
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="do-order-body">
                    <div className="do-order-date">
                      <Calendar size={14} className="do-order-date-icon" />
                      {formatDateTime(order.orderDate)}
                    </div>
                    <div className="do-order-items">
                      {order.items.slice(0, 2).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </div>
                  </div>
                  <div className="do-order-footer">
                    <span className="do-order-amount">{formatCurrency(order.amount)}</span>
                    <span className="do-order-delivery">
                      {order.deliveryMethod === 'pickup' ? <><Store size={14} /> Pickup</> : <><Truck size={14} /> Delivery</>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Return Requests Section */}
      <section className="do-recent-orders-section do-returns-section">
        <div className="do-section-header">
          <h2 className="do-section-title">
            <RotateCcw size={20} className="do-section-icon" />
            My Return Requests
          </h2>
          {returnRequests.length > 0 && (
            <button className="do-view-all-btn" onClick={() => onNavigate('returns')}>
              New Request
            </button>
          )}
        </div>

        {isLoadingReturns ? (
          <div className="do-loading">
            <div className="do-loading-spinner"></div>
            <p>Loading return requests...</p>
          </div>
        ) : returnRequests.length === 0 ? (
          <div className="do-empty-orders">
            <CheckCircle size={48} className="do-empty-icon" />
            <h3>No return requests</h3>
            <p>You haven't submitted any return requests yet.</p>
          </div>
        ) : (
          <div className="do-orders-grid">
            {returnRequests.slice(0, 5).map((request) => {
              const statusInfo = getReturnStatusInfo(request.status);
              return (
                <div key={request.id} className="do-order-card do-return-card">
                  <div className="do-order-header">
                    <div className="do-return-ids">
                      <span className="do-order-id">Return #{request.id.slice(-8).toUpperCase()}</span>
                      <span className="do-return-order-ref">Order #{request.order_id.slice(-8).toUpperCase()}</span>
                    </div>
                    <span
                      className="do-order-status"
                      style={{
                        color: statusInfo.color,
                        backgroundColor: statusInfo.bgColor
                      }}
                    >
                      {statusInfo.text}
                    </span>
                  </div>
                  <div className="do-order-body">
                    <div className="do-order-date">
                      <Calendar size={14} className="do-order-date-icon" />
                      {formatDateTime(request.created_at)}
                    </div>
                    <div className="do-return-reason">
                      <span className="do-reason-label">Reason:</span> {request.reason}
                    </div>
                    {request.description && (
                      <div className="do-order-items">
                        {request.description.length > 60
                          ? `${request.description.substring(0, 60)}...`
                          : request.description}
                      </div>
                    )}
                    {request.items && request.items.length > 0 && (
                      <div className="do-return-items-count">
                        {request.items.length} item{request.items.length > 1 ? 's' : ''} to return
                      </div>
                    )}
                  </div>
                  {request.admin_notes && (
                    <div className="do-manager-response-container">
                      <span className="do-admin-note">
                        <span className="do-admin-label">Manager Response:</span>
                        {request.admin_notes}
                      </span>
                    </div>
                  )}
                  {request.order_total && (
                    <div className="do-order-footer">
                      <span className="do-order-amount">{formatCurrency(request.order_total)}</span>
                      <span className="do-order-delivery">Original Order</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default DashboardOverview;
