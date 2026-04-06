import React, { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw, Inbox, AlertTriangle, Store, FileText, Loader2, RotateCcw, CheckCircle, ShoppingBag } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import { ordersApi, returnsApi } from '../../services/api';
import ConfirmModal from '../ConfirmModal';

interface OrderItemDetail {
  id: string;         // order_item_id (UUID)
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface CustomerOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  itemDetails?: OrderItemDetail[];  // Full item data including order_item_id
  totalAmount: number;
  status: 'pending' | 'in_progress' | 'shipped' | 'ready_to_pickup' | 'delivered' | 'picked_up' | 'return_approved';
  orderDate: string;
  deliveryAddress?: string;
  contactNumber: string;
  deliveryMethod?: 'pickup' | 'shipping';
  // Offline sales fields
  salesChannel?: 'online' | 'offline';
  offlineCustomerName?: string;
  offlineCustomerPhone?: string;
  // Bill generation
  isBillable?: boolean;
  // Payment info
  paymentStatus?: 'not_paid' | 'partially_paid' | 'paid';
  paidAmount?: number;
  remainingAmount?: number;
}

interface DashboardOrdersProps {
  orders: CustomerOrder[];
  isLoading: boolean;
  error: string | null;
  onStatusUpdate: (orderId: string, newStatus: CustomerOrder['status']) => void;
  highlightOrderId?: string;
  onReturnProcessed?: () => void;  // Callback to refresh orders after a return is processed
}

const RETURN_REASONS = [
  'Damaged/Defective',
  'Wrong Item Received',
  'Item Not As Described',
  'Changed My Mind',
  'Other',
];

