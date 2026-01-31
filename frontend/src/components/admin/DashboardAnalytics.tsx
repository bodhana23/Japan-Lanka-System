import React, { useState } from 'react';
import {
  BarChart2, DollarSign, TrendingUp, TrendingDown,
  ShoppingCart, Package
} from 'lucide-react';
import './DashboardAnalytics.css';

interface SalesData {
  month: string;
  sales: number;
  orders: number;
  topSellingParts: { name: string; units: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  dailyTrend: number[];
}

interface BrandSales {
  brand: string;
  sales: number;
  units: number;
}

interface DashboardAnalyticsProps {
  salesData: SalesData[];
  brandSales: BrandSales[];
  monthlyRevenue: number;
  yearlyRevenue: number;
  dateRange: '3months' | '6months' | 'year';
  onDateRangeChange: (range: '3months' | '6months' | 'year') => void;
}

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  salesData,
  brandSales,
  monthlyRevenue,
  yearlyRevenue,
  dateRange,
  onDateRangeChange,
}) => {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  return (
    <div className="admin-analytics-container">
      <div className="admin-analytics-header">
        <div className="admin-analytics-title-section">
          <h2 className="admin-analytics-title">
            <BarChart2 size={24} className="admin-analytics-icon" />
            Financial Analytics
          </h2>
          <p className="admin-analytics-subtitle">Track your business performance</p>
        </div>
        <div className="admin-date-range-selector">
          <label>Time Period:</label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as typeof dateRange)}
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Sales Cards */}
      <div className="admin-sales-cards">
        {salesData.map((data, index) => {
          const isExpanded = expandedMonth === data.month;
          const isCurrentMonth = index === salesData.length - 1;
          return (
            <div
              key={data.month}
              className={`admin-sales-card ${isCurrentMonth ? 'admin-current-month' : ''} ${isExpanded ? 'admin-expanded' : ''}`}
              onClick={() => setExpandedMonth(isExpanded ? null : data.month)}
            >
              <div className="admin-sales-card-header">
                <h3>{data.month}</h3>
                {isCurrentMonth && <span className="admin-current-badge">Current</span>}
                <button
                  className="admin-expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedMonth(isExpanded ? null : data.month);
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>
              <div className="admin-sales-amount">
                <span className="admin-currency">Rs.</span>
                <span className="admin-amount">{data.sales.toLocaleString()}</span>
              </div>
              <div className="admin-sales-details">
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Total Orders:</span>
                  <span className="admin-detail-value">{data.orders}</span>
                </div>
                <div className="admin-detail-item">
                  <span className="admin-detail-label">Avg Order:</span>
                  <span className="admin-detail-value">
                    Rs. {data.orders > 0 ? Math.round(data.sales / data.orders).toLocaleString() : '0'}
                  </span>
                </div>
              </div>

              {/* Mini Trend Chart */}
              <div className="admin-mini-trend">
                {data.dailyTrend && data.dailyTrend.length > 0 && data.dailyTrend.map((value, i) => {
                  const validValues = data.dailyTrend.filter(v => typeof v === 'number' && isFinite(v) && v > 0);
                  const maxTrend = validValues.length > 0 ? Math.max(...validValues) : 0;
                  return (
                    <div
                      key={i}
                      className="admin-trend-bar"
                      style={{ height: `${maxTrend > 0 && isFinite(value) && value > 0 ? (value / maxTrend) * 100 : 0}%` }}
                    />
                  );
                })}
              </div>

              <div className="admin-sales-trend">
                {index > 0 && salesData[index - 1] && salesData[index - 1].sales > 0 && (
                  <span className={`admin-trend ${data.sales > salesData[index - 1].sales ? 'admin-trend-up' : 'admin-trend-down'}`}>
                    {data.sales > salesData[index - 1].sales ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(((data.sales - salesData[index - 1].sales) / salesData[index - 1].sales) * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="admin-expanded-details" onClick={(e) => e.stopPropagation()}>
                  <div className="admin-detail-section">
                    <h4>Top Selling Parts</h4>
                    <ul>
                      {data.topSellingParts && data.topSellingParts.length > 0 ? (
                        data.topSellingParts.map((part, idx) => (
                          <li key={idx}>
                            <span>{part.name}</span>
                            <strong>{part.units} units</strong>
                          </li>
                        ))
                      ) : (
                        <li>No data available</li>
                      )}
                    </ul>
                  </div>
                  <div className="admin-detail-section">
                    <h4>Revenue by Category</h4>
                    <ul>
                      {data.revenueByCategory && data.revenueByCategory.length > 0 ? (
                        data.revenueByCategory.map((cat, idx) => (
                          <li key={idx}>
                            <span>{cat.category}</span>
                            <strong>Rs. {cat.revenue.toLocaleString()}</strong>
                          </li>
                        ))
                      ) : (
                        <li>No data available</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Section */}
      <div className="admin-summary-section">
        <h3>Summary</h3>
        <div className="admin-summary-cards">
          <div className="admin-summary-card admin-summary-primary">
            <div className="admin-summary-icon">
              <DollarSign size={24} />
            </div>
            <h4>Monthly Revenue</h4>
            <p className="admin-summary-amount">Rs. {monthlyRevenue.toLocaleString()}</p>
            <span className="admin-summary-label">Current Month</span>
          </div>
          <div className="admin-summary-card admin-summary-success">
            <div className="admin-summary-icon">
              <TrendingUp size={24} />
            </div>
            <h4>Yearly Revenue (Est.)</h4>
            <p className="admin-summary-amount">Rs. {Math.round(yearlyRevenue).toLocaleString()}</p>
            <span className="admin-summary-label">Annual Projection</span>
          </div>
          <div className="admin-summary-card admin-summary-info">
            <div className="admin-summary-icon">
              <ShoppingCart size={24} />
            </div>
            <h4>Total Sales ({salesData.length} Months)</h4>
            <p className="admin-summary-amount">Rs. {salesData.reduce((sum, data) => sum + data.sales, 0).toLocaleString()}</p>
          </div>
          <div className="admin-summary-card admin-summary-warning">
            <div className="admin-summary-icon">
              <Package size={24} />
            </div>
            <h4>Total Orders</h4>
            <p className="admin-summary-amount">{salesData.reduce((sum, data) => sum + data.orders, 0)}</p>
          </div>
          <div className="admin-summary-card admin-summary-accent">
            <div className="admin-summary-icon">
              <BarChart2 size={24} />
            </div>
            <h4>Average Monthly Sales</h4>
            <p className="admin-summary-amount">
              Rs. {Math.round(salesData.length > 0 ? salesData.reduce((sum, data) => sum + data.sales, 0) / salesData.length : 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Brand Sales Section */}
      <div className="admin-brand-section">
        <h3>Top Selling Brands</h3>
        <div className="admin-brand-chart">
          {brandSales && brandSales.length > 0 && brandSales.map((brand, index) => {
            const salesValues = brandSales.map(b => b.sales).filter(s => s > 0);
            const maxSales = salesValues.length > 0 ? Math.max(...salesValues) : 0;
            const percentage = maxSales > 0 && isFinite(maxSales) && brand.sales > 0
              ? Math.min((brand.sales / maxSales) * 100, 100)
              : 0;
            return (
              <div key={brand.brand} className="admin-brand-row">
                <div className="admin-brand-info">
                  <span className="admin-brand-rank">#{index + 1}</span>
                  <span className="admin-brand-name">{brand.brand}</span>
                </div>
                <div className="admin-brand-bar-wrapper">
                  <div
                    className="admin-brand-bar"
                    style={{ width: `${percentage}%` }}
                  >
                    <span className="admin-bar-label">
                      Rs. {brand.sales.toLocaleString()} ({brand.units} units)
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
