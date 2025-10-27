import React, { useEffect, useMemo, useState } from 'react';
import Toast from './Toast';
import './ActivityLogs.css';

type Severity = 'Normal' | 'Warning' | 'Critical';
type Category = 'Authentication' | 'Order Management' | 'Inventory Changes' | 'User Management' | 'Security Events' | 'Other';

interface ActivityItem {
  id: number;
  type: 'success' | 'info' | 'warning' | 'error';
  activity: string;
  category: Category;
  userEmail: string;
  userRole: 'Manager' | 'Customer' | 'Admin' | 'System';
  timestamp: string; // ISO or readable
  details: string;
  severity: Severity;
  // extra related info
  orderId?: string;
  product?: string;
  ip?: string;
  device?: string;
  sessionId?: string;
}

const ICON_BG: Record<ActivityItem['type'], string> = {
  success: '#10B981',
  info: '#3B82F6',
  warning: '#F59E0B',
  error: '#EF4444',
};

const ACTIVITY_BADGE: Record<Category, { label: string; color: string; icon: string } > = {
  'Authentication': { label: 'Login', color: '#10B981', icon: '🔐' },
  'Order Management': { label: 'Order Update', color: '#3B82F6', icon: '📝' },
  'Inventory Changes': { label: 'Inventory Change', color: '#EF4444', icon: '🗑️' },
  'User Management': { label: 'User Action', color: '#14B8A6', icon: '👤' },
  'Security Events': { label: 'Security Alert', color: '#EF4444', icon: '🔒' },
  'Other': { label: 'Activity', color: '#6B7280', icon: '📄' },
};

const PAGE_SIZE = 20;

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
}

function relativeTime(ts: string) {
  const diffMs = Date.now() - new Date(ts).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
}

function roleBadgeColor(role: ActivityItem['userRole']) {
  switch (role) {
    case 'Manager': return '#3B82F6';
    case 'Admin': return '#EF4444';
    case 'Customer': return '#6B7280';
    case 'System': return '#14B8A6';
  }
}

function groupLabel(ts: string) {
  const date = new Date(ts);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000*60*60*24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const dayOfWeek = today.getDay(); // 0..6
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  if (date >= startOfWeek) return 'This Week';
  return 'Earlier';
}

