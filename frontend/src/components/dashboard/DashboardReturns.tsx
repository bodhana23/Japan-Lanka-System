import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { returnsApi, EligibleOrder, EligibleOrderItem } from '../../services/api';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { CheckCircle, RefreshCw, AlertTriangle, Package, Calendar, Inbox, RotateCcw } from 'lucide-react';
import './DashboardReturns.css';

// Return reason options
const RETURN_REASONS = [
  { value: 'Damaged/Defective', label: 'Damaged/Defective' },
  { value: 'Wrong Item Received', label: 'Wrong Item Received' },
  { value: 'Item Not As Described', label: 'Item Not As Described' },
  { value: 'Changed My Mind', label: 'Changed My Mind' },
  { value: 'Other', label: 'Other' },
];

interface SelectedItem {
  order_item_id: string;
  quantity: number;
  maxQuantity: number;
  productName: string;
  unitPrice: number;
}

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardReturnsProps {
  onNavigate: (section: NavItemId) => void;
}

const DashboardReturns: React.FC<DashboardReturnsProps> = ({ onNavigate }) => {
  const navigate = useNavigate();

  // State
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<EligibleOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch eligible orders
  useEffect(() => {
    let isMounted = true;

    const fetchEligibleOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await returnsApi.getEligibleOrders();
        if (isMounted) {
          setEligibleOrders(response.items);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching eligible orders:', err);
          setError(err.response?.data?.detail || 'Failed to load eligible orders');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchEligibleOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle order selection
  const handleSelectOrder = (order: EligibleOrder) => {
    setSelectedOrder(order);
    setSelectedItems([]);
    setReason('');
    setDescription('');
    setError(null);
  };

  // Handle item checkbox toggle
  const handleItemToggle = (item: EligibleOrderItem) => {
    const existingIndex = selectedItems.findIndex(
      si => si.order_item_id === item.id
    );

    if (existingIndex >= 0) {
      setSelectedItems(prev => prev.filter(si => si.order_item_id !== item.id));
    } else {
      setSelectedItems(prev => [
        ...prev,
        {
          order_item_id: item.id,
          quantity: item.returnable_quantity,
          maxQuantity: item.returnable_quantity,
          productName: item.product_name,
          unitPrice: item.unit_price,
        },
      ]);
    }
  };

  // Handle item quantity change
  const handleQuantityChange = (orderItemId: string, quantity: number) => {
    setSelectedItems(prev =>
      prev.map(si =>
        si.order_item_id === orderItemId
          ? { ...si, quantity: Math.max(1, Math.min(quantity, si.maxQuantity)) }
          : si
      )
    );
  };

  // Calculate return total
  const returnTotal = useMemo(() => {
    return selectedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
  }, [selectedItems]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) {
      setError('Please select an order');
      return;
    }

    if (selectedItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }

    if (!reason) {
      setError('Please select a reason for return');
      return;
    }

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

      setSuccessMessage('Return request submitted successfully!');

      setTimeout(() => {
        setSuccessMessage(null);
        setSelectedOrder(null);
        setSelectedItems([]);
        setReason('');
        setDescription('');
        onNavigate('overview');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting return request:', err);
      setError(err.response?.data?.detail || 'Failed to submit return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (selectedOrder) {
      setSelectedOrder(null);
      setSelectedItems([]);
      setReason('');
      setDescription('');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="dret-container">
        <div className="dret-loading">
          <div className="dret-loading-spinner"></div>
          <p>Loading eligible orders...</p>
        </div>
      </div>
    );
  }

  // Render success message
  if (successMessage) {
    return (
      <div className="dret-container">
        <div className="dret-success">
          <CheckCircle size={48} className="dret-success-icon" />
          <h2>{successMessage}</h2>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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
              : 'Select an order to request a return'
            }
          </p>
        </div>
        {selectedOrder && (
          <button className="dret-back-btn" onClick={handleBack}>
            Back to Orders
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="dret-error-banner">
          <AlertTriangle size={20} className="dret-error-icon" />
          <p>{error}</p>
          <button onClick={() => setError(null)}>x</button>
        </div>
      )}

      {/* Order Selection View */}
      {!selectedOrder && (
        <section className="dret-orders-section">
          <div className="dret-section-info">
            <p>Only delivered or ready for pickup orders are eligible for return requests</p>
          </div>

          {eligibleOrders.length === 0 ? (
            <div className="dret-empty">
              <Inbox size={48} className="dret-empty-icon" />
              <h3>No Eligible Orders</h3>
              <p>You don't have any delivered or ready for pickup orders eligible for return.</p>
              <button className="dret-shop-btn" onClick={() => navigate('/shop')}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="dret-orders-grid">
              {eligibleOrders.map(order => {
                const hasReturnable = order.items.some(item => item.returnable_quantity > 0);
                const isDisabled = order.has_pending_return || !hasReturnable;

                return (
                  <div
                    key={order.id}
                    className={`dret-order-card ${isDisabled ? 'dret-order-disabled' : 'dret-order-clickable'}`}
                  >
                    <div className="dret-order-header">
                      <span className="dret-order-id">#{order.id.slice(-8).toUpperCase()}</span>
                      {order.has_pending_return && (
                        <span className="dret-pending-badge">Pending Return</span>
                      )}
                      {!order.has_pending_return && !hasReturnable && (
                        <span className="dret-no-returnable-badge">All Items Returned</span>
                      )}
                    </div>
                    <div className="dret-order-body">
                      <div className="dret-order-date">
                        <Calendar size={14} className="dret-date-icon" />
                        {formatDateTime(order.created_at)}
                      </div>
                      <div className="dret-order-items-count">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
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
                          {order.has_pending_return ? 'Return in Progress' : 'Not Available'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Return Form View */}
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
                const isSelected = selectedItems.some(
                  si => si.order_item_id === item.id
                );
                const selectedItem = selectedItems.find(
                  si => si.order_item_id === item.id
                );
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
                      <label htmlFor={`item-${item.id}`}></label>
                    </div>
                    <div className="dret-item-info">
                      <span className="dret-item-name">{item.product_name}</span>
                      <span className="dret-item-price">
                        {formatCurrency(item.unit_price)} x {item.quantity}
                      </span>
                      {item.already_returned_quantity > 0 && (
                        <span className="dret-item-returned">
                          {item.already_returned_quantity} already returned
                        </span>
                      )}
                      {isDisabled && (
                        <span className="dret-item-unavailable">
                          No items available for return
                        </span>
                      )}
                    </div>
                    {isSelected && !isDisabled && (
                      <div className="dret-item-quantity">
                        <label>Qty:</label>
                        <input
                          type="number"
                          min={1}
                          max={item.returnable_quantity}
                          value={selectedItem?.quantity || 1}
                          onChange={e =>
                            handleQuantityChange(item.id, parseInt(e.target.value) || 1)
                          }
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

          {/* Submit Button */}
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
                  <span className="dret-btn-spinner"></span>
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
