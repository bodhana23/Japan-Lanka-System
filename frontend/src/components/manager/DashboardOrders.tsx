import React, { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw, Inbox, AlertTriangle, Store, FileText, Loader2 } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';
import { ordersApi } from '../../services/api';

interface CustomerOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'in_progress' | 'ready_to_pickup' | 'delivered';
  orderDate: string;
  deliveryAddress?: string;
  contactNumber: string;
  // Offline sales fields
  salesChannel?: 'online' | 'offline';
  offlineCustomerName?: string;
  offlineCustomerPhone?: string;
  // Bill generation
  isBillable?: boolean;
}

interface DashboardOrdersProps {
  orders: CustomerOrder[];
  isLoading: boolean;
  error: string | null;
  onStatusUpdate: (orderId: string, newStatus: CustomerOrder['status']) => void;
}

export const DashboardOrders: React.FC<DashboardOrdersProps> = ({
  orders,
  isLoading,
  error,
  onStatusUpdate
}) => {
  // Order filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'ready_to_pickup' | 'delivered'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'name_az'>('newest');
  const [isFiltering, setIsFiltering] = useState(false);
  const [downloadingBillId, setDownloadingBillId] = useState<string | null>(null);

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
      ready_to_pickup: orders.filter(o => o.status === 'ready_to_pickup').length,
      delivered: orders.filter(o => o.status === 'delivered').length
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
        <h2>Customer Orders</h2>
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
            <div key={order.id} className={`order-card ${order.salesChannel === 'offline' ? 'offline-order' : ''}`}>
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
                  <select
                    value={order.status}
                    onChange={(e) => onStatusUpdate(order.id, e.target.value as CustomerOrder['status'])}
                    className={`status-dropdown ${order.status}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="ready_to_pickup">Ready to Pickup</option>
                    <option value="delivered">Delivered</option>
                  </select>
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

              {order.isBillable && (
                <div className="order-actions">
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
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
