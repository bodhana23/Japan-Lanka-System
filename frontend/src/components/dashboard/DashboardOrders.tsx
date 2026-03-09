import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersApi, returnsApi, Order, ReturnItemSummary } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import { AlertTriangle, Inbox, Store, Truck, Package, RefreshCw, FileText, Loader2 } from 'lucide-react';
import './DashboardOrders.css';

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardOrdersProps {
  onNavigate: (section: NavItemId) => void;
  highlightOrderId?: string;
}

const DashboardOrders: React.FC<DashboardOrdersProps> = ({ onNavigate, highlightOrderId }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [eligibleOrderIds, setEligibleOrderIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDescription, setReturnDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Valid return reasons matching backend validation
  const RETURN_REASONS = [
    'Damaged/Defective',
    'Wrong Item Received',
    'Item Not As Described',
    'Changed My Mind',
    'Other'
  ];
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

  // Fetch orders from API
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [ordersRes, eligibleRes] = await Promise.allSettled([
          ordersApi.getMyOrders(),
          returnsApi.getEligibleOrders(),
        ]);
        if (isMounted) {
          if (ordersRes.status === 'fulfilled') {
            setOrders(ordersRes.value.items);
          } else {
            setError('Failed to load orders');
          }
          if (eligibleRes.status === 'fulfilled') {
            setEligibleOrderIds(new Set(eligibleRes.value.items.map((o: { id: string }) => o.id)));
          }
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

  // Scroll to and highlight order when navigated from notification
  useEffect(() => {
    if (!highlightOrderId || isLoading) return;
    setTimeout(() => {
      const el = document.getElementById(`order-${highlightOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('dord-highlighted');
        setTimeout(() => el.classList.remove('dord-highlighted'), 3000);
      }
    }, 100);
  }, [highlightOrderId, isLoading]);

  const handleRequestReturn = (order: Order) => {
    // Navigate to returns section with the order pre-selected
    navigate(`/customer?section=returns&order_id=${order.id}`);
  };

  const handleSubmitReturn = async () => {
    if (isSubmitting) return;
    if (!selectedOrder || !returnReason) {
      setSubmitError('Please select a reason for return');
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
        reason: returnReason,
        description: returnDescription.trim() || undefined,
        items: returnItems
      });
      setSubmitSuccess('Return request submitted successfully!');

      // Immediately remove from eligible set so button disappears
      setEligibleOrderIds(prev => {
        const next = new Set(prev);
        next.delete(selectedOrder.id);
        return next;
      });

      // Re-sync from backend
      try {
        const freshEligible = await returnsApi.getEligibleOrders();
        setEligibleOrderIds(new Set(freshEligible.items.map((o: { id: string }) => o.id)));
      } catch {
        // Non-fatal: optimistic update above already hid the button
      }

      setTimeout(() => {
        setShowReturnModal(false);
        setSelectedOrder(null);
        setReturnReason('');
        setReturnDescription('');
        setSubmitSuccess(null);
      }, 2000);
    } catch (error: any) {
      setSubmitError(error.response?.data?.detail || "Failed to submit return.");
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

  // Backend eligible-orders API is the single authority: it excludes orders with
  // existing returns, expired 7-day windows, and non-returnable statuses.
  const canShowReturnButton = (orderId: string) => eligibleOrderIds.has(orderId);

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
              <div key={order.id} id={`order-${order.id}`} className="dord-order-card">
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

                {/* Return status section */}
                {order.return_status === 'approved' && order.return_items && order.return_items.length > 0 && (
                  <div className="dord-return-breakdown">
                    <div className="dord-return-breakdown-header dord-return-approved-header">
                      ✓ Return Approved
                      {order.return_admin_notes && (
                        <span className="dord-return-note-inline"> — {order.return_admin_notes}</span>
                      )}
                    </div>
                    <div className="dord-return-breakdown-columns">
                      <div className="dord-return-col">
                        <h5 className="dord-return-col-title">Ordered Items</h5>
                        <ul className="dord-return-item-list">
                          {order.items.map((item, idx) => (
                            <li key={idx} className="dord-return-item-row">
                              <span className="dord-return-item-name">{item.product_name || 'Product'}</span>
                              <span className="dord-return-item-qty">x{item.quantity}</span>
                              <span className="dord-return-item-price">{formatCurrency(item.unit_price)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="dord-return-col dord-returned-col">
                        <h5 className="dord-return-col-title">Returned Items</h5>
                        <ul className="dord-return-item-list">
                          {order.return_items.map((ri: ReturnItemSummary, idx: number) => (
                            <li key={idx} className="dord-return-item-row dord-returned-item">
                              <span className="dord-return-item-name">{ri.product_name || 'Product'}</span>
                              <span className="dord-return-item-qty">x{ri.returned_quantity} / {ri.original_quantity}</span>
                              <span className="dord-return-item-price">{formatCurrency(ri.unit_price)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {order.return_status === 'approved' && (!order.return_items || order.return_items.length === 0) && (
                  <div className="dord-return-banner dord-return-approved">
                    <AlertTriangle size={14} />
                    <div>
                      <strong>Return Approved</strong>
                      {order.return_admin_notes && (
                        <p className="dord-return-note">Manager: {order.return_admin_notes}</p>
                      )}
                    </div>
                  </div>
                )}
                {order.return_status === 'pending' && (
                  <div className="dord-return-banner dord-return-pending">
                    <AlertTriangle size={14} />
                    <span>Return request pending review</span>
                  </div>
                )}
                {order.return_status === 'rejected' && (
                  <div className="dord-return-banner dord-return-rejected">
                    <AlertTriangle size={14} />
                    <div>
                      <strong>Return Rejected</strong>
                      {order.return_admin_notes && (
                        <p className="dord-return-note">Reason: {order.return_admin_notes}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="dord-order-footer">
                  <div className="dord-order-total">
                    <span className="dord-total-label">Total:</span>
                    <span className="dord-total-amount">{formatCurrency(order.total_amount)}</span>
                  </div>
                  <div className="dord-order-actions">
                    {canDownloadBill(order) && (
                      <button
                        className="dord-download-btn"
                        onClick={() => handleDownloadBill(order.id)}
                        disabled={downloadingBillId === order.id}
                      >
                        {downloadingBillId === order.id ? (
                          <>
                            <Loader2 size={14} className="dord-btn-icon spinning" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <FileText size={14} className="dord-btn-icon" />
                            Download Bill (PDF)
                          </>
                        )}
                      </button>
                    )}
                    {canShowReturnButton(order.id) && (
                      <button
                        className="dord-return-btn"
                        onClick={() => handleRequestReturn(order)}
                      >
                        Request Return
                      </button>
                    )}
                  </div>
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
                <select
                  className="dord-modal-select"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select a reason...</option>
                  {RETURN_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </label>

              <label className="dord-modal-label">
                Additional details (optional):
                <textarea
                  className="dord-modal-textarea"
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Provide any additional details about your return..."
                  rows={3}
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
                disabled={isSubmitting || !returnReason}
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
