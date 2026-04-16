import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { returnsApi, EligibleOrder, EligibleOrderItem, ReturnRequest } from '../../services/api';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import {
  CheckCircle, RefreshCw, AlertTriangle, Package, Calendar,
  Inbox, RotateCcw, Clock, XCircle
} from 'lucide-react';
import './DashboardReturns.css';

const RETURN_REASONS = [
  { value: 'Damaged/Defective', label: 'Damaged/Defective' },
  { value: 'Wrong Item Received', label: 'Wrong Item Received' },
  { value: 'Item Not As Described', label: 'Item Not As Described' },
  { value: 'Changed My Mind', label: 'Changed My Mind' },
  { value: 'Other', label: 'Other' },
];

const STATUS_CONFIG: Record<string, { label: string; cssClass: string; icon: React.ReactNode }> = {
  pending:   { label: 'Pending Review', cssClass: 'dret-status-pending',   icon: <Clock size={13} /> },
  approved:  { label: 'Approved',       cssClass: 'dret-status-approved',  icon: <CheckCircle size={13} /> },
  rejected:  { label: 'Rejected',       cssClass: 'dret-status-rejected',  icon: <XCircle size={13} /> },
};

interface SelectedItem {
  order_item_id: string;
  quantity: number;
  maxQuantity: number;
  productName: string;
  unitPrice: number;
}

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';
type ActiveTab = 'history' | 'request';

interface DashboardReturnsProps {
  onNavigate: (section: NavItemId) => void;
  autoOpenOrderId?: string;
  highlightReturnId?: string;
}

