import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { returnsApi, EligibleOrder, EligibleOrderItem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime, formatDate } from '../utils/dateUtils';
import { CheckCircle, RefreshCw, AlertTriangle, Package, Calendar, Inbox } from 'lucide-react';
import './RequestReturn.css';

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

const RequestReturn: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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

  // Get order ID from URL params
  const orderIdFromUrl = searchParams.get('orderId');

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

          // If order ID is in URL, pre-select it
          if (orderIdFromUrl) {
            const order = response.items.find(o => o.id === orderIdFromUrl);
            if (order) {
              setSelectedOrder(order);
            }
          }
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
  }, [orderIdFromUrl]);

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
      // Remove item
      setSelectedItems(prev => prev.filter(si => si.order_item_id !== item.id));
    } else {
      // Add item with default quantity
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

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting return request:', err);
      // Handle validation errors with detailed messages
      const responseData = err.response?.data;
      if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Show first validation error message
        const firstError = responseData.errors[0];
        setError(firstError?.message || responseData.detail || 'Failed to submit return request');
      } else {
        setError(responseData?.detail || 'Failed to submit return request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (selectedOrder && !orderIdFromUrl) {
      setSelectedOrder(null);
      setSelectedItems([]);
      setReason('');
      setDescription('');
    } else {
      navigate('/dashboard');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  // Get user's first name
  const firstName = user?.full_name?.split(' ')[0] || 'Customer';

  // Render loading state
  if (isLoading) {
    return (
      <div className="request-return">
        <div className="rr-loading">
          <div className="rr-loading-spinner"></div>
          <p>Loading eligible orders...</p>
        </div>
      </div>
    );
  }

  // Render success message
  if (successMessage) {
    return (
      <div className="request-return">
        <div className="rr-success">
          <span className="rr-success-icon"><CheckCircle size={48} color="#16a34a" /></span>
          <h2>{successMessage}</h2>
          <p>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="request-return">
      {/* Header */}
      <header className="rr-header">
        <div className="rr-header-content">
          <button className="rr-back-btn" onClick={handleBack}>
            <span>←</span> Back
          </button>
          <div className="rr-logo">
            <span className="rr-logo-icon"><RefreshCw size={20} /></span>
            <span className="rr-logo-text">Request Return</span>
          </div>
          <div className="rr-user-info">
            <span className="rr-user-avatar">{firstName.charAt(0).toUpperCase()}</span>
            <span className="rr-user-name">{firstName}</span>
          </div>
        </div>
      </header>

      <main className="rr-main">
        {/* Error Message */}
        {error && (
          <div className="rr-error-banner">
            <span className="rr-error-icon"><AlertTriangle size={20} color="#dc2626" /></span>
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Order Selection View */}
        {!selectedOrder && (
          <section className="rr-orders-section">
            <div className="rr-section-header">
              <h2>
                <span className="rr-section-icon"><Package size={20} /></span>
                Select Order for Return
              </h2>
              <p>Only delivered or ready for pickup orders within the 7-day return window are eligible</p>
            </div>

            {eligibleOrders.length === 0 ? (
              <div className="rr-empty">
                <span className="rr-empty-icon"><Inbox size={48} /></span>
                <h3>No Eligible Orders</h3>
                <p>You don't have any orders eligible for return. Returns must be requested within 7 days of delivery.</p>
                <button className="rr-shop-btn" onClick={() => navigate('/shop')}>
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="rr-orders-grid">
                {eligibleOrders.map(order => {
                  const hasReturnable = order.items.some(item => item.returnable_quantity > 0);
                  const isDisabled = order.has_pending_return || !hasReturnable;
                  
                  return (
                    <div
                      key={order.id}
                      className={`rr-order-card ${isDisabled ? 'rr-order-disabled' : 'rr-order-clickable'}`}
                    >
                      <div className="rr-order-header">
                        <span className="rr-order-id">#{order.id.slice(-8).toUpperCase()}</span>
                        {order.has_pending_return && (
                          <span className="rr-pending-badge">Pending Return</span>
                        )}
                        {!order.has_pending_return && !hasReturnable && (
                          <span className="rr-no-returnable-badge">All Items Returned</span>
                        )}
                      </div>
                      <div className="rr-order-body">
                        <div className="rr-order-date">
                          <span className="rr-date-icon"><Calendar size={14} /></span>
                          {formatDateTime(order.created_at)}
                        </div>
                        {order.return_deadline && (
                          <div className="rr-return-deadline">
                            Return by: {formatDate(order.return_deadline)}
                          </div>
                        )}
                        <div className="rr-order-items-count">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </div>
                        <div className="rr-order-items-preview">
                          {order.items.slice(0, 2).map(item => (
                            <span key={item.id} className="rr-item-preview">
                              {item.product_name}
                              {item.returnable_quantity < item.quantity && (
                                <span className="rr-partial-badge">
                                  {item.returnable_quantity}/{item.quantity} returnable
                                </span>
                              )}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span className="rr-more-items">
                              +{order.items.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="rr-order-footer">
                        <span className="rr-order-total">
                          {formatCurrency(order.total_amount)}
                        </span>
                        {!isDisabled ? (
                          <button 
                            className="rr-request-btn"
                            onClick={() => handleSelectOrder(order)}
                          >
                            Request Return
                          </button>
                        ) : (
                          <span className="rr-disabled-text">
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
          <form className="rr-form" onSubmit={handleSubmit}>
            {/* Order Summary */}
            <section className="rr-order-summary">
              <div className="rr-summary-header">
                <h2>
                  <span className="rr-section-icon"><Package size={20} /></span>
                  Order #{selectedOrder.id.slice(-8).toUpperCase()}
                </h2>
                <span className="rr-summary-date">{formatDate(selectedOrder.created_at)}</span>
              </div>
              <div className="rr-summary-total">
                Total: {formatCurrency(selectedOrder.total_amount)}
              </div>
            </section>

            {/* Item Selection */}
            <section className="rr-items-section">
              <div className="rr-section-header">
                <h3>
                  <span className="rr-section-icon"><CheckCircle size={20} /></span>
                  Select Items to Return
                </h3>
                <p>Check the items you want to return and specify quantity</p>
              </div>

              <div className="rr-items-list">
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
                      className={`rr-item-card ${isSelected ? 'rr-item-selected' : ''} ${isDisabled ? 'rr-item-disabled' : ''}`}
                    >
                      <div className="rr-item-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => !isDisabled && handleItemToggle(item)}
                          disabled={isDisabled}
                          id={`item-${item.id}`}
                        />
                        <label htmlFor={`item-${item.id}`}></label>
                      </div>
                      <div className="rr-item-info">
                        <span className="rr-item-name">{item.product_name}</span>
                        <span className="rr-item-price">
                          {formatCurrency(item.unit_price)} × {item.quantity}
                        </span>
                        {item.already_returned_quantity > 0 && (
                          <span className="rr-item-returned">
                            {item.already_returned_quantity} already returned
                          </span>
                        )}
                        {isDisabled && (
                          <span className="rr-item-unavailable">
                            No items available for return
                          </span>
                        )}
                      </div>
                      {isSelected && !isDisabled && (
                        <div className="rr-item-quantity">
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
                          <span className="rr-max-qty">/ {item.returnable_quantity}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedItems.length > 0 && (
                <div className="rr-return-summary">
                  <span>Return Total:</span>
                  <span className="rr-return-total">{formatCurrency(returnTotal)}</span>
                </div>
              )}
            </section>

            {/* Reason Selection */}
            <section className="rr-reason-section">
              <div className="rr-section-header">
                <h3>
                  <span className="rr-section-icon"><AlertTriangle size={20} /></span>
                  Reason for Return
                </h3>
              </div>

              <div className="rr-reason-options">
                {RETURN_REASONS.map(option => (
                  <label
                    key={option.value}
                    className={`rr-reason-option ${reason === option.value ? 'rr-reason-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={e => setReason(e.target.value)}
                    />
                    <span className="rr-reason-label">{option.label}</span>
                  </label>
                ))}
              </div>

              <div className="rr-description-field">
                <label htmlFor="description">Additional Details (Optional)</label>
                <textarea
                  id="description"
                  placeholder="Provide any additional details about your return request..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
                <span className="rr-char-count">{description.length}/1000</span>
              </div>
            </section>

            {/* Submit Button */}
            <div className="rr-submit-section">
              <button
                type="button"
                className="rr-cancel-btn"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rr-submit-btn"
                disabled={isSubmitting || selectedItems.length === 0 || !reason}
              >
                {isSubmitting ? (
                  <>
                    <span className="rr-btn-spinner"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Return Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default RequestReturn;
