import React, { useState, useCallback } from 'react';
import { GitBranch, Activity, CheckCircle, XCircle, ArrowRight, Monitor, Store, X, Clock, Truck, Package, MapPin } from 'lucide-react';
import type { OrderPipelineResponse, Order } from '../../services/api';
import { ordersApi } from '../../services/api';
import { formatDateTime } from '../../utils/dateUtils';
import './DashboardOrderPipeline.css';

interface DashboardOrderPipelineProps {
  data: OrderPipelineResponse;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  ready_to_pickup: 'Ready to Pickup',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  shipped: '#8B5CF6',
  ready_to_pickup: '#06B6D4',
  delivered: '#10B981',
  cancelled: '#EF4444',
};

// Statuses that should only show last month's orders
const DATE_LIMITED_STATUSES = ['ready_to_pickup', 'delivered'];

const DashboardOrderPipeline: React.FC<DashboardOrderPipelineProps> = ({ data }) => {
  const totalAll = data.totalActive + data.totalCompleted + data.totalCancelled;

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const fetchOrdersForStatus = useCallback(async (status: string) => {
    try {
      setIsLoadingOrders(true);
      setOrdersError(null);

      const params: { status: string; from_date?: string; page_size: number } = {
        status,
        page_size: 100,
      };

      // For ready_to_pickup and delivered, only show past month
      if (DATE_LIMITED_STATUSES.includes(status)) {
        const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        params.from_date = oneMonthAgo.toISOString();
      }

      const response = await ordersApi.getOrders(params);
      setOrders(response.items);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrdersError('Failed to load orders.');
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const handleStageClick = (status: string) => {
    if (selectedStatus === status) {
      setSelectedStatus(null);
      setOrders([]);
      setOrdersError(null);
    } else {
      setSelectedStatus(status);
      fetchOrdersForStatus(status);
    }
  };

  const clearSelection = () => {
    setSelectedStatus(null);
    setOrders([]);
    setOrdersError(null);
  };

  // Separate pipeline stages from cancelled
  const pipelineStages = data.pipeline.filter(s => s.status !== 'cancelled');
  const cancelledStage = data.pipeline.find(s => s.status === 'cancelled');

  return (
    <div className="admin-pipeline-container">
      {/* Header */}
      <div className="admin-pipeline-header">
        <div className="admin-pipeline-title-section">
          <h2 className="admin-pipeline-title">
            <GitBranch size={24} className="admin-pipeline-icon" />
            Order Status Pipeline
          </h2>
          <p className="admin-pipeline-subtitle">Current snapshot of orders across all statuses. Click a stage to view orders.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-pipeline-summary">
        <div className="admin-pipeline-card admin-pipeline-card-active">
          <div className="admin-pipeline-card-icon">
            <Activity size={24} />
          </div>
          <h4>Active Orders</h4>
          <p className="admin-pipeline-card-value">{data.totalActive}</p>
        </div>
        <div className="admin-pipeline-card admin-pipeline-card-completed">
          <div className="admin-pipeline-card-icon">
            <CheckCircle size={24} />
          </div>
          <h4>Completed</h4>
          <p className="admin-pipeline-card-value">{data.totalCompleted}</p>
        </div>
        <div className="admin-pipeline-card admin-pipeline-card-cancelled">
          <div className="admin-pipeline-card-icon">
            <XCircle size={24} />
          </div>
          <h4>Cancelled</h4>
          <p className="admin-pipeline-card-value">{data.totalCancelled}</p>
        </div>
      </div>

      {/* Pipeline Flow */}
      <div className="admin-pipeline-flow-section">
        <h3>Order Flow</h3>
        {totalAll === 0 ? (
          <div className="admin-pipeline-empty">
            <GitBranch size={48} />
            <p>No order data available</p>
          </div>
        ) : (
          <div className="admin-pipeline-flow">
            {pipelineStages.map((stage, index) => {
              const percentage = totalAll > 0 ? ((stage.count / totalAll) * 100) : 0;
              const color = STATUS_COLORS[stage.status] || '#6B7280';
              const isSelected = selectedStatus === stage.status;
              return (
                <React.Fragment key={stage.status}>
                  <div
                    className={`admin-pipeline-stage ${isSelected ? 'admin-pipeline-stage-selected' : ''}`}
                    onClick={() => handleStageClick(stage.status)}
                  >
                    <div
                      className="admin-pipeline-stage-bar"
                      style={{
                        backgroundColor: isSelected ? `${color}25` : `${color}15`,
                        borderColor: color,
                        boxShadow: isSelected ? `0 4px 16px ${color}40` : undefined,
                      }}
                    >
                      <div className="admin-pipeline-stage-fill" style={{
                        width: `${Math.max(percentage, 5)}%`,
                        backgroundColor: color,
                      }} />
                      <div className="admin-pipeline-stage-content">
                        <span className="admin-pipeline-stage-label">
                          {STATUS_LABELS[stage.status] || stage.status}
                        </span>
                        <span className="admin-pipeline-stage-count" style={{ color }}>
                          {stage.count}
                        </span>
                      </div>
                    </div>
                    <div className="admin-pipeline-stage-meta">
                      <span className="admin-pipeline-percentage">{percentage.toFixed(1)}%</span>
                      {(stage.onlineCount > 0 || stage.offlineCount > 0) && (
                        <div className="admin-pipeline-channel-split">
                          <span className="admin-pipeline-channel-online" title="Online orders">
                            <Monitor size={12} /> {stage.onlineCount}
                          </span>
                          <span className="admin-pipeline-channel-offline" title="Offline orders">
                            <Store size={12} /> {stage.offlineCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <div className="admin-pipeline-arrow">
                      <ArrowRight size={20} />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancelled Section */}
      {cancelledStage && cancelledStage.count > 0 && (
        <div
          className={`admin-pipeline-cancelled-section ${selectedStatus === 'cancelled' ? 'admin-pipeline-cancelled-selected' : ''}`}
          onClick={() => handleStageClick('cancelled')}
          style={{ cursor: 'pointer' }}
        >
          <h3>Cancelled Orders</h3>
          <div className="admin-pipeline-cancelled-bar">
            <div className="admin-pipeline-cancelled-info">
              <XCircle size={20} />
              <span>{cancelledStage.count} orders cancelled</span>
              <span className="admin-pipeline-percentage">
                ({totalAll > 0 ? ((cancelledStage.count / totalAll) * 100).toFixed(1) : 0}%)
              </span>
            </div>
            {(cancelledStage.onlineCount > 0 || cancelledStage.offlineCount > 0) && (
              <div className="admin-pipeline-channel-split">
                <span className="admin-pipeline-channel-online">
                  <Monitor size={12} /> {cancelledStage.onlineCount} online
                </span>
                <span className="admin-pipeline-channel-offline">
                  <Store size={12} /> {cancelledStage.offlineCount} offline
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders List (shown when a stage is selected) */}
      {selectedStatus && (
        <div className="admin-pipeline-orders-section">
          <div className="admin-pipeline-orders-header">
            <div className="admin-pipeline-orders-header-left">
              <span
                className="admin-pipeline-orders-status-badge"
                style={{ backgroundColor: STATUS_COLORS[selectedStatus] || '#6B7280' }}
              >
                {STATUS_LABELS[selectedStatus] || selectedStatus}
              </span>
              <span className="admin-pipeline-orders-count">
                {isLoadingOrders ? 'Loading...' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
              </span>
              {DATE_LIMITED_STATUSES.includes(selectedStatus) && (
                <span className="admin-pipeline-orders-date-hint">
                  <Clock size={14} /> Last 30 days only
                </span>
              )}
            </div>
            <button className="admin-pipeline-orders-close" onClick={clearSelection}>
              <X size={18} /> Close
            </button>
          </div>

          {isLoadingOrders ? (
            <div className="admin-pipeline-orders-loading">
              <div className="admin-spinner" />
              <p>Loading orders...</p>
            </div>
          ) : ordersError ? (
            <div className="admin-pipeline-orders-error">
              <p>{ordersError}</p>
              <button onClick={() => fetchOrdersForStatus(selectedStatus)} className="admin-btn admin-btn-primary">
                Retry
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="admin-pipeline-orders-empty">
              <Package size={32} />
              <p>No orders found for this status</p>
            </div>
          ) : (
            <div className="admin-pipeline-orders-table">
              <div className="admin-pipeline-orders-table-header">
                <span className="admin-pipeline-col-id">Order ID</span>
                <span className="admin-pipeline-col-customer">Customer</span>
                <span className="admin-pipeline-col-date">Date</span>
                <span className="admin-pipeline-col-amount">Amount</span>
                <span className="admin-pipeline-col-channel">Channel</span>
                <span className="admin-pipeline-col-delivery">Delivery</span>
              </div>
              {orders.map((order) => (
                <div key={order.id} className="admin-pipeline-order-row">
                  <span className="admin-pipeline-col-id admin-pipeline-order-id">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="admin-pipeline-col-customer">
                    <span className="admin-pipeline-customer-name">
                      {order.customer_name || order.offline_customer_name || 'N/A'}
                    </span>
                    {order.customer_email && (
                      <span className="admin-pipeline-customer-email">{order.customer_email}</span>
                    )}
                  </span>
                  <span className="admin-pipeline-col-date">
                    {formatDateTime(order.created_at)}
                  </span>
                  <span className="admin-pipeline-col-amount">
                    Rs. {Number(order.total_amount).toLocaleString()}
                  </span>
                  <span className="admin-pipeline-col-channel">
                    <span className={`admin-pipeline-channel-badge admin-pipeline-badge-${order.sales_channel || 'online'}`}>
                      {order.sales_channel === 'offline' ? <><Store size={12} /> Offline</> : <><Monitor size={12} /> Online</>}
                    </span>
                  </span>
                  <span className="admin-pipeline-col-delivery">
                    {order.delivery_method === 'shipping' ? (
                      <span className="admin-pipeline-delivery-badge"><Truck size={12} /> Shipping</span>
                    ) : (
                      <span className="admin-pipeline-delivery-badge"><MapPin size={12} /> Pickup</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardOrderPipeline;
