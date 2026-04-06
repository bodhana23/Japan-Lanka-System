import React, { useState, useMemo } from 'react';
import { Search, Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { Product } from '../../services/api';

interface DashboardInventoryProps {
  products: Array<{
    id: string;
    name: string;
    description: string;
    brand: string;
    model: string;
    price: number;
    quantity: number;
    imageLink: string;
  }>;
  isLoading: boolean;
  error: string | null;
  onEditProduct: (product: any) => void;
  onAddProduct: () => void;
}

export const DashboardInventory: React.FC<DashboardInventoryProps> = ({
  products,
  isLoading,
  error,
  onEditProduct,
  onAddProduct
}) => {
  // Inventory filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_az' | 'name_za' | 'price_high' | 'price_low' | 'stock_high' | 'stock_low'>('name_az');

  // Filtered inventory products using useMemo
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.id.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.model.toLowerCase().includes(query)
      );
    }

    // Apply stock level filter
    if (stockFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (stockFilter) {
          case 'in_stock':
            return product.quantity >= 10;
          case 'low_stock':
            return product.quantity > 0 && product.quantity < 10;
          case 'out_of_stock':
            return product.quantity === 0;
          default:
            return true;
        }
      });
    }

    // Apply brand filter
    if (brandFilter !== 'all') {
      filtered = filtered.filter(product => product.brand === brandFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_az':
          return a.name.localeCompare(b.name);
        case 'name_za':
          return b.name.localeCompare(a.name);
        case 'price_high':
          return b.price - a.price;
        case 'price_low':
          return a.price - b.price;
        case 'stock_high':
          return b.quantity - a.quantity;
        case 'stock_low':
          return a.quantity - b.quantity;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, stockFilter, brandFilter, sortBy]);

  // Get unique brands for filter dropdown
  const availableBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.brand));
    return Array.from(brands).sort();
  }, [products]);

  // Count products by stock level for filter chips
  const stockCounts = useMemo(() => {
    return {
      all: products.length,
      in_stock: products.filter(p => p.quantity >= 10).length,
      low_stock: products.filter(p => p.quantity > 0 && p.quantity < 10).length,
      out_of_stock: products.filter(p => p.quantity === 0).length
    };
  }, [products]);

  // Check if any inventory filters are active
  const hasActiveFilters = searchQuery || stockFilter !== 'all' || brandFilter !== 'all';

  // Clear all inventory filters
  const clearAllFilters = () => {
    setSearchQuery('');
    setStockFilter('all');
    setBrandFilter('all');
    setSortBy('name_az');
  };

  return (
    <div className="inventory-section">
      <div className="section-header">
        <h2><Package size={20} />Product Inventory</h2>
        <button 
          className="add-product-btn"
          onClick={onAddProduct}
        >
          Add New Product
        </button>
      </div>

      {/* Inventory Search Bar */}
      <div className="inventory-search-container">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="inventory-search-input"
            placeholder="Search by product ID, name, brand, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="inventory-filters-row">
        {/* Stock Level Filter Chips */}
        <div className="status-filter-chips">
          <button
            className={`filter-chip ${stockFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStockFilter('all')}
          >
            All Products
            <span className="chip-badge">{stockCounts.all}</span>
          </button>
          <button
            className={`filter-chip ${stockFilter === 'in_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('in_stock')}
          >
            In Stock (≥10)
            <span className="chip-badge">{stockCounts.in_stock}</span>
          </button>
          <button
            className={`filter-chip ${stockFilter === 'low_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('low_stock')}
          >
            Low Stock (&lt;10)
            <span className="chip-badge">{stockCounts.low_stock}</span>
          </button>
          <button
            className={`filter-chip ${stockFilter === 'out_of_stock' ? 'active' : ''}`}
            onClick={() => setStockFilter('out_of_stock')}
          >
            Out of Stock
            <span className="chip-badge">{stockCounts.out_of_stock}</span>
          </button>
        </div>

        {/* Brand and Sort Filters */}
        <div className="date-sort-filters">
          {/* Brand Filter Dropdown */}
          <div className="sort-filter">
            <label htmlFor="brand-filter">Brand:</label>
            <select
              id="brand-filter"
              className="sort-select"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="all">All Brands</option>
              {availableBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="sort-filter">
            <label htmlFor="inventory-sort">Sort by:</label>
            <select
              id="inventory-sort"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="name_az">Name (A-Z)</option>
              <option value="name_za">Name (Z-A)</option>
              <option value="price_high">Price: High to Low</option>
              <option value="price_low">Price: Low to High</option>
              <option value="stock_high">Stock: High to Low</option>
              <option value="stock_low">Stock: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="active-filters-summary">
          <div className="active-filters-tags">
            {stockFilter !== 'all' && (
              <span className="filter-tag">
                Stock: {stockFilter.replace('_', ' ')}
                <button onClick={() => setStockFilter('all')}>✕</button>
              </span>
            )}
            {searchQuery && (
              <span className="filter-tag">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>✕</button>
              </span>
            )}
            {brandFilter !== 'all' && (
              <span className="filter-tag">
                Brand: {brandFilter}
                <button onClick={() => setBrandFilter('all')}>✕</button>
              </span>
            )}
          </div>
          <button className="clear-all-filters-btn" onClick={clearAllFilters}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="inventory-results-count">
        <span>
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
        </span>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="empty-state">
          <div className="empty-state-icon"><RefreshCw size={48} className="spin" /></div>
          <h3>Loading products...</h3>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-icon"><AlertTriangle size={48} /></div>
          <h3>Error loading products</h3>
          <p>{error}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={48} /></div>
          <h3>No products found matching your filters</h3>
          <p>Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearAllFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => {
            // Determine stock status
            const stockStatus = product.quantity === 0
              ? 'out-of-stock'
              : product.quantity < 10
                ? 'low-stock'
                : 'in-stock';

            const stockLabel = product.quantity === 0
              ? 'Out of Stock'
              : product.quantity < 10
                ? 'Low Stock'
                : 'In Stock';

            return (
              <div key={product.id} className="product-item">
                <div className="product-image-container">
                  {product.imageLink ? (
                    <img
                      src={product.imageLink}
                      alt={product.name}
                      className="product-img"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`no-image-placeholder ${product.imageLink ? 'hidden' : ''}`}>
                    <Package size={48} color="#ccc" />
                  </div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-brand">{product.brand}</p>
                  <p className="product-model">{product.model}</p>
                  <div className="product-stock-row">
                    <span className="stock-quantity">Stock: {product.quantity} units</span>
                    <span className={`stock-status-badge ${stockStatus}`}>{stockLabel}</span>
                  </div>
                </div>
                <div className="product-actions">
                  <button
                    className="edit-btn"
                    onClick={() => onEditProduct(product)}
                  >
                    Edit Product
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
