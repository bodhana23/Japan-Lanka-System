import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import { productsApi, Product as ApiProduct } from '../services/api';
import './Shop.css';

interface FilterState {
  brands: string[];
  models: string[];
  yearFrom: number | null;
  yearTo: number | null;
  priceMin: number;
  priceMax: number;
  inStockOnly: boolean;
  searchQuery: string;
}

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const [showCart, setShowCart] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    models: [],
    yearFrom: null,
    yearTo: null,
    priceMin: 0,
    priceMax: 50000,
    inStockOnly: false,
    searchQuery: ''
  });

  // Check if user is logged in (window shopper vs logged-in customer)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  React.useEffect(() => {
    try {
      const currentUser = localStorage.getItem('currentUser');
      setIsLoggedIn(!!currentUser);
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  }, []);

  // Products state - fetched from API
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);
        const response = await productsApi.getProducts({ page_size: 100 });
        // Transform API products to match the Product interface
        const transformedProducts: Product[] = response.items.map((p: ApiProduct) => ({
          id: p.id,
          name: p.name || '',
          model: p.model || '',
          modelYear: p.year_from && p.year_to ? `${p.year_from}-${p.year_to}` : '',
          price: Number(p.price) || 0,
          quantityAvailable: Number(p.quantity_available) || 0,
          category: p.category || '',
          image: p.image_url || '📦',
          description: p.description || '',
          brand: p.brand || '',
          yearFrom: p.year_from,
          yearTo: p.year_to
        }));
        setAllProducts(transformedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProductsError('Failed to load products. Please try again later.');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Get unique brands with counts
  const brandCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allProducts.forEach(product => {
      if (product.brand) {
        counts[product.brand] = (counts[product.brand] || 0) + 1;
      }
    });
    return counts;
  }, [allProducts]);

  // Get available models based on selected brands
  const availableModels = useMemo(() => {
    if (filters.brands.length === 0) {
      return Array.from(new Set(allProducts.map(p => p.model))).sort();
    }
    return Array.from(new Set(
      allProducts
        .filter(p => p.brand && filters.brands.includes(p.brand))
        .map(p => p.model)
    )).sort();
  }, [allProducts, filters.brands]);

  // Filter products based on all filter criteria
  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      // Brand filter
      if (filters.brands.length > 0 && product.brand && !filters.brands.includes(product.brand)) {
        return false;
      }

      // Model filter
      if (filters.models.length > 0 && !filters.models.includes(product.model)) {
        return false;
      }

      // Year range filter
      if (filters.yearFrom !== null && product.yearTo && product.yearTo < filters.yearFrom) {
        return false;
      }
      if (filters.yearTo !== null && product.yearFrom && product.yearFrom > filters.yearTo) {
        return false;
      }

      // Price range filter
      if (product.price < filters.priceMin || product.price > filters.priceMax) {
        return false;
      }

      // Stock availability filter
      if (filters.inStockOnly && product.quantityAvailable === 0) {
        return false;
      }

      // Search query filter
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const searchableText = `${product.name} ${product.model} ${product.brand || ''} ${product.description}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [allProducts, filters]);

  // Toggle brand filter
  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand]
    }));
  };

  // Toggle model filter
  const toggleModel = (model: string) => {
    setFilters(prev => ({
      ...prev,
      models: prev.models.includes(model)
        ? prev.models.filter(m => m !== model)
        : [...prev.models, model]
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      brands: [],
      models: [],
      yearFrom: null,
      yearTo: null,
      priceMin: 0,
      priceMax: 50000,
      inStockOnly: false,
      searchQuery: ''
    });
  };

  // Remove individual filter
  const removeFilter = (type: string, value?: string) => {
    if (type === 'brand' && value) {
      toggleBrand(value);
    } else if (type === 'model' && value) {
      toggleModel(value);
    } else if (type === 'year') {
      setFilters(prev => ({ ...prev, yearFrom: null, yearTo: null }));
    } else if (type === 'price') {
      setFilters(prev => ({ ...prev, priceMin: 0, priceMax: 50000 }));
    } else if (type === 'stock') {
      setFilters(prev => ({ ...prev, inStockOnly: false }));
    } else if (type === 'search') {
      setFilters(prev => ({ ...prev, searchQuery: '' }));
    }
  };

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.brands.length > 0) count += filters.brands.length;
    if (filters.models.length > 0) count += filters.models.length;
    if (filters.yearFrom !== null || filters.yearTo !== null) count++;
    if (filters.priceMin > 0 || filters.priceMax < 50000) count++;
    if (filters.inStockOnly) count++;
    if (filters.searchQuery.trim() !== '') count++;
    return count;
  }, [filters]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    if (!isLoggedIn) {
      // Store the intent to checkout after login
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      navigate('/login');
    } else {
      navigate('/checkout');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="shop-container">
      <header className="shop-header">
        <div className="header-content">
          <h1>Japan Lanka Auto Parts</h1>
          <div className="header-actions">
            <button
              onClick={() => setShowCart(!showCart)}
              className="cart-btn"
            >
              🛒 Cart
              {getTotalItems() > 0 && (
                <span className="cart-badge">{getTotalItems()}</span>
              )}
            </button>
            {isLoggedIn ? (
              <button onClick={handleBackToDashboard} className="back-btn">
                ← Back to Dashboard
              </button>
            ) : (
              <button onClick={handleBackToHome} className="back-btn">
                ← Back to Home
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="shop-main">
        <div className="shop-layout">
          {/* Filter Sidebar */}
          <aside className={`filter-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filter-header">
              <h3>Filters</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="clear-filters-btn">
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Search Filter */}
            <div className="filter-section">
              <label className="filter-label">Search Parts</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="filter-search-input"
              />
            </div>

            {/* Brand Filter */}
            <div className="filter-section">
              <label className="filter-label">Brand</label>
              <div className="filter-options">
                {Object.entries(brandCounts).map(([brand, count]) => (
                  <label key={brand} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.brands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />
                    <span>{brand} ({count})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Model Filter */}
            <div className="filter-section">
              <label className="filter-label">Model</label>
              <select
                multiple
                value={filters.models}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, option => option.value);
                  setFilters(prev => ({ ...prev, models: selected }));
                }}
                className="filter-select"
                size={5}
              >
                <option value="">All Models</option>
                {availableModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Year Range Filter */}
            <div className="filter-section">
              <label className="filter-label">Year Range</label>
              <div className="year-range-inputs">
                <input
                  type="number"
                  placeholder="From"
                  value={filters.yearFrom || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    yearFrom: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  min="2010"
                  max="2025"
                  className="year-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="To"
                  value={filters.yearTo || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    yearTo: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  min="2010"
                  max="2025"
                  className="year-input"
                />
              </div>
            </div>

            {/* Price Range Filter */}
            <div className="filter-section">
              <label className="filter-label">
                Price Range: ${filters.priceMin} - ${filters.priceMax}
              </label>
              <div className="price-range-inputs">
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={filters.priceMin}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceMin: parseInt(e.target.value) 
                  }))}
                  className="price-slider"
                />
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={filters.priceMax}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    priceMax: parseInt(e.target.value) 
                  }))}
                  className="price-slider"
                />
              </div>
            </div>

            {/* Stock Filter */}
            <div className="filter-section">
              <label className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    inStockOnly: e.target.checked 
                  }))}
                />
                <span>In Stock Only</span>
              </label>
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <button 
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>🔍 Filters</span>
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>

          {/* Products Section */}
          <section className="products-section">
            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="active-filters">
                <span className="active-filters-label">Active Filters:</span>
                {filters.brands.map(brand => (
                  <span key={brand} className="filter-chip">
                    {brand}
                    <button onClick={() => removeFilter('brand', brand)}>×</button>
                  </span>
                ))}
                {filters.models.map(model => (
                  <span key={model} className="filter-chip">
                    {model}
                    <button onClick={() => removeFilter('model', model)}>×</button>
                  </span>
                ))}
                {(filters.yearFrom !== null || filters.yearTo !== null) && (
                  <span className="filter-chip">
                    Year: {filters.yearFrom || '2010'}-{filters.yearTo || '2025'}
                    <button onClick={() => removeFilter('year', '')}>×</button>
                  </span>
                )}
                {(filters.priceMin > 0 || filters.priceMax < 50000) && (
                  <span className="filter-chip">
                    Price: ${filters.priceMin}-${filters.priceMax}
                    <button onClick={() => removeFilter('price', '')}>×</button>
                  </span>
                )}
                {filters.inStockOnly && (
                  <span className="filter-chip">
                    In Stock
                    <button onClick={() => removeFilter('stock', '')}>×</button>
                  </span>
                )}
                {filters.searchQuery.trim() !== '' && (
                  <span className="filter-chip">
                    Search: "{filters.searchQuery}"
                    <button onClick={() => removeFilter('search', '')}>×</button>
                  </span>
                )}
              </div>
            )}

            {/* Products Header */}
            <div className="products-header">
              <h2>Available Parts</h2>
              <span className="products-count">
                Showing {filteredProducts.length} of {allProducts.length} parts
              </span>
            </div>

            {/* Products Grid or Empty State */}
            {isLoadingProducts ? (
              <div className="empty-state">
                <div className="empty-state-icon">⏳</div>
                <h3>Loading products...</h3>
                <p>Please wait while we fetch the latest inventory</p>
              </div>
            ) : productsError ? (
              <div className="empty-state">
                <div className="empty-state-icon">❌</div>
                <h3>Error loading products</h3>
                <p>{productsError}</p>
                <button onClick={() => window.location.reload()} className="clear-filters-cta">
                  Try Again
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No parts found</h3>
                <p>Try adjusting your filters or search query</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="clear-filters-cta">
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product: Product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <span className="product-icon">{product.image}</span>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-model">{product.model} {product.modelYear && `(${product.modelYear})`}</p>
                    <p className="product-description">{product.description}</p>
                    <div className="product-details">
                      <span className="product-price">LKR {product.price.toLocaleString()}</span>
                      <span className="product-stock">
                        Stock: {product.quantityAvailable}
                      </span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="add-to-cart-btn"
                      disabled={product.quantityAvailable === 0}
                    >
                      {product.quantityAvailable > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </section>

          {/* Cart Sidebar */}
          {showCart && (
            <aside className="cart-sidebar">
              <div className="cart-header">
                <h3>Shopping Cart</h3>
                <button 
                  onClick={() => setShowCart(false)} 
                  className="close-cart"
                >
                  ×
                </button>
              </div>
              
              <div className="cart-items">
                {cart.length === 0 ? (
                  <p className="empty-cart">Your cart is empty</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-icon">{item.image}</span>
                        <div>
                          <h4>{item.name}</h4>
                          <p>{item.model}</p>
                          <span className="cart-item-price">LKR {item.price.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                          disabled={item.quantity >= item.quantityAvailable}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="cart-footer">
                  <div className="cart-total">
                    <strong>Total: LKR {getTotalPrice().toLocaleString()}</strong>
                  </div>
                  <button onClick={handleCheckout} className="checkout-btn">
                    Checkout
                  </button>
                </div>
              )}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};

export default Shop;