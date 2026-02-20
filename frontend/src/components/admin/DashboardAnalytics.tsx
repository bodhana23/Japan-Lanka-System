import React, { useState } from 'react';
import {
  BarChart2, DollarSign, TrendingUp, TrendingDown,
  ShoppingCart, Package, RotateCcw, AlertCircle, Monitor, Store
} from 'lucide-react';
import type { ReturnAnalyticsResponse, SalesChannelComparisonResponse } from '../../services/api';
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
  returnAnalytics?: ReturnAnalyticsResponse | null;
  channelComparison?: SalesChannelComparisonResponse | null;
}

const REASON_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  salesData,
  brandSales,
  monthlyRevenue,
  yearlyRevenue,
  dateRange,
  onDateRangeChange,
  returnAnalytics,
  channelComparison,
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

      {/* Return Analytics Section */}
      {returnAnalytics && (
        <div className="admin-return-section">
          <h3>
            <RotateCcw size={20} className="admin-return-title-icon" />
            Return Analytics
          </h3>

          {/* Return Summary Row */}
          <div className="admin-return-summary">
            <div className="admin-return-stat">
              <span className="admin-return-stat-label">Return Rate</span>
              <span className={`admin-return-rate-badge ${returnAnalytics.returnRate > 10 ? 'admin-return-rate-high' : returnAnalytics.returnRate > 5 ? 'admin-return-rate-medium' : 'admin-return-rate-low'}`}>
                {returnAnalytics.returnRate}%
              </span>
            </div>
            <div className="admin-return-stat">
              <span className="admin-return-stat-label">Total Returns</span>
              <span className="admin-return-stat-value">{returnAnalytics.totalReturns}</span>
            </div>
            <div className="admin-return-stat">
              <span className="admin-return-stat-label">Total Orders</span>
              <span className="admin-return-stat-value">{returnAnalytics.totalOrders}</span>
            </div>
          </div>

          {/* Monthly Returns */}
          {returnAnalytics.monthlyReturns.length > 0 && (
            <div className="admin-return-monthly">
              <h4>Returns by Month</h4>
              <div className="admin-return-monthly-chart">
                {returnAnalytics.monthlyReturns.map((month) => {
                  const maxReturns = Math.max(...returnAnalytics.monthlyReturns.map(m => m.returns), 1);
                  const barWidth = (month.returns / maxReturns) * 100;
                  return (
                    <div key={month.month} className="admin-return-month-row">
                      <span className="admin-return-month-label">{month.month}</span>
                      <div className="admin-return-month-bar-wrapper">
                        <div
                          className="admin-return-month-bar"
                          style={{ width: `${barWidth}%` }}
                        >
                          <span className="admin-return-month-bar-label">
                            {month.returns} returns - Rs. {month.refundValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="admin-return-details-grid">
            {/* Top Returned Products */}
            {returnAnalytics.topReturnedProducts.length > 0 && (
              <div className="admin-return-top-products">
                <h4>
                  <AlertCircle size={16} />
                  Top Returned Products
                </h4>
                <ul>
                  {returnAnalytics.topReturnedProducts.map((product, idx) => (
                    <li key={idx}>
                      <span className="admin-return-product-rank">#{idx + 1}</span>
                      <span className="admin-return-product-name">{product.name}</span>
                      <strong>{product.returns} units</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reason Breakdown */}
            {returnAnalytics.reasonBreakdown.length > 0 && (
              <div className="admin-return-reasons">
                <h4>Return Reasons</h4>
                <div className="admin-return-reasons-chart">
                  {returnAnalytics.reasonBreakdown.map((reason, idx) => {
                    const maxCount = Math.max(...returnAnalytics.reasonBreakdown.map(r => r.count), 1);
                    const barWidth = (reason.count / maxCount) * 100;
                    const color = REASON_COLORS[idx % REASON_COLORS.length];
                    return (
                      <div key={reason.reason} className="admin-return-reason-row">
                        <span className="admin-return-reason-label">{reason.reason}</span>
                        <div className="admin-return-reason-bar-wrapper">
                          <div
                            className="admin-return-reason-bar"
                            style={{ width: `${barWidth}%`, backgroundColor: color }}
                          />
                        </div>
                        <span className="admin-return-reason-count">{reason.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {returnAnalytics.totalReturns === 0 && (
            <div className="admin-return-empty">
              <RotateCcw size={32} />
              <p>No return data available for the selected period</p>
            </div>
          )}
        </div>
      )}

      {/* Online vs Offline Sales Comparison */}
      {channelComparison && (
        <div className="admin-channel-section">
          <h3>
            <Monitor size={20} className="admin-channel-title-icon" />
            Online vs Offline Sales
          </h3>

          {/* Channel Summary Cards */}
          <div className="admin-channel-cards">
            {channelComparison.channels.map((channel) => {
              const isOnline = channel.channel === 'online';
              return (
                <div key={channel.channel} className={`admin-channel-card ${isOnline ? 'admin-channel-online' : 'admin-channel-offline'}`}>
                  <div className="admin-channel-card-header">
                    {isOnline ? <Monitor size={24} /> : <Store size={24} />}
                    <h4>{isOnline ? 'Online Sales' : 'Offline Sales'}</h4>
                  </div>
                  <div className="admin-channel-card-stats">
                    <div className="admin-channel-stat">
                      <span className="admin-channel-stat-label">Revenue</span>
                      <span className="admin-channel-stat-value">Rs. {channel.revenue.toLocaleString()}</span>
                    </div>
                    <div className="admin-channel-stat">
                      <span className="admin-channel-stat-label">Orders</span>
                      <span className="admin-channel-stat-value">{channel.orders}</span>
                    </div>
                    <div className="admin-channel-stat">
                      <span className="admin-channel-stat-label">Avg Order</span>
                      <span className="admin-channel-stat-value">Rs. {channel.avgOrderValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Channel Comparison */}
          {channelComparison.monthlyBreakdown.length > 0 && (
            <div className="admin-channel-monthly">
              <h4>Monthly Revenue by Channel</h4>
              <div className="admin-channel-monthly-chart">
                {channelComparison.monthlyBreakdown.map((month) => {
                  const totalRevenue = month.onlineRevenue + month.offlineRevenue;
                  const maxRevenue = Math.max(...channelComparison.monthlyBreakdown.map(m => m.onlineRevenue + m.offlineRevenue), 1);
                  const onlineWidth = maxRevenue > 0 ? (month.onlineRevenue / maxRevenue) * 100 : 0;
                  const offlineWidth = maxRevenue > 0 ? (month.offlineRevenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={month.month} className="admin-channel-month-row">
                      <span className="admin-channel-month-label">{month.month}</span>
                      <div className="admin-channel-month-bars">
                        <div className="admin-channel-stacked-bar">
                          {onlineWidth > 0 && (
                            <div
                              className="admin-channel-bar-online"
                              style={{ width: `${onlineWidth}%` }}
                              title={`Online: Rs. ${month.onlineRevenue.toLocaleString()}`}
                            />
                          )}
                          {offlineWidth > 0 && (
                            <div
                              className="admin-channel-bar-offline"
                              style={{ width: `${offlineWidth}%` }}
                              title={`Offline: Rs. ${month.offlineRevenue.toLocaleString()}`}
                            />
                          )}
                        </div>
                        <span className="admin-channel-month-total">
                          Rs. {totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div className="admin-channel-legend">
                  <span className="admin-channel-legend-online">
                    <span className="admin-channel-legend-dot admin-channel-dot-online" /> Online
                  </span>
                  <span className="admin-channel-legend-offline">
                    <span className="admin-channel-legend-dot admin-channel-dot-offline" /> Offline
                  </span>
                </div>
              </div>
            </div>
          )}

          {channelComparison.channels.every(c => c.orders === 0) && (
            <div className="admin-channel-empty">
              <Monitor size={32} />
              <p>No sales channel data available for the selected period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardAnalytics;