// Quick mock data generator
function generateMockActivities(): ActivityItem[] {
  const users = [
    { email: 'manager1@japanlanka.com', role: 'Manager' as const },
    { email: 'manager2@japanlanka.com', role: 'Manager' as const },
    { email: 'admin@japanlanka.com', role: 'Admin' as const },
    { email: 'customer1@gmail.com', role: 'Customer' as const },
    { email: 'customer2@gmail.com', role: 'Customer' as const },
    { email: 'system@japanlanka.com', role: 'System' as const },
  ];

  const activitiesSeed: Array<Partial<ActivityItem> & { activity: string; category: Category; type: ActivityItem['type']; severity: Severity; }> = [
    { activity: 'User Login', category: 'Authentication', type: 'success', severity: 'Normal' },
    { activity: 'Failed Login Attempt', category: 'Security Events', type: 'error', severity: 'Warning' },
    { activity: 'Order Status Updated', category: 'Order Management', type: 'info', severity: 'Normal' },
    { activity: 'Product Deleted', category: 'Inventory Changes', type: 'warning', severity: 'Warning' },
    { activity: 'Customer Registration', category: 'User Management', type: 'success', severity: 'Normal' },
    { activity: 'Password Changed', category: 'User Management', type: 'info', severity: 'Normal' },
  ];

  const products = ['Brake Pads', 'Oil Filter', 'LED Bulbs', 'Air Filter', 'Spark Plugs', 'Battery 12V 60Ah'];
  const orders = ['ORD-1001', 'ORD-1002', 'ORD-1023', 'ORD-1045', 'ORD-1100'];
  const devices = ['Windows 11 • Chrome', 'macOS • Safari', 'Android • Chrome', 'iOS • Safari', 'Ubuntu • Firefox'];
  const ips = ['103.1.45.23', '175.157.11.90', '192.168.1.24', '203.81.45.6', '123.231.44.10'];

  const now = new Date();
  const items: ActivityItem[] = [];
  let id = 1;
  for (let i = 0; i < 48; i++) {
    const seed = activitiesSeed[Math.floor(Math.random() * activitiesSeed.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const ts = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 3600 * 1000));
    const orderId = Math.random() < 0.5 ? orders[Math.floor(Math.random() * orders.length)] : undefined;
    const product = Math.random() < 0.5 ? products[Math.floor(Math.random() * products.length)] : undefined;
    const device = devices[Math.floor(Math.random() * devices.length)];
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const sessionId = `SESS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    let details = '';
    if (seed.activity === 'User Login') details = `Successful login from ${device} (${ip})`;
    else if (seed.activity === 'Failed Login Attempt') details = `Invalid password from ${device} (${ip})`;
    else if (seed.activity === 'Order Status Updated') details = `Order ${orderId || 'ORD-1001'} changed to In Progress`;
    else if (seed.activity === 'Product Deleted') details = `Product "${product || 'Wiper Blades'}" removed from inventory`;
    else if (seed.activity === 'Customer Registration') details = `New customer account created: ${user.email}`;
    else if (seed.activity === 'Password Changed') details = `Password updated successfully by ${user.email}`;

    items.push({
      id: id++,
      activity: seed.activity,
      category: seed.category,
      type: seed.type,
      userEmail: user.email,
      userRole: user.role,
      timestamp: ts.toISOString(),
      details,
      severity: seed.severity,
      orderId,
      product,
      ip,
      device,
      sessionId,
    });
  }
  return items.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const ActivityLogs: React.FC = () => {
  const [data] = useState<ActivityItem[]>(() => generateMockActivities());
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState<'All Activities' | Category>('All Activities');
  const [roleFilter, setRoleFilter] = useState<{ Manager: boolean; Customer: boolean; Admin: boolean; System: boolean; All: boolean }>({ Manager: false, Customer: false, Admin: false, System: false, All: true });
  const [dateRange, setDateRange] = useState<'All' | 'Today' | '7' | '30' | 'ThisMonth'>('All');
  const [severity, setSeverity] = useState<'All' | Severity>('All');
  const [sortField, setSortField] = useState<'timestamp' | 'activity' | 'userEmail'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [groupsCollapsed, setGroupsCollapsed] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'info'|'success'|'error' } | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(a => { map[a.category] = (map[a.category] || 0) + 1; });
    return map;
  }, [data]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const now = new Date();

    return data.filter(a => {
      if (q) {
        const text = `${a.activity} ${a.userEmail} ${a.details}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      if (category !== 'All Activities' && a.category !== category) return false;

      if (!roleFilter.All) {
        const allowed: string[] = [];
        if (roleFilter.Manager) allowed.push('Manager');
        if (roleFilter.Customer) allowed.push('Customer');
        if (roleFilter.Admin) allowed.push('Admin');
        if (roleFilter.System) allowed.push('System');
        if (!allowed.includes(a.userRole)) return false;
      }

      if (severity !== 'All') {
        if (a.severity !== severity) return false;
      }

      if (dateRange !== 'All') {
        const d = new Date(a.timestamp);
        const diffDays = Math.floor((now.getTime() - d.getTime())/(1000*60*60*24));
        if (dateRange === 'Today' && diffDays !== 0) return false;
        if (dateRange === '7' && diffDays > 6) return false;
        if (dateRange === '30' && diffDays > 29) return false;
        if (dateRange === 'ThisMonth') {
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [data, debouncedQuery, category, roleFilter, dateRange, severity]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a,b) => {
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
  const pageItems = useMemo(() => sorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE), [sorted, page]);

  useEffect(() => { setPage(1); }, [debouncedQuery, category, roleFilter, dateRange, severity]);

  const grouped = useMemo(() => {
    const map: Record<string, ActivityItem[]> = {};
    pageItems.forEach(a => {
      const g = groupLabel(a.timestamp);
      if (!map[g]) map[g] = [];
      map[g].push(a);
    });
    return map;
  }, [pageItems]);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const copyDetails = (a: ActivityItem) => {
    const text = `Activity: ${a.activity}\nUser: ${a.userEmail} (${a.userRole})\nTime: ${new Date(a.timestamp).toLocaleString()}\nDetails: ${a.details}\nOrder: ${a.orderId || '-'}\nProduct: ${a.product || '-'}\nIP: ${a.ip || '-'}\nDevice: ${a.device || '-'}\nSession: ${a.sessionId || '-'}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => setToast({ message: 'Details copied to clipboard', type: 'success' }));
    }
  };

  const clearAllFilters = () => {
    setQuery('');
    setCategory('All Activities');
    setRoleFilter({ Manager: false, Customer: false, Admin: false, System: false, All: true });
    setDateRange('All');
    setSeverity('All');
    setPage(1);
  };

  const activeChips: Array<{ label: string; onRemove: () => void }> = [];
  if (category !== 'All Activities') activeChips.push({ label: `Type: ${category}`, onRemove: () => setCategory('All Activities') });
  if (!roleFilter.All) {
    const roles = ['Manager','Customer','Admin','System'].filter(r => (roleFilter as any)[r]);
    if (roles.length > 0) activeChips.push({ label: `Role: ${roles.join(', ')}`, onRemove: () => setRoleFilter({ Manager:false, Customer:false, Admin:false, System:false, All:true }) });
  }
  if (dateRange !== 'All') activeChips.push({ label: `Date: ${dateRange}`, onRemove: () => setDateRange('All') });
  if (severity !== 'All') activeChips.push({ label: `Severity: ${severity}`, onRemove: () => setSeverity('All') });
  if (debouncedQuery) activeChips.push({ label: `Search: ${debouncedQuery}`, onRemove: () => setQuery('') });

  // Stats summary
  const todayCount = useMemo(() => data.filter(a => groupLabel(a.timestamp) === 'Today').length, [data]);
  const failedLogins = useMemo(() => data.filter(a => a.activity.includes('Failed Login')).length, [data]);
  const securityEvents = useMemo(() => data.filter(a => a.category === 'Security Events').length, [data]);
  const mostActiveUser = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(a => { map[a.userEmail] = (map[a.userEmail] || 0) + 1; });
    const entries = Object.entries(map).sort((a,b) => b[1]-a[1]);
    return entries.length ? { email: entries[0][0], count: entries[0][1] } : { email: '-', count: 0 };
  }, [data]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir(field === 'timestamp' ? 'desc' : 'asc'); }
  };

  const handleExport = () => {
    setToast({ message: 'Preparing export...', type: 'info' });
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="activity-logs-wrapper">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-title">Total Activities Today</div>
          <div className="stat-value">{todayCount} <span className="trend">↗</span></div>
        </div>
        <div className="stat-card warning">
          <div className="stat-title">Failed Login Attempts</div>
          <div className="stat-value">{failedLogins}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Most Active User</div>
          <div className="stat-value small">{mostActiveUser.email} <span className="muted">({mostActiveUser.count})</span></div>
        </div>
        <div className="stat-card danger">
          <div className="stat-title">Recent Security Events</div>
          <div className="stat-value">{securityEvents}</div>
        </div>
      </div>

      <div className="activity-controls">
        <div className="left">
          <div className="search-wrap">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search by activity, user, or details..."
              className="search-input"
              style={{ width: 400 }}
            />
            {query && <button className="clear-search" onClick={() => setQuery('')}>×</button>}
          </div>

          <div className="filters-row">
            <select className="filter-select" value={category} onChange={e => setCategory(e.target.value as any)}>
              <option>All Activities</option>
              <option>Authentication</option>
              <option>Order Management</option>
              <option>Inventory Changes</option>
              <option>User Management</option>
              <option>Security Events</option>
            </select>
            <div className="category-counts">
              {Object.entries(categoryCounts).map(([k,v]) => (
                <span key={k} className="count-chip">{k}: {v}</span>
              ))}
            </div>

            <div className="role-filters">
              <label><input type="checkbox" checked={roleFilter.All} onChange={(e)=> setRoleFilter({ Manager:false, Customer:false, Admin:false, System:false, All:e.target.checked })}/> All</label>
              <label><input type="checkbox" checked={roleFilter.Manager} onChange={(e)=> setRoleFilter(prev=>({ ...prev, Manager:e.target.checked, All:false }))}/> Managers</label>
              <label><input type="checkbox" checked={roleFilter.Customer} onChange={(e)=> setRoleFilter(prev=>({ ...prev, Customer:e.target.checked, All:false }))}/> Customers</label>
              <label><input type="checkbox" checked={roleFilter.Admin} onChange={(e)=> setRoleFilter(prev=>({ ...prev, Admin:e.target.checked, All:false }))}/> Admins</label>
              <label><input type="checkbox" checked={roleFilter.System} onChange={(e)=> setRoleFilter(prev=>({ ...prev, System:e.target.checked, All:false }))}/> System</label>
            </div>

            <div className="date-filters">
              <button className={`date-btn ${dateRange==='Today'?'active':''}`} onClick={()=>setDateRange('Today')}>Today</button>
              <button className={`date-btn ${dateRange==='7'?'active':''}`} onClick={()=>setDateRange('7')}>Last 7 Days</button>
              <button className={`date-btn ${dateRange==='30'?'active':''}`} onClick={()=>setDateRange('30')}>Last 30 Days</button>
              <button className={`date-btn ${dateRange==='ThisMonth'?'active':''}`} onClick={()=>setDateRange('ThisMonth')}>This Month</button>
              <button className="date-btn" onClick={()=>setDateRange('All')}>All</button>
            </div>

            <div className="severity-filters">
              <span>Severity:</span>
              {['All','Normal','Warning','Critical'].map(s => (
                <button key={s} className={`sev-btn ${severity===s?'active':''} sev-${String(s).toLowerCase()}`} onClick={()=>setSeverity(s as any)}>{s}</button>
              ))}
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="active-chips">
              {activeChips.map((c,i) => (
                <span key={i} className="chip">{c.label} <button onClick={c.onRemove}>×</button></span>
              ))}
              <button className="clear-all" onClick={clearAllFilters}>Clear All</button>
              <span className="results-count">Showing {Math.min(PAGE_SIZE, total)} of {total} activities</span>
            </div>
          )}
        </div>
        <div className="right">
          <button className="export-btn" onClick={handleExport}>📥 Export to CSV</button>
        </div>
      </div>

      <div className="table-scroll">
        {total === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No activities found</h3>
            <p>Try adjusting your filters or date range</p>
            <button className="clear-filters-cta" onClick={clearAllFilters}>Clear Filters</button>
          </div>
        ) : (
          <table className="activity-table">
            <thead>
              <tr>
                <th>Type</th>
                <th onClick={()=>handleSort('activity')} className={sortField==='activity'?'sorted':''}>Activity <span className="sort-ind">{sortField==='activity'?(sortDir==='asc'?'↑':'↓'):'↕'}</span></th>
                <th onClick={()=>handleSort('userEmail')} className={sortField==='userEmail'?'sorted':''}>User <span className="sort-ind">{sortField==='userEmail'?(sortDir==='asc'?'↑':'↓'):'↕'}</span></th>
                <th onClick={()=>handleSort('timestamp')} className={sortField==='timestamp'?'sorted':''}>Timestamp <span className="sort-ind">{sortField==='timestamp'?(sortDir==='asc'?'↑':'↓'):'↕'}</span></th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([group, items]) => (
                <React.Fragment key={group}>
                  <tr className="group-row" onClick={()=> setGroupsCollapsed(prev=>({ ...prev, [group]: !prev[group] }))}>
                    <td colSpan={5}>
                      <span className="group-toggle">{groupsCollapsed[group] ? '▶' : '▼'}</span> <strong>{group}</strong> <span className="muted">({items.length})</span>
                    </td>
                  </tr>
                  {!groupsCollapsed[group] && items.map((a) => (
                    <React.Fragment key={a.id}>
                      <tr className="row" onClick={()=>toggleExpand(a.id)}>
                        <td className="type-cell">
                          <span className="type-icon" style={{ backgroundColor: ICON_BG[a.type] }}>
                            {a.type === 'success' ? '✅' : a.type === 'info' ? 'ℹ️' : a.type === 'warning' ? '⚠️' : '❌'}
                          </span>
                        </td>
                        <td>
                          <span className="activity-badge" style={{ backgroundColor: ACTIVITY_BADGE[a.category].color }}>
                            <span className="badge-icon">{ACTIVITY_BADGE[a.category].icon}</span>
                            {ACTIVITY_BADGE[a.category].label}
                          </span>
                          <div className="activity-subtext">{a.activity}</div>
                        </td>
                        <td className="user-cell">
                          <div className="user-line">
                            <span className="avatar-circle">{a.userEmail.charAt(0).toUpperCase()}</span>
                            <span className="email">{a.userEmail}</span>
                          </div>
                          <span className="role-badge" style={{ backgroundColor: roleBadgeColor(a.userRole), color:'#fff' }}>{a.userRole}</span>
                        </td>
                        <td className="time-cell">
                          <div>{formatTimestamp(a.timestamp)}</div>
                          <div className="muted small">{relativeTime(a.timestamp)}</div>
                        </td>
                        <td className="details-cell" title={a.details}><em>{a.details}</em></td>
                      </tr>
                      {expanded.has(a.id) && (
                        <tr className="expand-row">
                          <td colSpan={5}>
                            <div className="expand-content">
                              <div className="expand-grid">
                                <div><strong>Timestamp:</strong> {new Date(a.timestamp).toLocaleString()}</div>
                                <div><strong>User:</strong> {a.userEmail} ({a.userRole})</div>
                                <div><strong>Session ID:</strong> {a.sessionId || '-'}</div>
                                <div><strong>IP:</strong> {a.ip || '-'}</div>
                                <div><strong>Device:</strong> {a.device || '-'}</div>
                                {a.orderId && <div><strong>Order ID:</strong> {a.orderId}</div>}
                                {a.product && <div><strong>Part:</strong> {a.product}</div>}
                              </div>
                              <div className="expand-details"><strong>Details:</strong> {a.details}</div>
                              <button className="copy-btn" onClick={()=>copyDetails(a)}>Copy Details</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div className="pagination-row">
          <div className="pager">
            <button onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page===1} className="pager-btn">◀</button>
            {Array.from({ length: Math.min(15, totalPages) }, (_,i)=> i+1).map(p => (
              <button key={p} onClick={()=> setPage(p)} className={`page-num ${p===page?'active':''}`}>{p}</button>
            ))}
            <button onClick={()=> setPage(p=> Math.min(totalPages, p+1))} disabled={page===totalPages} className="pager-btn">▶</button>
          </div>
          <div className="page-info">Showing {(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE, total)} of {total} activities</div>
        </div>
      )}

      {/* Responsive card list */}
      <div className="card-list">
        {pageItems.map(a => (
          <div key={a.id} className="activity-card" onClick={()=>toggleExpand(a.id)}>
            <div className="card-header">
              <span className="type-icon" style={{ backgroundColor: ICON_BG[a.type] }}>
                {a.type === 'success' ? '✅' : a.type === 'info' ? 'ℹ️' : a.type === 'warning' ? '⚠️' : '❌'}
              </span>
              <span className="activity-badge" style={{ backgroundColor: ACTIVITY_BADGE[a.category].color }}>
                <span className="badge-icon">{ACTIVITY_BADGE[a.category].icon}</span>
                {ACTIVITY_BADGE[a.category].label}
              </span>
            </div>
            <div className="card-body">
              <div className="user-line">
                <span className="avatar-circle">{a.userEmail.charAt(0).toUpperCase()}</span>
                <span className="email">{a.userEmail}</span>
                <span className="role-badge" style={{ backgroundColor: roleBadgeColor(a.userRole), color:'#fff' }}>{a.userRole}</span>
              </div>
              <div className="time-line">
                <span>{formatTimestamp(a.timestamp)}</span>
                <span className="muted small">{relativeTime(a.timestamp)}</span>
              </div>
              <div className="details-line" title={a.details}><em>{a.details}</em></div>
            </div>
            {expanded.has(a.id) && (
              <div className="card-expand">
                <div className="expand-details"><strong>Details:</strong> {a.details}</div>
                <button className="copy-btn" onClick={(e)=> { e.stopPropagation(); copyDetails(a); }}>Copy Details</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLogs;