const DashboardReturns: React.FC<DashboardReturnsProps> = ({ onNavigate, autoOpenOrderId, highlightReturnId }) => {
  const navigate = useNavigate();

  // Tab state — default to request so customers see eligible orders first
  const [activeTab, setActiveTab] = useState<ActiveTab>('request');

  // Return history state
  const [myReturns, setMyReturns] = useState<ReturnRequest[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(true);

  // Eligible orders state
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Return form state
  const [selectedOrder, setSelectedOrder] = useState<EligibleOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLoading = returnsLoading || ordersLoading;

  // Fetch return history
  const fetchMyReturns = useCallback(async () => {
    try {
      setReturnsLoading(true);
      const res = await returnsApi.getMyReturns();
      setMyReturns(res.items);
    } catch (err) {
      console.error('Failed to load return history:', err);
    } finally {
      setReturnsLoading(false);
    }
  }, []);

  // Fetch eligible orders
  const fetchEligibleOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const res = await returnsApi.getEligibleOrders();
      setEligibleOrders(res.items);
    } catch (err) {
      console.error('Failed to load eligible orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Load both in parallel on mount
  useEffect(() => {
    let isMounted = true;

    const fetchAll = async () => {
      const [returnsRes, ordersRes] = await Promise.allSettled([
        returnsApi.getMyReturns(),
        returnsApi.getEligibleOrders(),
      ]);
      if (!isMounted) return;
      if (returnsRes.status === 'fulfilled') setMyReturns(returnsRes.value.items);
      if (ordersRes.status === 'fulfilled') setEligibleOrders(ordersRes.value.items);
      setReturnsLoading(false);
      setOrdersLoading(false);
    };

    fetchAll();
    return () => { isMounted = false; };
  }, []);

  // ── Form handlers ─────────────────────────────────────────

  const handleSelectOrder = (order: EligibleOrder) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setReason('');
    setDescription('');
    setError(null);
  };

  // Auto-open return form for a specific order when navigated from MyOrders
  useEffect(() => {
    if (!autoOpenOrderId || ordersLoading) return;
    const order = eligibleOrders.find(o => o.id === autoOpenOrderId);
    if (order) {
      setActiveTab('request');
      handleSelectOrder(order);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenOrderId, eligibleOrders, ordersLoading]);

  // Auto-highlight a specific return when navigated from notifications
  useEffect(() => {
    if (!highlightReturnId || returnsLoading) return;
    setActiveTab('history');
    setTimeout(() => {
      const el = document.getElementById(`return-${highlightReturnId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('dret-highlighted');
        setTimeout(() => el.classList.remove('dret-highlighted'), 3000);
      }
    }, 100);
  }, [highlightReturnId, myReturns, returnsLoading]);

  const handleItemToggle = (item: EligibleOrderItem) => {
    setSelectedItems(prev => {
      const exists = prev.findIndex(si => si.order_item_id === item.id) >= 0;
      if (exists) return prev.filter(si => si.order_item_id !== item.id);
      return [...prev, {
        order_item_id: item.id,
        quantity: item.returnable_quantity,
        maxQuantity: item.returnable_quantity,
        productName: item.product_name,
        unitPrice: item.unit_price,
      }];
    });
  };

  const handleQuantityChange = (orderItemId: string, quantity: number) => {
    setSelectedItems(prev =>
      prev.map(si =>
        si.order_item_id === orderItemId
          ? { ...si, quantity: Math.max(1, Math.min(quantity, si.maxQuantity)) }
          : si
      )
    );
  };

  const returnTotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [selectedItems]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || selectedItems.length === 0 || !reason) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await returnsApi.createReturn({
        order_id: selectedOrder.id,
        reason,
        description: description.trim() || undefined,
        items: selectedItems.map(item => ({
          order_item_id: item.order_item_id,
          quantity: item.quantity,
        })),
      });

      // Refresh history and switch tab so customer immediately sees their new request
      await fetchMyReturns();
      await fetchEligibleOrders();
      setSelectedOrder(null);
      setSelectedItems([]);
      setReason('');
      setDescription('');
      setSuccessMessage('Return request submitted successfully!');
      setActiveTab('history');

      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        setError(responseData.errors[0]?.message || responseData.detail || 'Failed to submit return request');
      } else {
        setError(responseData?.detail || 'Failed to submit return request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setSelectedOrder(null);
    setSelectedItems([]);
    setReason('');
    setDescription('');
    setError(null);
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  // ── Loading ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="dret-container">
        <div className="dret-loading">
          <div className="dret-loading-spinner" />
          <p>Loading returns...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="dret-container">
      {/* Page Header */}
      <div className="dret-page-header">
        <div className="dret-header-info">
          <h2 className="dret-page-title">
            <RotateCcw size={24} className="dret-title-icon" />
            {selectedOrder ? 'Create Return Request' : 'Return Requests'}
          </h2>
          <p className="dret-page-subtitle">
            {selectedOrder
              ? `Requesting return for Order #${selectedOrder.id.slice(-8).toUpperCase()}`
              : 'Manage and track your return requests'}
          </p>
        </div>
        {selectedOrder && (
          <button className="dret-back-btn" onClick={handleBack}>
            Back to Orders
          </button>
        )}
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="dret-success-banner">
          <CheckCircle size={18} />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="dret-error-banner">
          <AlertTriangle size={20} className="dret-error-icon" />
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* ── Tab Bar (only when not in form view) ── */}
      {!selectedOrder && (
        <div className="dret-tabs">
          <button
            className={`dret-tab ${activeTab === 'history' ? 'dret-tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            My Returns
            {myReturns.length > 0 && (
              <span className="dret-tab-count">{myReturns.length}</span>
            )}
          </button>
          <button
            className={`dret-tab ${activeTab === 'request' ? 'dret-tab-active' : ''}`}
            onClick={() => setActiveTab('request')}
          >
            Request a Return
            {eligibleOrders.filter(o => !o.has_pending_return && o.items.some(i => i.returnable_quantity > 0)).length > 0 && (
              <span className="dret-tab-count dret-tab-count-eligible">
                {eligibleOrders.filter(o => !o.has_pending_return && o.items.some(i => i.returnable_quantity > 0)).length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: MY RETURNS (history)
          ══════════════════════════════════════════════════════ */}
      {!selectedOrder && activeTab === 'history' && (
        <section className="dret-history-section">
          {myReturns.length === 0 ? (
            <div className="dret-empty">
              <Inbox size={48} className="dret-empty-icon" />
              <h3>No Return Requests Yet</h3>
              <p>You haven't submitted any return requests. Eligible delivered orders can be returned within 7 days.</p>
              <button className="dret-shop-btn" onClick={() => setActiveTab('request')}>
                Request a Return
              </button>
            </div>
          ) : (
            <div className="dret-history-list">
              {myReturns.map(ret => {
                const statusCfg = STATUS_CONFIG[ret.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={ret.id} id={`return-${ret.id}`} className={`dret-history-card dret-history-card-${ret.status}`}>
                    {/* Card Header */}
                    <div className="dret-history-card-header">
                      <div className="dret-history-card-title">
                        <Package size={16} className="dret-history-pkg-icon" />
                        <span className="dret-history-order-id">
                          Order #{ret.order_id.slice(-8).toUpperCase()}
                        </span>
                      </div>
                      <span className={`dret-status-badge ${statusCfg.cssClass}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="dret-history-meta">
                      <span className="dret-history-meta-item">
                        <Calendar size={13} />
                        Submitted {formatDate(ret.created_at)}
                      </span>
                      {ret.order_total !== undefined && (
                        <span className="dret-history-meta-item">
                          Order total: {formatCurrency(ret.order_total)}
                        </span>
                      )}
                    </div>

                    {/* Reason */}
                    <div className="dret-history-reason">
                      <span className="dret-history-label">Reason:</span>
                      <span>{ret.reason}</span>
                    </div>

                    {/* Items — two-column breakdown for approved, simple list otherwise */}
                    {ret.items && ret.items.length > 0 && (
                      ret.status === 'approved' ? (
                        <div className="dret-item-breakdown">
                          <div className="dret-item-breakdown-header">
                            ✓ Return Approved
                          </div>
                          <div className="dret-item-breakdown-columns">
                            <div className="dret-item-col">
                              <h5 className="dret-item-col-title">Ordered Items</h5>
                              <ul className="dret-item-col-list">
                                {ret.items.map(item => (
                                  <li key={item.id} className="dret-item-col-row">
                                    <span className="dret-item-col-name">{item.product_name ?? 'Unknown product'}</span>
                                    <span className="dret-item-col-qty">x{item.original_quantity ?? item.quantity}</span>
                                    {item.unit_price != null && (
                                      <span className="dret-item-col-price">{formatCurrency(item.unit_price)}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="dret-item-col dret-item-returned-col">
                              <h5 className="dret-item-col-title">Returned Items</h5>
                              <ul className="dret-item-col-list">
                                {ret.items.map(item => (
                                  <li key={item.id} className="dret-item-col-row dret-item-returned-row">
                                    <span className="dret-item-col-name">{item.product_name ?? 'Unknown product'}</span>
                                    <span className="dret-item-col-qty">
                                      x{item.quantity} / {item.original_quantity ?? item.quantity}
                                    </span>
                                    {item.unit_price != null && (
                                      <span className="dret-item-col-price">{formatCurrency(item.unit_price)}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="dret-history-items">
                          <span className="dret-history-label">Items requested for return:</span>
                          <ul className="dret-history-items-list">
                            {ret.items.map(item => (
                              <li key={item.id}>
                                {item.product_name ?? 'Unknown product'} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}

                    {/* Description */}
                    {ret.description && (
                      <div className="dret-history-description">
                        <span className="dret-history-label">Details:</span>
                        <span className="dret-history-description-text">{ret.description}</span>
                      </div>
                    )}

                    {/* Admin Notes (rejection reason) */}
                    {ret.admin_notes && (
                      <div className="dret-admin-notes">
                        <AlertTriangle size={14} />
                        <div>
                          <span className="dret-admin-notes-label">
                            {ret.status === 'rejected' ? 'Rejection reason:' : 'Manager notes:'}
                          </span>
                          <p>{ret.admin_notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="dret-history-card-footer">
                      <span className="dret-history-updated">
                        Last updated {formatDateTime(ret.updated_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: REQUEST A RETURN — Order Selection
          ══════════════════════════════════════════════════════ */}
      {!selectedOrder && activeTab === 'request' && (
        <section className="dret-orders-section">
          <div className="dret-section-info">
            <p>Only delivered or ready for pickup orders within the 7-day return window are eligible.</p>
          </div>

          {/* Exclude orders that already have an active return — those are shown in My Returns */}
          {(() => {
            const requestableOrders = eligibleOrders.filter(o => !o.has_pending_return);
            return requestableOrders.length === 0 ? (
            <div className="dret-empty">
              <Inbox size={48} className="dret-empty-icon" />
              <h3>No Eligible Orders</h3>
              <p>You don't have any orders eligible for return. Returns must be requested within 7 days of delivery.</p>
              <button className="dret-shop-btn" onClick={() => navigate('/shop')}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="dret-orders-grid">
              {requestableOrders.map(order => {
                const hasReturnable = order.items.some(item => item.returnable_quantity > 0);
                const isExpired = order.return_deadline
                  ? new Date(order.return_deadline) < new Date()
                  : false;
                const isDisabled = !hasReturnable || isExpired;

                return (
                  <div
                    key={order.id}
                    className={`dret-order-card ${isDisabled ? 'dret-order-disabled' : 'dret-order-clickable'}`}
                  >
                    <div className="dret-order-header">
                      <span className="dret-order-id">#{order.id.slice(-8).toUpperCase()}</span>
                      <div className="dret-order-badges">
                        {isExpired && (
                          <span className="dret-expired-badge">Return Window Expired</span>
                        )}
                        {!isExpired && !hasReturnable && (
                          <span className="dret-no-returnable-badge">All Items Returned</span>
                        )}
                      </div>
                    </div>
                    <div className="dret-order-body">
                      <div className="dret-order-date">
                        <Calendar size={14} className="dret-date-icon" />
                        {formatDateTime(order.created_at)}
                      </div>
                      {order.return_deadline && !isExpired && (
                        <div className="dret-deadline-text">
                          Return by: {formatDate(order.return_deadline)}
                        </div>
                      )}
                      <div className="dret-order-items-count">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </div>
                      <div className="dret-order-items-preview">
                        {order.items.slice(0, 2).map(item => (
                          <span key={item.id} className="dret-item-preview">
                            {item.product_name}
                            {item.returnable_quantity < item.quantity && (
                              <span className="dret-partial-badge">
                                {item.returnable_quantity}/{item.quantity} returnable
                              </span>
                            )}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="dret-more-items">
                            +{order.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="dret-order-footer">
                      <span className="dret-order-total">
                        {formatCurrency(order.total_amount)}
                      </span>
                      {!isDisabled ? (
                        <button
                          className="dret-request-btn"
                          onClick={() => handleSelectOrder(order)}
                        >
                          Request Return
                        </button>
                      ) : (
                        <span className="dret-disabled-text">
                          {isExpired ? 'Window Expired' : 'Not Available'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
          })()}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          RETURN FORM (shown when an order is selected)
          ══════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <form className="dret-form" onSubmit={handleSubmit}>
          {/* Order Summary */}
          <section className="dret-order-summary">
            <div className="dret-summary-header">
              <h3>
                <Package size={20} className="dret-section-icon" />
                Order #{selectedOrder.id.slice(-8).toUpperCase()}
              </h3>
              <span className="dret-summary-date">{formatDate(selectedOrder.created_at)}</span>
            </div>
            <div className="dret-summary-total">
              Total: {formatCurrency(selectedOrder.total_amount)}
            </div>
          </section>

          {/* Item Selection */}
          <section className="dret-items-section">
            <div className="dret-section-header">
              <h3>
                <CheckCircle size={20} className="dret-section-icon" />
                Select Items to Return
              </h3>
              <p>Check the items you want to return and specify quantity</p>
            </div>

            <div className="dret-items-list">
              {selectedOrder.items.map(item => {
                const isSelected = selectedItems.some(si => si.order_item_id === item.id);
                const selectedItem = selectedItems.find(si => si.order_item_id === item.id);
                const isDisabled = item.returnable_quantity === 0;

                return (
                  <div
                    key={item.id}
                    className={`dret-item-card ${isSelected ? 'dret-item-selected' : ''} ${isDisabled ? 'dret-item-disabled' : ''}`}
                  >
                    <div className="dret-item-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => !isDisabled && handleItemToggle(item)}
                        disabled={isDisabled}
                        id={`item-${item.id}`}
                      />
                      <label htmlFor={`item-${item.id}`} />
                    </div>
                    <div className="dret-item-info">
                      <span className="dret-item-name">{item.product_name}</span>
                      <span className="dret-item-price">
                        {formatCurrency(item.unit_price)} × {item.quantity}
                      </span>
                      {item.already_returned_quantity > 0 && (
                        <span className="dret-item-returned">
                          {item.already_returned_quantity} already returned
                        </span>
                      )}
                      {isDisabled && (
                        <span className="dret-item-unavailable">No items available for return</span>
                      )}
                    </div>
                    {isSelected && !isDisabled && (
                      <div className="dret-item-quantity">
                        <label>Qty:</label>
                        <input
                          type="number"
                          min={1}
                          max={item.returnable_quantity}
                          value={selectedItem?.quantity ?? 1}
                          onChange={e => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                        />
                        <span className="dret-max-qty">/ {item.returnable_quantity}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedItems.length > 0 && (
              <div className="dret-return-summary">
                <span>Return Total:</span>
                <span className="dret-return-total">{formatCurrency(returnTotal)}</span>
              </div>
            )}
          </section>

          {/* Reason Selection */}
          <section className="dret-reason-section">
            <div className="dret-section-header">
              <h3>
                <AlertTriangle size={20} className="dret-section-icon" />
                Reason for Return
              </h3>
            </div>

            <div className="dret-reason-options">
              {RETURN_REASONS.map(option => (
                <label
                  key={option.value}
                  className={`dret-reason-option ${reason === option.value ? 'dret-reason-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={e => setReason(e.target.value)}
                  />
                  <span className="dret-reason-label">{option.label}</span>
                </label>
              ))}
            </div>

            <div className="dret-description-field">
              <label htmlFor="description">Additional Details (Optional)</label>
              <textarea
                id="description"
                placeholder="Provide any additional details about your return request..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
              />
              <span className="dret-char-count">{description.length}/1000</span>
            </div>
          </section>

          {/* Submit */}
          <div className="dret-submit-section">
            <button
              type="button"
              className="dret-cancel-btn"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="dret-submit-btn"
              disabled={isSubmitting || selectedItems.length === 0 || !reason}
            >
              {isSubmitting ? (
                <>
                  <span className="dret-btn-spinner" />
                  Submitting...
                </>
              ) : (
                'Submit Return Request'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DashboardReturns;