export const DashboardOrders: React.FC<DashboardOrdersProps> = ({
  orders,
  isLoading,
  error,
  onStatusUpdate,
  highlightOrderId,
  onReturnProcessed,
}) => {
  // Order filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'shipped' | 'ready_to_pickup' | 'delivered' | 'picked_up' | 'return_approved'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'name_az'>('newest');
  const [isFiltering, setIsFiltering] = useState(false);
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

  // Track orders for which an offline return was successfully processed this session
  const [processedOfflineReturnIds, setProcessedOfflineReturnIds] = useState<Set<string>>(new Set());

  // Offline return modal state
  const [offlineReturnOrder, setOfflineReturnOrder] = useState<CustomerOrder | null>(null);
  const [offlineReturnItems, setOfflineReturnItems] = useState<Record<number, number>>({});
  const [offlineReturnReason, setOfflineReturnReason] = useState('');
  const [offlineReturnDescription, setOfflineReturnDescription] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnModalError, setReturnModalError] = useState<string | null>(null);

  // Scroll to and highlight order when navigated from notification
  useEffect(() => {
    if (!highlightOrderId || isLoading) return;
    setTimeout(() => {
      const el = document.getElementById(`mgr-order-${highlightOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('mgr-order-highlighted');
        setTimeout(() => el.classList.remove('mgr-order-highlighted'), 3000);
      }
    }, 100);
  }, [highlightOrderId, isLoading]);

  // Status change confirmation state
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    orderId: string;
    newStatus: CustomerOrder['status'];
  } | null>(null);

  const handleDownloadBill = async (orderId: string) => {
    setDownloadingBillId(orderId);
    try {
      await ordersApi.downloadBill(orderId);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download bill';
      alert(errorMessage);
    } finally {
      setDownloadingBillId(null);
    }
  };

  // Handle status change click - opens confirmation modal
  const handleStatusClick = (orderId: string, newStatus: CustomerOrder['status']) => {
    setPendingStatusChange({ orderId, newStatus });
  };

  // Confirm status change - calls the API
  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    onStatusUpdate(pendingStatusChange.orderId, pendingStatusChange.newStatus);
    setPendingStatusChange(null);
  };

  // Cancel status change - closes the modal
  const cancelStatusChange = () => {
    setPendingStatusChange(null);
  };

  // Offline return handlers
  const handleProcessReturnClick = (order: CustomerOrder) => {
    setOfflineReturnOrder(order);
    const initQty: Record<number, number> = {};
    (order.itemDetails ?? []).forEach((_, i) => { initQty[i] = 0; });
    setOfflineReturnItems(initQty);
    setOfflineReturnReason('');
    setOfflineReturnDescription('');
    setReturnModalError(null);
  };

  const handleCloseReturnModal = () => {
    setOfflineReturnOrder(null);
    setOfflineReturnItems({});
    setOfflineReturnReason('');
    setOfflineReturnDescription('');
    setReturnModalError(null);
  };

  const handleSubmitOfflineReturn = async () => {
    if (!offlineReturnOrder) return;

    const hasItems = Object.values(offlineReturnItems).some(q => q > 0);
    if (!hasItems) {
      setReturnModalError('Please select at least one item to return.');
      return;
    }
    if (!offlineReturnReason) {
      setReturnModalError('Please select a return reason.');
      return;
    }

    const itemDetails = offlineReturnOrder.itemDetails ?? [];
    const returnItems = itemDetails
      .map((item, i) => ({ order_item_id: item.id, quantity: offlineReturnItems[i] ?? 0 }))
      .filter(item => item.quantity > 0);

    setIsSubmittingReturn(true);
    setReturnModalError(null);
    const processedOrderId = offlineReturnOrder.id;
    try {
      await returnsApi.createOfflineReturn(processedOrderId, {
        reason: offlineReturnReason,
        description: offlineReturnDescription || undefined,
        items: returnItems,
      });
      setProcessedOfflineReturnIds(prev => new Set(prev).add(processedOrderId));
      handleCloseReturnModal();
      onReturnProcessed?.();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.detail || 'Failed to process return. Please try again.';
      setReturnModalError(msg);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Get display name for status
  const getStatusDisplayName = (status: CustomerOrder['status']): string => {
    const statusNames: Record<CustomerOrder['status'], string> = {
      'pending': 'Pending',
      'in_progress': 'In Progress',
      'shipped': 'Shipped',
      'ready_to_pickup': 'Ready to Pickup',
      'delivered': 'Delivered',
      'picked_up': 'Picked Up',
      'return_approved': 'Return Approved'
    };
    return statusNames[status] || status;
  };

  // Debounced search with filtering simulation
  useEffect(() => {
    if (searchQuery || statusFilter !== 'all' || dateFrom || dateTo || sortBy !== 'newest') {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, statusFilter, dateFrom, dateTo, sortBy]);

  // Filtered and sorted orders using useMemo
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply date range filter (using proper date comparison)
    if (dateFrom) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        const fromDate = new Date(dateFrom);
        return orderDate >= fromDate;
      });
    }
    if (dateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        const toDate = new Date(dateTo);
        return toDate >= orderDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case 'oldest':
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        case 'amount_high':
          return b.totalAmount - a.totalAmount;
        case 'amount_low':
          return a.totalAmount - b.totalAmount;
        case 'name_az':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchQuery, statusFilter, dateFrom, dateTo, sortBy]);

  // Count orders by status for filter chips
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      ready_to_pickup: orders.filter(o => o.status === 'ready_to_pickup').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      picked_up: orders.filter(o => o.status === 'picked_up').length,
      return_approved: orders.filter(o => o.status === 'return_approved').length
    };
  }, [orders]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFrom || dateTo;

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  // Quick date filters
  const applyQuickDateFilter = (filter: 'today' | 'week' | 'month') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (filter) {
      case 'today':
        setDateFrom(todayStr);
        setDateTo(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setDateFrom(weekAgo.toISOString().split('T')[0]);
        setDateTo(todayStr);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        setDateFrom(monthAgo.toISOString().split('T')[0]);
        setDateTo(todayStr);
        break;
    }
  };

  return (
    <div className="orders-section">
      <div className="section-header">
        <h2><ShoppingBag size={20} />Customer Orders</h2>
      </div>

      {/* Search Bar */}
      <div className="order-search-container">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="order-search-input"
            placeholder="Search by order ID, customer name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="order-filters-row">
        {/* Status Filter Chips */}
        <div className="status-filter-chips">
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Orders
            <span className="chip-badge">{statusCounts.all}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
            <span className="chip-badge">{statusCounts.pending}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === 'in_progress' ? 'active' : ''}`}
            onClick={() => setStatusFilter('in_progress')}
          >
            In Progress
            <span className="chip-badge">{statusCounts.in_progress}</span>
          </button>
          {statusCounts.shipped > 0 && (
            <button
              className={`filter-chip ${statusFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => setStatusFilter('shipped')}
            >
              Shipped
              <span className="chip-badge">{statusCounts.shipped}</span>
            </button>
          )}
          <button
            className={`filter-chip ${statusFilter === 'ready_to_pickup' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ready_to_pickup')}
          >
            Ready to Pickup
            <span className="chip-badge">{statusCounts.ready_to_pickup}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => setStatusFilter('delivered')}
          >
            Delivered
            <span className="chip-badge">{statusCounts.delivered}</span>
          </button>
          {statusCounts.picked_up > 0 && (
            <button
              className={`filter-chip ${statusFilter === 'picked_up' ? 'active' : ''}`}
              onClick={() => setStatusFilter('picked_up')}
            >
              Picked Up
              <span className="chip-badge">{statusCounts.picked_up}</span>
            </button>
          )}
          {statusCounts.return_approved > 0 && (
            <button
              className={`filter-chip ${statusFilter === 'return_approved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('return_approved')}
            >
              Return Approved
              <span className="chip-badge">{statusCounts.return_approved}</span>
            </button>
          )}
        </div>

        {/* Date and Sort Filters */}
        <div className="date-sort-filters">
          {/* Quick Date Filters */}
          <div className="quick-date-filters">
            <button
              className="quick-filter-btn"
              onClick={() => applyQuickDateFilter('today')}
              title="Show today's orders"
            >
              Today
            </button>
            <button
              className="quick-filter-btn"
              onClick={() => applyQuickDateFilter('week')}
              title="Show last 7 days"
            >
              Last 7 Days
            </button>
            <button
              className="quick-filter-btn"
              onClick={() => applyQuickDateFilter('month')}
              title="Show last 30 days"
            >
              Last 30 Days
            </button>
          </div>

          {/* Custom Date Range */}
          <div className="date-range-filter">
            <input
              type="date"
              className="date-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From Date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              className="date-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To Date"
            />
            {(dateFrom || dateTo) && (
              <button
                className="clear-dates-btn"
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}
                title="Clear dates"
              >
                Clear Dates
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sort-filter">
            <label htmlFor="order-sort">Sort by:</label>
            <select
              id="order-sort"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
              <option value="name_az">Customer Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters-summary">
          <div className="active-filters-tags">
            {statusFilter !== 'all' && (
              <span className="filter-tag">
                Status: {statusFilter.replace('_', ' ')}
                <button onClick={() => setStatusFilter('all')}>✕</button>
              </span>
            )}
            {searchQuery && (
              <span className="filter-tag">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>✕</button>
              </span>
            )}
            {(dateFrom || dateTo) && (
              <span className="filter-tag">
                Date: {dateFrom || '...'} to {dateTo || '...'}
                <button onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                }}>✕</button>
              </span>
            )}
          </div>
          <button className="clear-all-filters-btn" onClick={clearAllFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="results-count">
        {isFiltering ? (
          <span className="filtering-indicator"><RefreshCw size={14} className="spin" /> Filtering...</span>
        ) : (
          <span>
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><RefreshCw size={48} className="spin" /></div>
          <h3>Loading orders...</h3>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon"><AlertTriangle size={48} /></div>
          <h3>Error loading orders</h3>
          <p>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Inbox size={48} /></div>
          <h3>No orders found matching your filters</h3>
          <p>Try adjusting your search criteria or filters</p>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order.id} id={`mgr-order-${order.id}`} className={`order-card ${order.salesChannel === 'offline' ? 'offline-order' : ''} ${order.status}-status`}>
              <div className="order-header">
                <div className="order-info">
                  <div className="order-id-row">
                    <h3 className="order-id">Order #{order.id.slice(0, 8)}</h3>
                    {order.salesChannel === 'offline' && (
                      <span className="offline-badge">
                        <Store size={12} />
                        Offline Sale
                      </span>
                    )}
                  </div>
                  <p className="customer-name">{order.customerName}</p>
                  <p className="order-date">{formatDateTime(order.orderDate)}</p>
                </div>
                <div className="order-status">
                  {order.status === 'return_approved' || order.salesChannel === 'offline' ? (
                    <span className={`status-dropdown ${order.status}`} style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                      {getStatusDisplayName(order.status)}
                    </span>
                  ) : (
                    <select
                      value={order.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as CustomerOrder['status'];
                        if (newStatus !== order.status) {
                          handleStatusClick(order.id, newStatus);
                          // Reset dropdown to current status (will update after confirmation)
                          e.target.value = order.status;
                        }
                      }}
                      className={`status-dropdown ${order.status}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      {order.deliveryMethod === 'shipping' && (
                        <option value="shipped">Shipped (On the Road)</option>
                      )}
                      {order.deliveryMethod !== 'shipping' && (
                        <option value="ready_to_pickup">Ready to Pickup</option>
                      )}
                      {order.deliveryMethod === 'shipping' ? (
                        <option value="delivered">Delivered (Received &amp; Paid)</option>
                      ) : (
                        <option value="picked_up">Picked Up</option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                <ul className="items-list">
                  {order.items.map((item, index) => (
                    <li key={index} className="item-row">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                      <span className="item-price">Rs. {item.price.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value total-amount">Rs. {order.totalAmount.toLocaleString()}</span>
                </div>
                {order.salesChannel === 'offline' ? (
                  <>
                    {order.offlineCustomerName && (
                      <div className="detail-row">
                        <span className="detail-label">Customer:</span>
                        <span className="detail-value">{order.offlineCustomerName}</span>
                      </div>
                    )}
                    {order.offlineCustomerPhone && (
                      <div className="detail-row">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{order.offlineCustomerPhone}</span>
                      </div>
                    )}
                    <div className="detail-row">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">Walk-in / Phone Order</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Contact:</span>
                      <span className="detail-value">{order.contactNumber || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{order.customerEmail || 'N/A'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Delivery:</span>
                      <span className="detail-value">{order.deliveryAddress || 'N/A'}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment status row */}
              {(() => {
                const isFullySettled = order.status === 'delivered' || order.status === 'picked_up';
                const isCashOnly = order.salesChannel === 'offline';
                if (isCashOnly || isFullySettled || order.paymentStatus === 'paid') {
                  return (
                    <div className="mgr-payment-row mgr-payment-paid">
                      ✓ Fully Paid
                    </div>
                  );
                }
                if (order.paymentStatus === 'partially_paid') {
                  const remaining = order.remainingAmount ?? (order.totalAmount - (order.paidAmount ?? 0));
                  const deliveryLabel = order.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';
                  return (
                    <div className="mgr-payment-row mgr-payment-partial">
                      <span>Paid: Rs. {(order.paidAmount ?? 0).toLocaleString()}</span>
                      <span>Balance due at {deliveryLabel}: Rs. {remaining.toLocaleString()}</span>
                    </div>
                  );
                }
                return (
                  <div className="mgr-payment-row mgr-payment-pending">
                    Payment: Cash on Delivery
                  </div>
                );
              })()}

              <div className="order-actions">
                {order.isBillable && (
                  <button
                    className="download-bill-btn"
                    onClick={() => handleDownloadBill(order.id)}
                    disabled={downloadingBillId === order.id}
                  >
                    {downloadingBillId === order.id ? (
                      <>
                        <Loader2 size={14} className="spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText size={14} />
                        Download Bill
                      </>
                    )}
                  </button>
                )}

                {/* Process Return button — only for offline orders that are delivered or picked_up */}
                {order.salesChannel === 'offline' &&
                  (order.status === 'delivered' || order.status === 'picked_up') &&
                  (order.itemDetails && order.itemDetails.length > 0) && (
                  processedOfflineReturnIds.has(order.id) ? (
                    <span className="return-approved-badge">
                      <CheckCircle size={14} />
                      Return Approved
                    </span>
                  ) : (
                    <button
                      className="process-return-btn"
                      onClick={() => handleProcessReturnClick(order)}
                    >
                      <RotateCcw size={14} />
                      Process Return
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status Change Confirmation Modal */}
      <ConfirmModal
        isOpen={pendingStatusChange !== null}
        title="Confirm Status Update"
        message={`Are you sure you want to change the order status to "${pendingStatusChange ? getStatusDisplayName(pendingStatusChange.newStatus) : ''}"?`}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        confirmVariant="primary"
        onConfirm={confirmStatusChange}
        onCancel={cancelStatusChange}
      />

      {/* Offline Return Modal */}
      {offlineReturnOrder && (
        <div className="offline-return-overlay" onClick={handleCloseReturnModal}>
          <div className="offline-return-modal" onClick={(e) => e.stopPropagation()}>
            <div className="offline-return-modal-header">
              <h2>Process Return</h2>
              <p className="offline-return-order-ref">
                Order #{offlineReturnOrder.id.slice(0, 8).toUpperCase()}
                {offlineReturnOrder.offlineCustomerName && (
                  <> — {offlineReturnOrder.offlineCustomerName}</>
                )}
              </p>
            </div>

            <div className="offline-return-modal-body">
              <h3>Select Items to Return</h3>
              <div className="return-items-list">
                {(offlineReturnOrder.itemDetails ?? []).map((item, index) => (
                  <div key={item.id} className="return-item-row">
                    <span className="return-item-name">{item.name}</span>
                    <span className="return-item-original">Ordered: {item.quantity}</span>
                    <div className="return-qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => setOfflineReturnItems(prev => ({
                          ...prev,
                          [index]: Math.max(0, (prev[index] ?? 0) - 1),
                        }))}
                        disabled={(offlineReturnItems[index] ?? 0) === 0}
                      >
                        −
                      </button>
                      <span className="qty-display">{offlineReturnItems[index] ?? 0}</span>
                      <button
                        className="qty-btn"
                        onClick={() => setOfflineReturnItems(prev => ({
                          ...prev,
                          [index]: Math.min(item.quantity, (prev[index] ?? 0) + 1),
                        }))}
                        disabled={(offlineReturnItems[index] ?? 0) >= item.quantity}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="return-reason-section">
                <label htmlFor="return-reason">Return Reason *</label>
                <select
                  id="return-reason"
                  value={offlineReturnReason}
                  onChange={(e) => setOfflineReturnReason(e.target.value)}
                  className="return-reason-select"
                >
                  <option value="">-- Select a reason --</option>
                  {RETURN_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="return-description-section">
                <label htmlFor="return-description">Additional Notes (optional)</label>
                <textarea
                  id="return-description"
                  value={offlineReturnDescription}
                  onChange={(e) => setOfflineReturnDescription(e.target.value)}
                  placeholder="Describe the condition of the returned items..."
                  rows={3}
                  maxLength={1000}
                  className="return-description-textarea"
                />
              </div>

              {returnModalError && (
                <div className="return-modal-error">
                  <AlertTriangle size={14} />
                  {returnModalError}
                </div>
              )}
            </div>

            <div className="offline-return-modal-footer">
              <button
                className="return-cancel-btn"
                onClick={handleCloseReturnModal}
                disabled={isSubmittingReturn}
              >
                Cancel
              </button>
              <button
                className="return-submit-btn"
                onClick={handleSubmitOfflineReturn}
                disabled={isSubmittingReturn}
              >
                {isSubmittingReturn ? (
                  <><Loader2 size={14} className="spin" /> Processing...</>
                ) : (
                  <><RotateCcw size={14} /> Confirm Return &amp; Restock</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
