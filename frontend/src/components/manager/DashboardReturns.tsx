import React, { useMemo, useState } from 'react';
import { RefreshCw, AlertTriangle, Inbox } from 'lucide-react';
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
    unit_price?: number;
    original_quantity?: number;
  }[];
}

interface DashboardReturnsProps {
  returnRequests: ReturnRequestUI[];
  isLoading: boolean;
  error: string | null;
  onViewReturn: (returnRequest: ReturnRequestUI) => void;
}

export const DashboardReturns: React.FC<DashboardReturnsProps> = ({
  returnRequests,
  isLoading,
  error,
  onViewReturn
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
            <div key={request.id} className="return-item">
              <div className="return-header">
                <div className="return-id">Return #{request.id.slice(-8).toUpperCase()}</div>
                <span className={`status-badge ${request.status}`}>
                  {request.status.toUpperCase()}
                </span>
              </div>
              <div className="return-details">
                <p><strong>Customer:</strong> {request.customer_name}</p>
                <p><strong>Email:</strong> {request.customer_email}</p>
                <p><strong>Order:</strong> #{request.order_id.slice(-8).toUpperCase()}</p>
                <p><strong>Reason:</strong> {request.reason}</p>
                {request.description && (
                  <p><strong>Description:</strong> {request.description.length > 100 ? `${request.description.substring(0, 100)}...` : request.description}</p>
                )}
                <p><strong>Date:</strong> {formatDateTime(request.created_at)}</p>
                {request.order_total && (
                  <p><strong>Order Total:</strong> Rs. {request.order_total.toLocaleString()}</p>
                )}
                {request.items && request.items.length > 0 && (
                  <div className="return-items-list">
                    <strong>Items to Return:</strong>
                    <ul>
                      {request.items.map((item, idx) => (
                        <li key={item.id || idx}>
                          {item.product_name || `Product ${item.product_id?.slice(-8)}`} - Qty: {item.quantity}
                          {item.unit_price && ` (Rs. ${item.unit_price.toLocaleString()} each)`}
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
                <button
                  className="view-chat-btn"
                  onClick={() => onViewReturn(request)}
                >
                  {request.status === 'pending' ? 'Review & Take Action' : 'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
