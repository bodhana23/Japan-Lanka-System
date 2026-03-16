import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productsApi, Product as ApiProduct } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import { 
  ShoppingCart, Filter, Search, Package, X, 
  ArrowLeft, Tag, Calendar, CheckCircle,
  AlertCircle, RefreshCw
} from 'lucide-react';
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
  const { isAuthenticated } = useAuth();
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

  // Products state - fetched from API
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);
        const response = await productsApi.getProducts({ page_size: 100 });
        if (isMounted) {
          // Transform API products to match the Product interface
          const transformedProducts: Product[] = response.items.map((p: ApiProduct) => ({
            id: p.id,
            name: p.name || '',
            model: p.model || '',
            modelYear: p.year_from && p.year_to ? `${p.year_from}-${p.year_to}` : '',
            price: Number(p.price) || 0,
            quantityAvailable: Number(p.quantity_available) || 0,
            category: p.category || '',
            image: p.image_url || '',
            description: p.description || '',
            brand: p.brand || '',
            yearFrom: p.year_from,
            yearTo: p.year_to,
            discountPercentage: p.discount_percentage != null ? Number(p.discount_percentage) : undefined,
            effectivePrice: p.effective_price != null ? Number(p.effective_price) : undefined,
          }));
          setAllProducts(transformedProducts);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching products:', error);
          setProductsError('Failed to load products. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
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

    if (!isAuthenticated) {
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
          <div className="header-left">
            {isAuthenticated ? (
              <button onClick={handleBackToDashboard} className="back-btn">
                <ArrowLeft size={16} />
                <span>Dashboard</span>
              </button>
            ) : (
              <button onClick={handleBackToHome} className="back-btn">
                <ArrowLeft size={16} />
                <span>Home</span>
              </button>
            )}
            <h1>Browse <span className="header-title-accent">Auto Parts</span></h1>
          </div>
          <div className="header-actions">
            <button
              className="mobile-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="filter-count-badge">{activeFilterCount}</span>
              )}
            </button>
            <NotificationBell />
            <button
              onClick={() => setShowCart(!showCart)}
              className="cart-btn"
            >
              <ShoppingCart size={17} />
              <span>Cart</span>
              {getTotalItems() > 0 && (
                <span className="cart-badge">{getTotalItems()}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="shop-main">
        <div className="shop-layout">
          {/* Filter Sidebar */}
          <aside className={`filter-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filter-header">
              <div className="filter-title">
                <Filter size={20} />
                <h3>Filters</h3>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={clearAllFilters} className="clear-filters-btn">
                  <X size={16} />
                  Clear All ({activeFilterCount})
                </button>
              )}
            </div>

            {/* Search Filter */}
            <div className="filter-section">
              <label className="filter-label">Search Parts</label>
              <div className="filter-search-wrapper">
                <Search size={15} className="filter-search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, brand…"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="filter-search-input"
                />
              </div>
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
                    <span>{brand}</span>
                    <span className="brand-count">{count}</span>
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
              <label className="filter-label">Price Range</label>
              <div className="price-range-display">
                <span>RS {filters.priceMin.toLocaleString()}</span>
                <span>RS {filters.priceMax.toLocaleString()}</span>
              </div>
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

          {/* Products Section */}
          <section className="products-section">
            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="active-filters">
                <span className="active-filters-label">
                  <Filter size={16} />
                  Active Filters:
                </span>
                {filters.brands.map(brand => (
                  <span key={brand} className="filter-chip">
                    <Tag size={14} />
                    {brand}
                    <button onClick={() => removeFilter('brand', brand)} aria-label={`Remove ${brand} brand filter`}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {filters.models.map(model => (
                  <span key={model} className="filter-chip">
                    <Tag size={14} />
                    {model}
                    <button onClick={() => removeFilter('model', model)} aria-label={`Remove ${model} model filter`}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {(filters.yearFrom !== null || filters.yearTo !== null) && (
                  <span className="filter-chip">
                    <Calendar size={14} />
                    Year: {filters.yearFrom || '2010'}-{filters.yearTo || '2025'}
                    <button onClick={() => removeFilter('year', '')} aria-label="Remove year range filter">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {(filters.priceMin > 0 || filters.priceMax < 50000) && (
                  <span className="filter-chip">
                    <Tag size={14} />
                    Price: RS {filters.priceMin}-RS {filters.priceMax}
                    <button onClick={() => removeFilter('price', '')} aria-label="Remove price range filter">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.inStockOnly && (
                  <span className="filter-chip">
                    <CheckCircle size={14} />
                    In Stock
                    <button onClick={() => removeFilter('stock', '')} aria-label="Remove in-stock filter">
                      <X size={14} />
                    </button>
                  </span>
                )}
                {filters.searchQuery.trim() !== '' && (
                  <span className="filter-chip">
                    <Search size={14} />
                    "{filters.searchQuery}"
                    <button onClick={() => removeFilter('search', '')} aria-label="Remove search filter">
                      <X size={14} />
                    </button>
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
                <div className="empty-state-icon">
                  <RefreshCw size={32} />
                </div>
                <h3>Loading products…</h3>
                <p>Please wait while we fetch the latest inventory</p>
              </div>
            ) : productsError ? (
              <div className="empty-state error-state">
                <div className="empty-state-icon">
                  <AlertCircle size={32} />
                </div>
                <h3>Error loading products</h3>
                <p>{productsError}</p>
                <button onClick={() => window.location.reload()} className="clear-filters-cta">
                  <RefreshCw size={16} />
                  Try Again
                </button>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Search size={32} />
                </div>
                <h3>No parts found</h3>
                <p>Try adjusting your filters or search query</p>
                {activeFilterCount > 0 && (
                  <button onClick={clearAllFilters} className="clear-filters-cta">
                    <X size={16} />
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product: Product) => (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="product-img"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`no-image-placeholder ${product.image ? 'hidden' : ''}`}>
                      <Package size={40} />
                    </div>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-brand">{product.brand}</p>
                    <p className="product-model">{product.model} {product.modelYear && `(${product.modelYear})`}</p>
                    <p className="product-description">{product.description}</p>
                    <div className="product-details">
                      <div className="product-price-wrapper">
                        {product.discountPercentage && product.discountPercentage > 0 ? (
                          <>
                            <span className="product-price-original">RS {product.price.toLocaleString()}</span>
                            <span className="product-price-discounted">
                              RS {(product.effectivePrice ?? product.price).toLocaleString()}
                            </span>
                            <span className="product-discount-badge">
                              -{product.discountPercentage}% OFF
                            </span>
                          </>
                        ) : (
                          <span className="product-price">RS {product.price.toLocaleString()}</span>
                        )}
                      </div>
                      <span className={`product-stock ${product.quantityAvailable === 0 ? 'out-of-stock' : ''}`}>
                        {product.quantityAvailable > 0 ? (
                          <>
                            <CheckCircle size={16} />
                            Stock: {product.quantityAvailable}
                          </>
                        ) : (
                          <>
                            <AlertCircle size={16} />
                            Out of Stock
                          </>
                        )}
                      </span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="add-to-cart-btn"
                      disabled={product.quantityAvailable === 0}
                    >
                      <ShoppingCart size={18} />
                      {product.quantityAvailable > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
              </div>
            )}
          </section>

          {/* Cart Sidebar - removed from here, moved outside shop-layout */}
        </div>
      </main>

      {/* Cart Sidebar - rendered at top level so it's not trapped in a stacking context */}
      {showCart && (
        <>
          <div className="cart-overlay" onClick={() => setShowCart(false)} />
          <aside className="cart-sidebar">
            <div className="cart-header">
              <div className="cart-header-title">
                <ShoppingCart size={20} />
                <h3>Shopping Cart</h3>
              </div>
              <button
                onClick={() => setShowCart(false)}
                className="close-cart"
                aria-label="Close shopping cart"
              >
                <X size={17} />
              </button>
            </div>
            
            <div className="cart-items">
              {cart.length === 0 ? (
                <div className="empty-cart">
                  <ShoppingCart size={40} />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-image">
                        {item.image ? (
                          <img src={item.image} alt={item.name} />
                        ) : (
                          <Package size={22} />
                        )}
                      </div>
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p className="cart-item-model">{item.model}</p>
                        <span className="cart-item-price">
                          RS {item.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn"
                        disabled={item.quantity >= item.quantityAvailable}
                        aria-label="Increase quantity"
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
                  <span>Total:</span>
                  <strong>RS {getTotalPrice().toLocaleString()}</strong>
                </div>
                <button onClick={handleCheckout} className="checkout-btn">
                  <ShoppingCart size={17} />
                  Proceed to Checkout
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
};

export default Shop;