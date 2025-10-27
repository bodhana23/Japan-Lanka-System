import React, { useMemo, useState } from 'react';
import Toast from './Toast';
import './InventoryLogs.css';

export interface InventoryLog {
  id: number;
  productName: string;
  action: string;
  user: string;
  timestamp: string; // ISO-like or readable
  previousQuantity?: number;
  newQuantity?: number;
  details: string;
}

interface Props {
  initialLogs: InventoryLog[];
}

const ACTION_ICONS: Record<string, string> = {
  'Stock Added': '➕',
  'Stock Updated': '✏️',
  'Product Added': '🆕',
  'Price Updated': '💰'
};

const PAGE_SIZE = 5;

const InventoryLogs: React.FC<Props> = ({ initialLogs }) => {
  const [query, setQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [userFilter, setUserFilter] = useState('All Users');
  const [dateRange, setDateRange] = useState<'All' | 'Today' | '7' | '30'>('All');
  const [sortField, setSortField] = useState<'timestamp' | 'productName' | 'user' | 'action'>('timestamp');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const users = useMemo(() => {
    const setUsers = new Set(initialLogs.map(l => l.user));
    return ['All Users', ...Array.from(setUsers)];
  }, [initialLogs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = new Date();

    return initialLogs.filter((log) => {
      // Search
      if (q) {
        const text = `${log.productName} ${log.details}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      // Action filter
      if (actionFilter !== 'All Actions') {
        if (actionFilter === 'Stock Changes') {
          if (!/^Stock/.test(log.action)) return false;
        } else if (actionFilter === 'Product Changes') {
          if (!/Product|Added/.test(log.action)) return false;
        } else if (actionFilter === 'Price Changes') {
          if (!/Price/.test(log.action)) return false;
        }
      }

      // User filter
      if (userFilter !== 'All Users' && log.user !== userFilter) return false;

      // Date range
      if (dateRange !== 'All') {
        const ts = new Date(log.timestamp);
        const diffDays = Math.floor((now.getTime() - ts.getTime()) / (1000 * 60 * 60 * 24));
        if (dateRange === 'Today' && diffDays !== 0) return false;
        if (dateRange === '7' && diffDays > 6) return false;
        if (dateRange === '30' && diffDays > 29) return false;
      }

      return true;
    });
  }, [initialLogs, query, actionFilter, userFilter, dateRange]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av: any = a[sortField];
      let bv: any = b[sortField];
      if (sortField === 'timestamp') {
        av = new Date(a.timestamp).getTime();
        bv = new Date(b.timestamp).getTime();
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }

      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'timestamp' ? 'desc' : 'asc');
    }
  };

  const handleExport = () => {
    setToast({ message: 'Preparing export...', type: 'info' });
    setTimeout(() => setToast(null), 2200);
  };

  const resetFilters = () => {
    setQuery('');
    setActionFilter('All Actions');
    setUserFilter('All Users');
    setDateRange('All');
    setPage(1);
  };

  return (
    <div className="inventory-logs-wrapper">
      {toast && <Toast message={toast.message} type={toast.type === 'info' ? 'info' : toast.type} onClose={() => setToast(null)} />}

      <div className="logs-controls">
        <div className="left-controls">
          <div className="search-wrap">
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder={'🔍 Search by product name or model...'}
              className="search-input"
              style={{ width: 350 }}
            />
            {query && <button className="clear-search" onClick={() => setQuery('')}>×</button>}
          </div>

          <div className="filters-row">
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} className="filter-select">
              <option>All Actions</option>
              <option>Stock Changes</option>
              <option>Product Changes</option>
              <option>Price Changes</option>
            </select>

            <div className="date-filters">
              <button className={`date-btn ${dateRange === 'Today' ? 'active' : ''}`} onClick={() => { setDateRange('Today'); setPage(1); }}>Today</button>
              <button className={`date-btn ${dateRange === '7' ? 'active' : ''}`} onClick={() => { setDateRange('7'); setPage(1); }}>Last 7 Days</button>
              <button className={`date-btn ${dateRange === '30' ? 'active' : ''}`} onClick={() => { setDateRange('30'); setPage(1); }}>Last 30 Days</button>
            </div>

            <select value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(1); }} className="filter-select">
              {users.map(u => <option key={u}>{u}</option>)}
            </select>

            <button className="clear-filters-link" onClick={resetFilters}>Clear Filters</button>
          </div>
        </div>

        <div className="right-controls">
          <button className="export-btn" onClick={handleExport}>📥 Export to CSV</button>
        </div>
      </div>

      <div className="results-count">Showing {pageItems.length} of {total} changes</div>

      <div className="table-scroll">
        {total === 0 ? (
          <div className="empty-state-logs">
            <div className="empty-icon">📦</div>
            <h3>No inventory changes found</h3>
            <p>Try adjusting your filters</p>
            <button className="clear-filters-cta" onClick={resetFilters}>Clear Filters</button>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('productName')} className={sortField === 'productName' ? 'sorted' : ''}>
                  Product Name <span className="sort-indicator">{sortField === 'productName' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th onClick={() => handleSort('action')} className={sortField === 'action' ? 'sorted' : ''}>
                  Action <span className="sort-indicator">{sortField === 'action' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th onClick={() => handleSort('user')} className={sortField === 'user' ? 'sorted' : ''}>
                  User <span className="sort-indicator">{sortField === 'user' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th>Quantity Change</th>
                <th onClick={() => handleSort('timestamp')} className={sortField === 'timestamp' ? 'sorted' : ''}>
                  Timestamp <span className="sort-indicator">{sortField === 'timestamp' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                </th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((log, idx) => {
                const prev = typeof log.previousQuantity === 'number' ? log.previousQuantity : null;
                const next = typeof log.newQuantity === 'number' ? log.newQuantity : null;
                const diff = (prev !== null && next !== null) ? next - prev : null;

                const rowClass = idx % 2 === 0 ? 'row-even' : 'row-odd';

                return (
                  <tr key={log.id} className={`${rowClass}`}>
                    <td className="product-cell">{log.productName}</td>
                    <td>
                      <span className={`action-badge ${log.action.replace(/\s+/g, '-').toLowerCase()}`}>
                        <span className="badge-icon">{ACTION_ICONS[log.action] || '🔔'}</span>
                        <span className="badge-text">{log.action}</span>
                      </span>
                    </td>
                    <td>{log.user}</td>
                    <td className="qty-change">
                      <div className="qty-line">
                        <span className="qty-from">{prev !== null ? prev : '-'}</span>
                        <span className="qty-arrow">→</span>
                        <span className="qty-to">{next !== null ? next : '-'}</span>
                      </div>
                      {diff !== null && (
                        <div className={`qty-diff ${diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'nochange'}`}>
                          {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '0'}
                        </div>
                      )}
                    </td>
                    <td className="timestamp-cell">{log.timestamp}</td>
                    <td className="details-cell" title={log.details}>
                      <span className="details-text">
                        {log.details.includes('Sold') && <span className="detail-icon">🛒</span>}
                        {log.details.includes('Added') && <span className="detail-icon">➕</span>}
                        <em>{log.details}</em>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div className="pagination-row">
          <div className="pager">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="pager-btn">◀ Previous</button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`page-num ${p === page ? 'active' : ''}`}>{p}</button>
            ))}

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="pager-btn">Next ▶</button>
          </div>
          <div className="page-info">Page {page} of {totalPages}</div>
        </div>
      )}
    </div>
  );
};

export default InventoryLogs;
