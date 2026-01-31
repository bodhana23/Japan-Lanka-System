import React from 'react';
import {
  Users, DollarSign, AlertTriangle, TrendingUp,
  Package, ShoppingCart, BarChart2, ArrowRight
} from 'lucide-react';
import './DashboardOverview.css';

interface UserStats {
  total: number;
  managers: number;
  auditors: number;
  customers: number;
  admins: number;
}

interface DashboardOverviewProps {
  userStats: UserStats;
  monthlyRevenue: number;
  lowStockCount: number;
  totalOrders: number;
  totalProducts: number;
  onNavigateToUsers: () => void;
  onNavigateToLowStock: () => void;
  onNavigateToAnalytics: () => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  userStats,
  monthlyRevenue,
  lowStockCount,
  totalOrders,
  totalProducts,
  onNavigateToUsers,
  onNavigateToLowStock,
  onNavigateToAnalytics,
}) => {
  return (
    <div className="admin-overview-container">
      <div className="admin-overview-header">
        <h2 className="admin-overview-title">
          <BarChart2 size={24} className="admin-overview-icon" />
          Dashboard Overview
        </h2>
        <p className="admin-overview-subtitle">Quick summary of your system's performance</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="admin-stats-grid">
        {/* Total Users Card */}
        <div className="admin-stat-card admin-stat-users">
          <div className="admin-stat-icon-wrapper">
            <Users size={24} />
          </div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{userStats.total}</h3>
            <p className="admin-stat-label">Total Users</p>
            <div className="admin-stat-breakdown">
              <span>{userStats.managers} Managers</span>
              <span>{userStats.auditors} Auditors</span>
              <span>{userStats.customers} Customers</span>
            </div>
            <button className="admin-stat-link" onClick={onNavigateToUsers}>
              View All <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Monthly Revenue Card */}
        <div className="admin-stat-card admin-stat-revenue">
          <div className="admin-stat-icon-wrapper admin-stat-icon-revenue">
            <DollarSign size={24} />
          </div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">Rs. {monthlyRevenue.toLocaleString()}</h3>
            <p className="admin-stat-label">Monthly Revenue</p>
            <div className="admin-stat-trend">
              <TrendingUp size={14} /> Current Month
            </div>
            <button className="admin-stat-link" onClick={onNavigateToAnalytics}>
              View Analytics <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="admin-stat-card admin-stat-alert">
          <div className="admin-stat-icon-wrapper admin-stat-icon-alert">
            <AlertTriangle size={24} />
          </div>
          <div className="admin-stat-content">
            <h3 className="admin-stat-value">{lowStockCount}</h3>
            <p className="admin-stat-label">Low Stock Alerts</p>
            <p className="admin-stat-hint">Items below threshold</p>
            <button className="admin-stat-link" onClick={onNavigateToLowStock}>
              View Items <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="admin-secondary-stats">
        <div className="admin-secondary-card">
          <div className="admin-secondary-icon">
            <Package size={20} />
          </div>
          <div className="admin-secondary-info">
            <span className="admin-secondary-value">{totalProducts}</span>
            <span className="admin-secondary-label">Total Products</span>
          </div>
        </div>
        <div className="admin-secondary-card">
          <div className="admin-secondary-icon">
            <ShoppingCart size={20} />
          </div>
          <div className="admin-secondary-info">
            <span className="admin-secondary-value">{totalOrders}</span>
            <span className="admin-secondary-label">Total Orders</span>
          </div>
        </div>
        <div className="admin-secondary-card">
          <div className="admin-secondary-icon admin-secondary-icon-healthy">
            <Package size={20} />
          </div>
          <div className="admin-secondary-info">
            <span className="admin-secondary-value">{totalProducts - lowStockCount}</span>
            <span className="admin-secondary-label">Healthy Stock</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-quick-actions">
        <h3 className="admin-quick-actions-title">Quick Actions</h3>
        <div className="admin-quick-actions-grid">
          <button className="admin-quick-action-btn" onClick={onNavigateToUsers}>
            <Users size={20} />
            <span>Manage Users</span>
          </button>
          <button className="admin-quick-action-btn" onClick={onNavigateToLowStock}>
            <AlertTriangle size={20} />
            <span>Check Low Stock</span>
          </button>
          <button className="admin-quick-action-btn" onClick={onNavigateToAnalytics}>
            <BarChart2 size={20} />
            <span>View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
