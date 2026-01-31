import React from 'react';
import {
  AlertTriangle, RefreshCw, Package, Bell, Clock, CheckCircle, ImageOff
} from 'lucide-react';
import './DashboardLowStock.css';

interface LowStockProduct {
  id: string;
  name: string;
  brand: string;
  model: string;
  yearFrom?: number;
  yearTo?: number;
  price: number;
  quantityAvailable: number;
  category: string;
  imageUrl?: string;
  description?: string;
}

interface DashboardLowStockProps {
  products: LowStockProduct[];
  totalProducts: number;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onRestockAll: () => void;
  onOrderMore: (productId: string) => void;
  onNotifyManager: (productName: string) => void;
  onRetry: () => void;
}

const DashboardLowStock: React.FC<DashboardLowStockProps> = ({
  products,
  totalProducts,
  isLoading,
  error,
  onRefresh,
  onRestockAll,
  onOrderMore,
  onNotifyManager,
  onRetry,
}) => {
  return (
    <div className="admin-lowstock-container">
      <div className="admin-lowstock-header">
        <div className="admin-lowstock-title-section">
          <h2 className="admin-lowstock-title">
            <AlertTriangle size={24} className="admin-lowstock-icon" />
            Low Stock Alerts (Quantity &lt; 3)
          </h2>
          <p className="admin-lowstock-subtitle">Real-time data from database</p>
        </div>
        <div className="admin-lowstock-actions">
          <button
            className="admin-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? <Clock size={16} /> : <RefreshCw size={16} />}
            Refresh Data
          </button>
          {products.length > 0 && (
            <button className="admin-restock-btn" onClick={onRestockAll}>
              <Package size={16} />
              Restock All ({products.length})
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="admin-lowstock-loading">
          <Clock size={32} className="admin-loading-spinner" />
          <p>Loading products...</p>
        </div>
      ) : error ? (
        <div className="admin-lowstock-error">
          <AlertTriangle size={32} />
          <p>{error}</p>
          <button onClick={onRetry} className="admin-retry-btn">Try Again</button>
        </div>
      ) : products.length === 0 ? (
        <div className="admin-lowstock-empty">
          <CheckCircle size={48} className="admin-empty-icon" />
          <h3>All inventory levels are healthy!</h3>
          <p>No items require immediate restocking.</p>
        </div>
      ) : (
        <div className="admin-lowstock-grid">
          {products.map(item => (
            <div key={item.id} className="admin-lowstock-card">
              <div className="admin-stock-alert-badge">
                <AlertTriangle size={16} />
                <span>Only {item.quantityAvailable} left!</span>
              </div>
              <div className="admin-product-image">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                      if (placeholder) {
                        (placeholder as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div className="admin-image-placeholder" style={{ display: item.imageUrl ? 'none' : 'flex' }}>
                  <ImageOff size={40} />
                </div>
              </div>
              <div className="admin-product-info">
                <h3 className="admin-product-name">{item.name}</h3>
                <p className="admin-product-brand">{item.brand}</p>
                <p className="admin-product-model">
                  {item.model}
                  {item.yearFrom && item.yearTo && ` (${item.yearFrom}-${item.yearTo})`}
                  {item.yearFrom && !item.yearTo && ` (${item.yearFrom}+)`}
                </p>
                <p className="admin-product-price">
                  Rs. {item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="admin-product-category">{item.category}</p>
              </div>
              <div className="admin-product-actions">
                <button
                  onClick={() => onOrderMore(item.id)}
                  className="admin-order-btn"
                >
                  <Package size={16} /> Order More
                </button>
                <button
                  onClick={() => onNotifyManager(item.name)}
                  className="admin-notify-btn"
                >
                  <Bell size={16} /> Notify Manager
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inventory Summary */}
      <div className="admin-inventory-summary">
        <h3>Inventory Overview</h3>
        <div className="admin-inventory-stats">
          <div className="admin-inventory-stat">
            <span className="admin-stat-label">Total Products:</span>
            <span className="admin-stat-value">{totalProducts}</span>
          </div>
          <div className="admin-inventory-stat">
            <span className="admin-stat-label">Low Stock Items:</span>
            <span className="admin-stat-value admin-stat-critical">{products.length}</span>
          </div>
          <div className="admin-inventory-stat">
            <span className="admin-stat-label">Healthy Stock:</span>
            <span className="admin-stat-value admin-stat-healthy">{totalProducts - products.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLowStock;
