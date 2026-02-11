import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, returnsApi, Order } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/dateUtils';
import { Car, AlertTriangle, Inbox, Store, Truck, FileText, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import './MyOrders.css';

const MyOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  // Handle logout click - show confirmation modal
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Handle confirmed logout
  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  // Handle cancel logout
  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleBackToDashboard = () => {
    navigate('/customer');
  };

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
      // Create return request for all items in the order
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

  const canDownloadBill = (order: Order) => {
    // Bills are available for non-cancelled orders
    return order.status !== 'cancelled';
  };

  const handleDownloadBill = async (orderId: string) => {
    try {
      setDownloadingBillId(orderId);
      await ordersApi.downloadBill(orderId);
    } catch (err) {
      console.error('Error downloading bill:', err);
      setError('Failed to download bill. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDownloadingBillId(null);
    }
  };

  const firstName = user?.full_name?.split(' ')[0] || 'Customer';

  return (
    <div className="my-orders-page">
      {/* Header */}
      <header className="mo-header">
        <div className="mo-header-content">
          <div className="mo-header-left">
            <button className="mo-back-btn" onClick={handleBackToDashboard}>
              ← Back
            </button>
            <div className="mo-logo">
              <Car size={20} className="mo-logo-icon" />
              <span className="mo-logo-text">Japan Lanka</span>
            </div>
          </div>
          <div className="mo-header-actions">
            <span className="mo-user-name">Hi, {firstName}</span>
            <button onClick={handleLogoutClick} className="mo-logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mo-main">
        <div className="mo-page-header">
          <h1 className="mo-page-title">My Orders</h1>
          <p className="mo-page-subtitle">Track and manage your orders</p>
        </div>

        {isLoading ? (
          <div className="mo-loading">
            <div className="mo-loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : error ? (
          <div className="mo-error">
            <AlertTriangle size={32} className="mo-error-icon" />
            <p>{error}</p>
            <button className="mo-retry-btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mo-empty">
            <Inbox size={48} className="mo-empty-icon" />
            <h3>No orders yet</h3>
            <p>Start shopping to see your orders here!</p>
            <button className="mo-shop-btn" onClick={() => navigate('/shop')}>
              Browse Parts
            </button>
          </div>
        ) : (
          <div className="mo-orders-list">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const showOrderActions = canDownloadBill(order) || canRequestReturn(order.status);
              return (
                <div key={order.id} className="mo-order-card">
                  <div className="mo-order-header">
                    <div className="mo-order-info">
                      <span className="mo-order-id">#{order.id.slice(0, 8).toUpperCase()}</span>
                      <span className="mo-order-date">{formatDateTime(order.created_at)}</span>
                    </div>
                    <span
                      className="mo-order-status"
                      style={{
                        color: statusInfo.color,
                        backgroundColor: statusInfo.bgColor
                      }}
                    >
                      {statusInfo.text}
                    </span>
                  </div>

                  <div className="mo-order-items">
                    <h4>Items ({order.items.length})</h4>
                    <ul>
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          <span className="mo-item-name">{item.product_name || `Product`}</span>
                          <span className="mo-item-qty">x{item.quantity}</span>
                          <span className="mo-item-price">{formatCurrency(item.unit_price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mo-order-details">
                    <div className="mo-detail-row">
                      <span className="mo-detail-label">Delivery Method:</span>
                      <span className="mo-detail-value">
                        {order.delivery_method === 'pickup' ? <><Store size={14} /> Store Pickup</> : <><Truck size={14} /> Home Delivery</>}
                      </span>
                    </div>
                    {order.delivery_method === 'shipping' && order.shipping_address && (
                      <div className="mo-detail-row">
                        <span className="mo-detail-label">Shipping To:</span>
                        <span className="mo-detail-value">
                          {order.shipping_address}, {order.shipping_city} {order.shipping_postal_code}
                        </span>
                      </div>
                    )}
                    {order.notes && (
                      <div className="mo-detail-row">
                        <span className="mo-detail-label">Notes:</span>
                        <span className="mo-detail-value">{order.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="mo-order-footer">
                    <div className="mo-order-total">
                      <span className="mo-total-label">Total:</span>
                      <span className="mo-total-amount">{formatCurrency(order.total_amount)}</span>
                    </div>
                    {showOrderActions && (
                      <div className="mo-order-actions">
                        {canDownloadBill(order) && (
                          <button
                            className="mo-download-btn"
                            onClick={() => handleDownloadBill(order.id)}
                            disabled={downloadingBillId === order.id}
                          >
                            {downloadingBillId === order.id ? (
                              <>
                                <Loader2 size={14} className="mo-btn-icon spinning" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <FileText size={14} className="mo-btn-icon" />
                                Download Bill (PDF)
                              </>
                            )}
                          </button>
                        )}
                        {canRequestReturn(order.status) && (
                          <button
                            className="mo-return-btn"
                            onClick={() => handleRequestReturn(order)}
                          >
                            Request Return
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Return Request Modal */}
      {showReturnModal && selectedOrder && (
        <div className="mo-modal-overlay" onClick={() => !isSubmitting && setShowReturnModal(false)}>
          <div className="mo-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mo-modal-header">
              <h2>Request Return</h2>
              <button
                className="mo-modal-close"
                onClick={() => !isSubmitting && setShowReturnModal(false)}
                disabled={isSubmitting}
              >
                &times;
              </button>
            </div>
            <div className="mo-modal-body">
              <p className="mo-modal-order-info">
                Order: <strong>#{selectedOrder.id.slice(0, 8).toUpperCase()}</strong>
              </p>
              <p className="mo-modal-order-info">
                Total: <strong>{formatCurrency(selectedOrder.total_amount)}</strong>
              </p>

              <label className="mo-modal-label">
                Reason for return:
                <textarea
                  className="mo-modal-textarea"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Please explain why you want to return this order (minimum 10 characters)..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </label>

              {submitError && (
                <div className="mo-modal-error">{submitError}</div>
              )}
              {submitSuccess && (
                <div className="mo-modal-success">{submitSuccess}</div>
              )}
            </div>
            <div className="mo-modal-footer">
              <button
                className="mo-modal-cancel"
                onClick={() => setShowReturnModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="mo-modal-submit"
                onClick={handleSubmitReturn}
                disabled={isSubmitting || returnReason.trim().length < 10}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </div>
  );
};

export default MyOrders;
