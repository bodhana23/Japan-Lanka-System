import React, { useState, useEffect, useCallback } from 'react';
import { formatDateTime } from '../../utils/dateUtils';
import {
  auditorApi,
  InventoryLog,
  InventoryLogListResponse
} from '../../services/api';
import {
  RefreshCw, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import './DashboardInventoryLogs.css';

const ACTION_TYPE_LABELS: Record<string, string> = {
  order_placed: 'Order Placed',
  order_status_changed: 'Order Status Changed',
  product_created: 'Product Created',
  product_updated: 'Product Updated',
  product_deleted: 'Product Deleted',
  stock_adjusted: 'Stock Adjusted',
  return_created: 'Return Created',
  return_approved: 'Return Approved',
  return_rejected: 'Return Rejected',
  return_completed: 'Return Completed',
};

const PAGE_SIZE = 20;

const DashboardInventoryLogs: React.FC = () => {
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>('');

  const fetchInventoryLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: page,
        page_size: PAGE_SIZE,
      };
      if (actionFilter) {
        params.action_type = actionFilter;
      }
      const response: InventoryLogListResponse = await auditorApi.getInventoryLogs(params);
      setInventoryLogs(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory logs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchInventoryLogs();
  }, [fetchInventoryLogs]);

  return (
    <div className="inventory-logs-section">
      <div className="section-header">
        <h2>Inventory Audit Logs</h2>
        <p className="section-description">
          View all inventory transactions, orders, and payment-related activities
        </p>
      </div>

      <div className="logs-controls">
        <div className="filter-group">
          <Filter size={16} />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Actions</option>
            <option value="order_placed">Order Placed</option>
            <option value="order_status_changed">Order Status Changed</option>
            <option value="product_created">Product Created</option>
            <option value="product_updated">Product Updated</option>
            <option value="product_deleted">Product Deleted</option>
            <option value="stock_adjusted">Stock Adjusted</option>
            <option value="return_created">Return Created</option>
            <option value="return_approved">Return Approved</option>
            <option value="return_rejected">Return Rejected</option>
            <option value="return_completed">Return Completed</option>
          </select>
        </div>
        <button
          className="refresh-btn"
          onClick={fetchInventoryLogs}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>User</th>
              <th>Description</th>
              <th>Related Entity</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="loading-cell">Loading...</td>
              </tr>
            ) : inventoryLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">No inventory logs found</td>
              </tr>
            ) : (
              inventoryLogs.map((log) => (
                <tr key={log.id}>
                  <td className="timestamp">{formatDateTime(log.created_at)}</td>
                  <td>
                    <span className={`action-badge action-${log.action_type}`}>
                      {ACTION_TYPE_LABELS[log.action_type] || log.action_type}
                    </span>
                  </td>
                  <td>
                    <div className="user-info">
                      <span className="user-name">{log.actor_name || 'System'}</span>
                      {log.actor_email && (
                        <span className="user-email">{log.actor_email}</span>
                      )}
                      {log.actor_type && (
                        <span className={`user-type-badge ${log.actor_type}`}>
                          {log.actor_type}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="description">{log.description}</td>
                  <td>
                    {log.related_entity_type && (
                      <div className="related-entity">
                        <span className={`entity-type-badge ${log.related_entity_type}`}>
                          {log.related_entity_type}
                        </span>
                        {log.related_entity_summary && (
                          <span className="entity-summary">{log.related_entity_summary}</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <span className="pagination-info">
            Showing {((page - 1) * PAGE_SIZE) + 1} - {Math.min(page * PAGE_SIZE, total)} of {total}
          </span>
          <div className="pagination-buttons">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <span className="page-number">Page {page} of {totalPages}</span>
            <button
              className="pagination-btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardInventoryLogs;
