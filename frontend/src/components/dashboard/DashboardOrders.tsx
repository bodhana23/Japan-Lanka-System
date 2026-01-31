import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, returnsApi, Order } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import { AlertTriangle, Inbox, Store, Truck, Package, RefreshCw } from 'lucide-react';
import './DashboardOrders.css';

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardOrdersProps {
  onNavigate: (section: NavItemId) => void;
}

const DashboardOrders: React.FC<DashboardOrdersProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Fetch orders from API
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await ordersApi.getMyOrders();
        if (isMounted) {
          setOrders(response.items);
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

  const handleRequestReturn = (order: Order) => {
    setSelectedOrder(order);
    setReturnReason('');
    setSubmitError(null);
    setSubmitSuccess(null);
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    if (!selectedOrder || returnReason.trim().length < 10) {
      setSubmitError('Please provide a reason (at least 10 characters)');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const returnItems = selectedOrder.items.map(item => ({
        order_item_id: item.id,
        quantity: item.quantity
      }));
      await returnsApi.createReturn({
        order_id: selectedOrder.id,
        reason: returnReason.trim(),
        items: returnItems
      });
      setSubmitSuccess('Return request submitted successfully!');
      setTimeout(() => {
        setShowReturnModal(false);
        setSelectedOrder(null);
        setReturnReason('');
        setSubmitSuccess(null);
      }, 2000);
    } catch (err: unknown) {
      console.error('Error submitting return request:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit return request';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setSubmitError(axiosError.response?.data?.detail || errorMessage);
      } else {
        setSubmitError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { text: string; color: string; bgColor: string }> = {
      'pending': { text: 'Pending', color: '#f39c12', bgColor: '#fef9e7' },
      'confirmed': { text: 'Confirmed', color: '#3498db', bgColor: '#ebf5fb' },
      'shipped': { text: 'Shipped', color: '#9b59b6', bgColor: '#f5eef8' },
      'ready_to_pickup': { text: 'Ready for Pickup', color: '#1abc9c', bgColor: '#e8f8f5' },
      'delivered': { text: 'Delivered', color: '#27ae60', bgColor: '#eafaf1' },
      'cancelled': { text: 'Cancelled', color: '#e74c3c', bgColor: '#fdedec' },
    };
    return statusMap[status] || { text: status, color: '#7f8c8d', bgColor: '#f8f9fa' };
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${Number(amount).toLocaleString()}`;
  };

  const canRequestReturn = (status: string) => {
    return status === 'delivered' || status === 'ready_to_pickup';
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'pending') return order.status === 'pending' || order.status === 'confirmed';
    if (filter === 'processing') return order.status === 'shipped' || order.status === 'ready_to_pickup';
    if (filter === 'completed') return order.status === 'delivered';
    if (filter === 'cancelled') return order.status === 'cancelled';
    return true;
  });

  return (
    <div className="dord-container">
      {/* Page Header */}
      <div className="dord-page-header">
        <div className="dord-header-info">
          <h2 className="dord-page-title">
            <Package size={24} className="dord-title-icon" />
            My Orders
          </h2>
          <p className="dord-page-subtitle">Track and manage your orders</p>
        </div>
        <button className="dord-refresh-btn" onClick={() => window.location.reload()}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="dord-filters">
        <button
          className={`dord-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({orders.length})
        </button>
        <button
          className={`dord-filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length})
        </button>
        <button
          className={`dord-filter-btn ${filter === 'processing' ? 'active' : ''}`}
          onClick={() => setFilter('processing')}
        >
          In Progress ({orders.filter(o => o.status === 'shipped' || o.status === 'ready_to_pickup').length})
        </button>
        <button
          className={`dord-filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({orders.filter(o => o.status === 'delivered').length})
        </button>
        <button
          className={`dord-filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({orders.filter(o => o.status === 'cancelled').length})
        </button>
      </div>

      {/* Orders Content */}
      {isLoading ? (
        <div className="dord-loading">
          <div className="dord-loading-spinner"></div>
          <p>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="dord-error">
          <AlertTriangle size={32} className="dord-error-icon" />
          <p>{error}</p>
          <button className="dord-retry-btn" onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="dord-empty">
          <Inbox size={48} className="dord-empty-icon" />
          <h3>{filter === 'all' ? 'No orders yet' : `No ${filter} orders`}</h3>
          <p>
            {filter === 'all'
              ? 'Start shopping to see your orders here!'
              : 'There are no orders in this category.'
            }
          </p>
          {filter === 'all' && (
            <button className="dord-shop-btn" onClick={() => navigate('/shop')}>
              Browse Parts
            </button>
          )}
        </div>
      ) : (
        <div className="dord-orders-list">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            return (
              <div key={order.id} className="dord-order-card">
                <div className="dord-order-header">
                  <div className="dord-order-info">
                    <span className="dord-order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="dord-order-date">{formatDateTime(order.created_at)}</span>
                  </div>
                  <span
                    className="dord-order-status"
                    style={{
                      color: statusInfo.color,
                      backgroundColor: statusInfo.bgColor
                    }}
                  >
                    {statusInfo.text}
                  </span>
                </div>

                <div className="dord-order-items">
                  <h4>Items ({order.items.length})</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        <span className="dord-item-name">{item.product_name || `Product`}</span>
                        <span className="dord-item-qty">x{item.quantity}</span>
                        <span className="dord-item-price">{formatCurrency(item.unit_price)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="dord-order-details">
                  <div className="dord-detail-row">
                    <span className="dord-detail-label">Delivery Method:</span>
                    <span className="dord-detail-value">
                      {order.delivery_method === 'pickup' ? <><Store size={14} /> Store Pickup</> : <><Truck size={14} /> Home Delivery</>}
                    </span>
                  </div>
                  {order.delivery_method === 'shipping' && order.shipping_address && (
                    <div className="dord-detail-row">
                      <span className="dord-detail-label">Shipping To:</span>
                      <span className="dord-detail-value">
                        {order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}
                      </span>
                    </div>
                  )}
                  {order.notes && (
                    <div className="dord-detail-row">
                      <span className="dord-detail-label">Notes:</span>
                      <span className="dord-detail-value">{order.notes}</span>
                    </div>
                  )}
                </div>

                <div className="dord-order-footer">
                  <div className="dord-order-total">
                    <span className="dord-total-label">Total:</span>
                    <span className="dord-total-amount">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {canRequestReturn(order.status) && (
                    <button
                      className="dord-return-btn"
                      onClick={() => handleRequestReturn(order)}
                    >
                      Request Return
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnModal && selectedOrder && (
        <div className="dord-modal-overlay" onClick={() => !isSubmitting && setShowReturnModal(false)}>
          <div className="dord-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dord-modal-header">
              <h2>Request Return</h2>
              <button
                className="dord-modal-close"
                onClick={() => !isSubmitting && setShowReturnModal(false)}
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>
            <div className="dord-modal-body">
              <p className="dord-modal-order-info">
                Order: <strong>#{selectedOrder.id.slice(0, 8).toUpperCase()}</strong>
              </p>
              <p className="dord-modal-order-info">
                Total: <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
              </p>

              <label className="dord-modal-label">
                Reason for return:
                <textarea
                  className="dord-modal-textarea"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Please explain why you want to return this order (minimum 10 characters)..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </label>

              {submitError && (
                <div className="dord-modal-error">{submitError}</div>
              )}
              {submitSuccess && (
                <div className="dord-modal-success">{submitSuccess}</div>
              )}
            </div>
            <div className="dord-modal-footer">
              <button
                className="dord-modal-cancel"
                onClick={() => setShowReturnModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="dord-modal-submit"
                onClick={handleSubmitReturn}
                disabled={isSubmitting || returnReason.trim().length < 10}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOrders;
