import React, { useMemo, useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, Inbox, Package, CheckCircle, XCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

interface ReturnRequestUI {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  order_total?: number;
  order_status?: string;
  order_date?: string;
  items: {
    id: string;
    order_item_id: string;
    quantity: number;
    created_at: string;
    product_id?: string;
    product_name?: string;
    product_image?: string;
    unit_price?: number;
    original_quantity?: number;
  }[];
}

interface DashboardReturnsProps {
  returnRequests: ReturnRequestUI[];
  isLoading: boolean;
  error: string | null;
  onViewReturn: (returnRequest: ReturnRequestUI) => void;
  onAcceptReturn?: (returnId: string) => void;
  onRejectReturn?: (returnId: string) => void;
  highlightReturnId?: string;
}

export const DashboardReturns: React.FC<DashboardReturnsProps> = ({
  returnRequests,
  isLoading,
  error,
  onViewReturn,
  onAcceptReturn,
  onRejectReturn,
  highlightReturnId
}) => {
  // Return filtering state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Filtered return requests
  const filteredReturnRequests = useMemo(() => {
    if (statusFilter === 'all') {
      return returnRequests;
    }
    return returnRequests.filter(r => r.status === statusFilter);
  }, [returnRequests, statusFilter]);

  // Scroll to and highlight return when navigated from notification
  useEffect(() => {
    if (!highlightReturnId || isLoading) return;
    setTimeout(() => {
      const el = document.getElementById(`mgr-return-${highlightReturnId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('mgr-return-highlighted');
        setTimeout(() => el.classList.remove('mgr-return-highlighted'), 3000);
      }
    }, 100);
  }, [highlightReturnId, isLoading]);

  // Count returns by status for filter chips
  const statusCounts = useMemo(() => {
    return {
      all: returnRequests.length,
      pending: returnRequests.filter(r => r.status === 'pending').length,
      approved: returnRequests.filter(r => r.status === 'approved').length,
      rejected: returnRequests.filter(r => r.status === 'rejected').length
    };
  }, [returnRequests]);

  return (
    <div className="returns-section">
      <div className="section-header">
        <h2>Return Requests</h2>
      </div>

      {/* Status Filter Chips */}
      <div className="return-filters-row">
        <div className="status-filter-chips">
          <button
            className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Returns
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
            className={`filter-chip ${statusFilter === 'approved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('approved')}
          >
            Approved
            <span className="chip-badge">{statusCounts.approved}</span>
          </button>
          <button
            className={`filter-chip ${statusFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => setStatusFilter('rejected')}
          >
            Rejected
            <span className="chip-badge">{statusCounts.rejected}</span>
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        <span>
          Showing <strong>{filteredReturnRequests.length}</strong> of <strong>{returnRequests.length}</strong> return requests
        </span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><RefreshCw size={48} className="spin" /></div>
          <h3>Loading return requests...</h3>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon"><AlertTriangle size={48} /></div>
          <h3>Error loading return requests</h3>
          <p>{error}</p>
        </div>
      ) : filteredReturnRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Inbox size={48} /></div>
          <h3>No return requests found</h3>
          <p>{statusFilter === 'all' ? 'There are no return requests yet.' : `No ${statusFilter} return requests.`}</p>
        </div>
      ) : (
        <div className="returns-grid">
          {filteredReturnRequests.map(request => (
            <div key={request.id} id={`mgr-return-${request.id}`} className="return-item">
              <div className="return-header">
                <div className="return-id">Return #{request.id.slice(-8).toUpperCase()}</div>
                <span className={`status-badge ${request.status}`}>
                  {request.status.toUpperCase()}
                </span>
              </div>

              {/* Product Images Section */}
              {request.items && request.items.length > 0 && (
                <div className="return-products-preview">
                  {request.items.slice(0, 3).map((item, idx) => (
                    <div key={item.id || idx} className="return-product-thumb">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name || 'Product'}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const placeholder = target.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`product-thumb-placeholder ${item.product_image ? 'hidden' : ''}`}>
                        <Package size={24} color="#ccc" />
                      </div>
                    </div>
                  ))}
                  {request.items.length > 3 && (
                    <div className="return-product-more">+{request.items.length - 3}</div>
                  )}
                </div>
              )}

              <div className="return-details">
                <p><strong>Order ID:</strong> #{request.order_id.slice(-8).toUpperCase()}</p>
                <p><strong>Reason:</strong> {request.reason}</p>
                {request.description && (
                  <div className="return-customer-message">
                    <strong>Customer Message:</strong>
                    <p className="return-message-text">{request.description}</p>
                  </div>
                )}
                <p><strong>Date:</strong> {formatDateTime(request.created_at)}</p>
                {request.items && request.items.length > 0 && (
                  <div className="return-items-list">
                    <strong>Items ({request.items.length}):</strong>
                    <ul>
                      {request.items.map((item, idx) => (
                        <li key={item.id || idx}>
                          {item.product_name || `Product ${item.product_id?.slice(-8)}`} - Qty: {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {request.admin_notes && (
                  <p className="admin-notes-preview"><strong>Manager Note:</strong> {request.admin_notes}</p>
                )}
              </div>

              <div className="return-actions">
                {request.status === 'pending' ? (
                  <>
                    <button
                      className="accept-btn"
                      onClick={() => onAcceptReturn?.(request.id)}
                    >
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => onRejectReturn?.(request.id)}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                ) : (
                  <button
                    className="view-details-btn"
                    onClick={() => onViewReturn(request)}
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
