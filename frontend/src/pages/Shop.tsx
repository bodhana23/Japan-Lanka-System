import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
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

  // Vehicle parts inventory for demo - Sri Lankan realistic data with enhanced filtering data
  const allProducts: Product[] = useMemo(() => [
    {
      id: 'P001',
      name: 'Brake Pads Set',
      model: 'Camry',
      modelYear: '2018-2023',
      price: 8500.00,
      quantityAvailable: 25,
      category: 'Brake System',
      image: '🔧',
      description: 'High-quality ceramic brake pads set (front) for Toyota Camry 2018-2023. Includes installation kit.',
      brand: 'Toyota',
      yearFrom: 2018,
      yearTo: 2023
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      model: 'Civic',
      modelYear: '2016-2021',
      price: 1800.00,
      quantityAvailable: 40,
      category: 'Engine Parts',
      image: '⚙️',
      description: 'Premium oil filter for Honda Civic 2016-2021. OEM quality replacement part.',
      brand: 'Honda',
      yearFrom: 2016,
      yearTo: 2021
    },
    {
      id: 'P003',
      name: 'LED Headlight Bulbs',
      model: '3 Series',
      modelYear: '2019-2024',
      price: 12500.00,
      quantityAvailable: 15,
      category: 'Lighting',
      image: '💡',
      description: 'High-intensity LED headlight bulb set for BMW 3 Series 2019-2024. 6000K white light.',
      brand: 'BMW',
      yearFrom: 2019,
      yearTo: 2024
    },
    {
      id: 'P004',
      name: 'Air Filter',
      model: 'Leaf',
      modelYear: '2018-2023',
      price: 2200.00,
      quantityAvailable: 30,
      category: 'Engine Parts',
      image: '🌪️',
      description: 'High-flow air filter for Nissan Leaf 2018-2023. Improves engine performance.',
      brand: 'Nissan',
      yearFrom: 2018,
      yearTo: 2023
    },
    {
      id: 'P005',
      name: 'Spark Plugs Set',
      model: 'Prius',
      modelYear: '2016-2022',
      price: 4500.00,
      quantityAvailable: 20,
      category: 'Engine Parts',
      image: '⚡',
      description: 'Iridium spark plugs set (4pc) for Toyota Prius 2016-2022. Long-lasting performance.',
      brand: 'Toyota',
      yearFrom: 2016,
      yearTo: 2022
    },
    {
      id: 'P006',
      name: 'Timing Belt Kit',
      model: 'Accord',
      modelYear: '2013-2017',
      price: 15500.00,
      quantityAvailable: 8,
      category: 'Engine Parts',
      image: '⏰',
      description: 'Complete timing belt kit for Honda Accord 2013-2017. Includes tensioner and pulleys.',
      brand: 'Honda',
      yearFrom: 2013,
      yearTo: 2017
    },
    {
      id: 'P007',
      name: 'Wiper Blade Set',
      model: 'Axio',
      modelYear: '2014-2021',
      price: 1200.00,
      quantityAvailable: 50,
      category: 'Accessories',
      image: '🌧️',
      description: 'Silicone wiper blade set for Toyota Axio 2014-2021. All-weather performance.',
      brand: 'Toyota',
      yearFrom: 2014,
      yearTo: 2021
    },
    {
      id: 'P008',
      name: 'Battery 12V 60Ah',
      model: 'Universal',
      modelYear: '2015-2025',
      price: 18500.00,
      quantityAvailable: 12,
      category: 'Electrical',
      image: '🔋',
      description: 'Maintenance-free car battery 12V 60Ah. 2-year warranty. Fits most Japanese vehicles.',
      brand: 'Universal',
      yearFrom: 2015,
      yearTo: 2025
    },
    {
      id: 'P009',
      name: 'Brake Discs Set',
      model: 'Altima',
      modelYear: '2015-2020',
      price: 14500.00,
      quantityAvailable: 18,
      category: 'Brake System',
      image: '⚙️',
      description: 'Front brake disc rotors for Nissan Altima 2015-2020. High-quality cast iron.',
      brand: 'Nissan',
      yearFrom: 2015,
      yearTo: 2020
    },
    {
      id: 'P010',
      name: 'Radiator',
      model: '3',
      modelYear: '2016-2022',
      price: 22500.00,
      quantityAvailable: 6,
      category: 'Cooling System',
      image: '🌡️',
      description: 'Aluminum radiator for Mazda 3 2016-2022. Efficient cooling performance.',
      brand: 'Mazda',
      yearFrom: 2016,
      yearTo: 2022
    },
    {
      id: 'P011',
      name: 'Clutch Kit',
      model: 'Focus',
      modelYear: '2012-2018',
      price: 18900.00,
      quantityAvailable: 4,
      category: 'Transmission',
      image: '⚙️',
      description: 'Complete clutch kit for Ford Focus 2012-2018. Includes pressure plate and disc.',
      brand: 'Ford',
      yearFrom: 2012,
      yearTo: 2018
    },
    {
      id: 'P012',
      name: 'Fuel Pump',
      model: 'Corolla',
      modelYear: '2014-2021',
      price: 9800.00,
      quantityAvailable: 0,
      category: 'Fuel System',
      image: '⛽',
      description: 'Electric fuel pump for Toyota Corolla 2014-2021. Reliable fuel delivery.',
      brand: 'Toyota',
      yearFrom: 2014,
      yearTo: 2021
    },
    {
      id: 'P013',
      name: 'Suspension Struts',
      model: '5 Series',
      modelYear: '2017-2023',
      price: 28500.00,
      quantityAvailable: 10,
      category: 'Suspension',
      image: '🔩',
      description: 'Front suspension strut assembly for BMW 5 Series 2017-2023. Premium ride quality.',
      brand: 'BMW',
      yearFrom: 2017,
      yearTo: 2023
    },
    {
      id: 'P014',
      name: 'Cabin Air Filter',
      model: 'CR-V',
      modelYear: '2017-2023',
      price: 1650.00,
      quantityAvailable: 35,
      category: 'Air System',
      image: '💨',
      description: 'HEPA cabin air filter for Honda CR-V 2017-2023. Filters dust and allergens.',
      brand: 'Honda',
      yearFrom: 2017,
      yearTo: 2023
    },
    {
      id: 'P015',
      name: 'Alternator',
      model: 'CX-5',
      modelYear: '2013-2019',
      price: 24500.00,
      quantityAvailable: 7,
      category: 'Electrical',
      image: '⚡',
      description: 'High-output alternator for Mazda CX-5 2013-2019. 120A capacity.',
      brand: 'Mazda',
      yearFrom: 2013,
      yearTo: 2019
    },
    {
      id: 'P016',
      name: 'Oxygen Sensor',
      model: 'Mustang',
      modelYear: '2015-2022',
      price: 8900.00,
      quantityAvailable: 2,
      category: 'Sensors',
      image: '📡',
      description: 'O2 sensor for Ford Mustang 2015-2022. Improves fuel efficiency.',
      brand: 'Ford',
      yearFrom: 2015,
      yearTo: 2022
    }
  ], []);

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
    
    navigate('/checkout');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
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
            <button onClick={handleBackToDashboard} className="back-btn">
              ← Back to Dashboard
            </button>
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
            {filteredProducts.length === 0 ? (
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
                    <p className="product-model">{product.model}</p>
                    <p className="product-year">Year: {product.modelYear}</p>
                    <p className="product-description">{product.description}</p>
                    <div className="product-details">
                      <span className="product-price">Rs. {product.price}</span>
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
                          <span className="cart-item-price">Rs. {item.price}</span>
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
                    <strong>Total: Rs. {getTotalPrice().toFixed(2)}</strong>
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