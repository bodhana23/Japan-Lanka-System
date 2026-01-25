import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import { productsApi, ordersApi, Product as ApiProduct, Order as ApiOrder } from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import {
  User, Package, Clock, RotateCcw, AlertTriangle, Search, Inbox,
  Store, Tag, Factory, Car, DollarSign, BarChart2, Image, Trash2, RefreshCw, X
} from 'lucide-react';
import './ManagerDashboard.css';

interface Product {
  id: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  quantity: number;
  imageLink: string;
}

interface ReturnRequest {
  id: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  itemName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  messages: { sender: string; message: string; timestamp: string }[];
}

interface CustomerOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'in_progress' | 'ready_to_pickup' | 'delivered';
  orderDate: string;
  deliveryAddress?: string;
  contactNumber: string;
}

interface UserProfile {
  email: string;
  name: string;
  role: string;
  password: string;
}

const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'returns'>('inventory');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  // Inventory filtering state
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [inventoryBrandFilter, setInventoryBrandFilter] = useState<string>('all');
  const [inventorySortBy, setInventorySortBy] = useState<'name_az' | 'name_za' | 'price_high' | 'price_low' | 'stock_high' | 'stock_low'>('name_az');

  // Order filtering state
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'ready_to_pickup' | 'delivered'>('all');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [orderSortBy, setOrderSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low' | 'name_az'>('newest');
  const [isFiltering, setIsFiltering] = useState(false);

  // User state
  const [user, setUser] = useState<UserProfile>({
    email: 'manager1@gmail.com',
    name: 'Manager User',
    role: 'Manager',
    password: 'manager@1'
  });

  // Product management state - fetched from API
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Customer orders state - fetched from API
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Return requests state - will be fetched from API when endpoint is available
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);

  // Fetch products from API
  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);
        const response = await productsApi.getProducts({ page_size: 100, include_inactive: true });
        if (isMounted) {
          const transformedProducts: Product[] = response.items.map((p: ApiProduct) => ({
            id: p.id,
            name: p.name,
            brand: p.brand,
            model: p.model,
            price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
            quantity: p.quantity_available,
            imageLink: p.image_url || ''
          }));
          setProducts(transformedProducts);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching products:', error);
          setProductsError('Failed to load products.');
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

  // Fetch orders from API
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        setOrdersError(null);
        const response = await ordersApi.getOrders({ page_size: 100 });
        if (isMounted) {
          const transformedOrders: CustomerOrder[] = response.items.map((o: ApiOrder) => ({
            id: o.id,
            customerName: o.customer_name || 'Unknown Customer',
            customerEmail: o.customer_email || '',
            items: o.items.map(item => ({
              name: item.product_name || `Product ${item.product_id}`,
              quantity: item.quantity,
              price: item.unit_price
            })),
            totalAmount: o.total_amount,
            status: o.status === 'confirmed' ? 'in_progress' : o.status as CustomerOrder['status'],
            orderDate: o.created_at,
            deliveryAddress: o.delivery_method === 'pickup' ? 'Self pickup from store' : (o.shipping_address || ''),
            contactNumber: o.customer_phone
          }));
          setCustomerOrders(transformedOrders);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching orders:', error);
          setOrdersError('Failed to load orders.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingOrders(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    brand: '',
    model: '',
    price: 0,
    quantity: 0,
    imageLink: ''
  });

  // Statistics calculations using useMemo
  const statistics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Count today's orders
    const todayOrders = customerOrders.filter(order => order.orderDate === today).length;
    
    // Count yesterday's orders for comparison
    const yesterdayOrders = customerOrders.filter(order => order.orderDate === yesterday).length;
    
    // Count pending orders
    const pendingOrders = customerOrders.filter(order => order.status === 'pending').length;
    
    // Count pending return requests
    const pendingReturns = returnRequests.filter(request => request.status === 'pending').length;
    
    // Count low stock items (quantity < 5)
    const lowStockItems = products.filter(product => product.quantity < 5).length;
    
    // Calculate comparison with yesterday
    const orderComparison = todayOrders - yesterdayOrders;
    
    return {
      todayOrders,
      yesterdayOrders,
      orderComparison,
      pendingOrders,
      pendingReturns,
      lowStockItems
    };
  }, [customerOrders, returnRequests, products]);

  // Debounced search with filtering simulation
  useEffect(() => {
    if (orderSearchQuery || orderStatusFilter !== 'all' || orderDateFrom || orderDateTo || orderSortBy !== 'newest') {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        setIsFiltering(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [orderSearchQuery, orderStatusFilter, orderDateFrom, orderDateTo, orderSortBy]);

  // Filtered and sorted orders using useMemo
  const filteredOrders = useMemo(() => {
    let filtered = [...customerOrders];

    // Apply search filter
    if (orderSearchQuery.trim()) {
      const query = orderSearchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === orderStatusFilter);
    }

    // Apply date range filter (using proper date comparison)
    if (orderDateFrom) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        const fromDate = new Date(orderDateFrom);
        return orderDate >= fromDate;
      });
    }
    if (orderDateTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        const toDate = new Date(orderDateTo);
        return toDate >= orderDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (orderSortBy) {
        case 'newest':
          return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
        case 'oldest':
          return new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
        case 'amount_high':
          return b.totalAmount - a.totalAmount;
        case 'amount_low':
          return a.totalAmount - b.totalAmount;
        case 'name_az':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [customerOrders, orderSearchQuery, orderStatusFilter, orderDateFrom, orderDateTo, orderSortBy]);

  // Count orders by status for filter chips
  const orderStatusCounts = useMemo(() => {
    return {
      all: customerOrders.length,
      pending: customerOrders.filter(o => o.status === 'pending').length,
      in_progress: customerOrders.filter(o => o.status === 'in_progress').length,
      ready_to_pickup: customerOrders.filter(o => o.status === 'ready_to_pickup').length,
      delivered: customerOrders.filter(o => o.status === 'delivered').length
    };
  }, [customerOrders]);

  // Filtered inventory products using useMemo
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Apply search filter
    if (inventorySearchQuery.trim()) {
      const query = inventorySearchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.id.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        product.model.toLowerCase().includes(query)
      );
    }

    // Apply stock level filter
    if (inventoryStockFilter !== 'all') {
      filtered = filtered.filter(product => {
        switch (inventoryStockFilter) {
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
    if (inventoryBrandFilter !== 'all') {
      filtered = filtered.filter(product => product.brand === inventoryBrandFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (inventorySortBy) {
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
  }, [products, inventorySearchQuery, inventoryStockFilter, inventoryBrandFilter, inventorySortBy]);

  // Get unique brands for filter dropdown
  const availableBrands = useMemo(() => {
    const brands = new Set(products.map(p => p.brand));
    return Array.from(brands).sort();
  }, [products]);

  // Count products by stock level for filter chips
  const inventoryStockCounts = useMemo(() => {
    return {
      all: products.length,
      in_stock: products.filter(p => p.quantity >= 10).length,
      low_stock: products.filter(p => p.quantity > 0 && p.quantity < 10).length,
      out_of_stock: products.filter(p => p.quantity === 0).length
    };
  }, [products]);

  // Check if any inventory filters are active
  const hasActiveInventoryFilters = inventorySearchQuery || inventoryStockFilter !== 'all' || inventoryBrandFilter !== 'all';

  // Clear all inventory filters
  const clearAllInventoryFilters = () => {
    setInventorySearchQuery('');
    setInventoryStockFilter('all');
    setInventoryBrandFilter('all');
    setInventorySortBy('name_az');
  };

  // Check if any filters are active
  const hasActiveFilters = orderSearchQuery || orderStatusFilter !== 'all' || orderDateFrom || orderDateTo;

  // Clear all filters
  const clearAllFilters = () => {
    setOrderSearchQuery('');
    setOrderStatusFilter('all');
    setOrderDateFrom('');
    setOrderDateTo('');
    setOrderSortBy('newest');
  };

  // Quick date filters
  const applyQuickDateFilter = (filter: 'today' | 'week' | 'month') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        setOrderDateFrom(todayStr);
        setOrderDateTo(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setOrderDateFrom(weekAgo.toISOString().split('T')[0]);
        setOrderDateTo(todayStr);
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        setOrderDateFrom(monthAgo.toISOString().split('T')[0]);
        setOrderDateTo(todayStr);
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.brand || !newProduct.model) {
      alert('Please fill in all required fields (name, brand, and model).');
      return;
    }
    
    if (newProduct.price <= 0) {
      alert('Price must be greater than 0.');
      return;
    }
    
    if (newProduct.quantity < 0) {
      alert('Quantity cannot be negative.');
      return;
    }
    
    const product: Product = {
      ...newProduct,
      id: `P${Date.now()}`
    };
    setProducts([...products, product]);
    setNewProduct({
      name: '',
      brand: '',
      model: '',
      price: 0,
      quantity: 0,
      imageLink: ''
    });
    setShowAddProduct(false);
    alert('Product added successfully!');
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setShowEditProduct(false);
    setSelectedProduct(null);
    alert('Product updated successfully!');
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setProducts(products.filter(p => p.id !== productId));
      setShowEditProduct(false);
      setSelectedProduct(null);
      alert('Product deleted successfully!');
    }
  };

  const handleReturnAction = (returnId: string, action: 'approved' | 'rejected', message?: string) => {
    setReturnRequests(prev => prev.map(req => {
      if (req.id === returnId) {
        const updatedMessages = message ? [
          ...req.messages,
          {
            sender: 'manager1',
            message: message,
            timestamp: new Date().toLocaleString()
          }
        ] : req.messages;
        
        return {
          ...req,
          status: action,
          messages: updatedMessages
        };
      }
      return req;
    }));
    
    setSelectedReturn(null);
    alert(`Return request ${action} successfully!`);
  };

  const handleSendMessage = (returnId: string, message: string) => {
    setReturnRequests(prev => prev.map(req => {
      if (req.id === returnId) {
        return {
          ...req,
          messages: [
            ...req.messages,
            {
              sender: 'manager1',
              message: message,
              timestamp: new Date().toLocaleString()
            }
          ]
        };
      }
      return req;
    }));
  };

  const handleOrderStatusUpdate = (orderId: string, newStatus: CustomerOrder['status']) => {
    setCustomerOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          status: newStatus
        };
      }
      return order;
    }));
    
    // Show success message
    const statusMessages = {
      'pending': 'Order marked as pending',
      'in_progress': 'Order marked as in progress',
      'ready_to_pickup': 'Order marked as ready for pickup',
      'delivered': 'Order marked as delivered'
    };
    
    alert(statusMessages[newStatus] || 'Order status updated');
  };

  // Check authentication on component mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(currentUser);
      
      // Validate user data structure
      if (!parsedUser || typeof parsedUser !== 'object' || !parsedUser.role || !parsedUser.email) {
        throw new Error('Invalid user data structure');
      }
      
      if (parsedUser.role !== 'manager') {
        console.warn('Unauthorized access attempt to manager dashboard');
        navigate('/');
        return;
      }
      
      // Update user state with parsed data if valid
      setUser(prevUser => ({
        ...prevUser,
        email: parsedUser.email || prevUser.email,
        name: parsedUser.name || parsedUser.fullName || prevUser.name,
        password: parsedUser.password || prevUser.password
      }));
      
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      try {
        localStorage.removeItem('currentUser');
      } catch (storageError) {
        console.error('Error removing corrupted user data:', storageError);
      }
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="manager-dashboard-container">
      <header className="manager-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises - Manager Portal</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.name}</span>
            <button
              className="profile-header-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <User size={16} className="profile-btn-icon" />
              <span className="profile-btn-text">Profile</span>
            </button>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* Profile Section - Conditionally Rendered */}
        

        {/* Statistics Overview Cards */}
        <div className="manager-stats-grid">
          {/* Orders Today Card */}
          <div className="stat-card orders-today">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-content">
              <h3 className="stat-number">{statistics.todayOrders}</h3>
              <p className="stat-label">Orders Today</p>
              <span className="stat-comparison positive">
                {statistics.orderComparison >= 0 ? '+' : ''}{statistics.orderComparison} from yesterday
              </span>
            </div>
          </div>

          {/* Pending Orders Card */}
          <div
            className="stat-card pending-orders clickable"
            onClick={() => setActiveTab('orders')}
            title="Click to view pending orders"
          >
            <div className="stat-icon"><Clock size={24} /></div>
            <div className="stat-content">
              <h3 className="stat-number">{statistics.pendingOrders}</h3>
              <p className="stat-label">Pending Orders</p>
              <span className="stat-hint">Click to view</span>
            </div>
          </div>

          {/* Pending Returns Card */}
          <div
            className="stat-card pending-returns clickable"
            onClick={() => setActiveTab('returns')}
            title="Click to view pending returns"
          >
            <div className="stat-icon"><RotateCcw size={24} /></div>
            <div className="stat-content">
              <h3 className="stat-number">{statistics.pendingReturns}</h3>
              <p className="stat-label">Pending Returns</p>
              <span className="stat-hint">Click to view</span>
            </div>
          </div>

          {/* Low Stock Items Card */}
          <div
            className="stat-card low-stock clickable"
            onClick={() => setActiveTab('inventory')}
            title="Click to view low stock items"
          >
            <div className="stat-icon"><AlertTriangle size={24} /></div>
            <div className="stat-content">
              <h3 className="stat-number">{statistics.lowStockItems}</h3>
              <p className="stat-label">Low Stock Items</p>
              <span className="stat-hint">Click to view</span>
            </div>
          </div>
        </div>

        <nav className="manager-tabs">
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Order Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            Return Requests
          </button>
        </nav>

        {activeTab === 'inventory' && (
          <div className="inventory-section">
            <div className="section-header">
              <h2>Product Inventory</h2>
              <button 
                className="add-product-btn"
                onClick={() => setShowAddProduct(true)}
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
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                />
                {inventorySearchQuery && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => setInventorySearchQuery('')}
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
                  className={`filter-chip ${inventoryStockFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setInventoryStockFilter('all')}
                >
                  All Products
                  <span className="chip-badge">{inventoryStockCounts.all}</span>
                </button>
                <button
                  className={`filter-chip ${inventoryStockFilter === 'in_stock' ? 'active' : ''}`}
                  onClick={() => setInventoryStockFilter('in_stock')}
                >
                  In Stock (≥10)
                  <span className="chip-badge">{inventoryStockCounts.in_stock}</span>
                </button>
                <button
                  className={`filter-chip ${inventoryStockFilter === 'low_stock' ? 'active' : ''}`}
                  onClick={() => setInventoryStockFilter('low_stock')}
                >
                  Low Stock (&lt;10)
                  <span className="chip-badge">{inventoryStockCounts.low_stock}</span>
                </button>
                <button
                  className={`filter-chip ${inventoryStockFilter === 'out_of_stock' ? 'active' : ''}`}
                  onClick={() => setInventoryStockFilter('out_of_stock')}
                >
                  Out of Stock
                  <span className="chip-badge">{inventoryStockCounts.out_of_stock}</span>
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
                    value={inventoryBrandFilter}
                    onChange={(e) => setInventoryBrandFilter(e.target.value)}
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
                    value={inventorySortBy}
                    onChange={(e) => setInventorySortBy(e.target.value as any)}
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
            {hasActiveInventoryFilters && (
              <div className="active-filters-summary">
                <div className="active-filters-tags">
                  {inventoryStockFilter !== 'all' && (
                    <span className="filter-tag">
                      Stock: {inventoryStockFilter.replace('_', ' ')}
                      <button onClick={() => setInventoryStockFilter('all')}>✕</button>
                    </span>
                  )}
                  {inventorySearchQuery && (
                    <span className="filter-tag">
                      Search: "{inventorySearchQuery}"
                      <button onClick={() => setInventorySearchQuery('')}>✕</button>
                    </span>
                  )}
                  {inventoryBrandFilter !== 'all' && (
                    <span className="filter-tag">
                      Brand: {inventoryBrandFilter}
                      <button onClick={() => setInventoryBrandFilter('all')}>✕</button>
                    </span>
                  )}
                </div>
                <button className="clear-all-filters-btn" onClick={clearAllInventoryFilters}>
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

            {/* Products Grid or Empty State */}
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Package size={48} /></div>
                <h3>No products found matching your filters</h3>
                <p>Try adjusting your search or filters</p>
                {hasActiveInventoryFilters && (
                  <button className="clear-filters-btn" onClick={clearAllInventoryFilters}>
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map(product => (
                  <div key={product.id} className="product-item">
                    <div className="product-image">
                      {product.imageLink ? (
                        <img src={product.imageLink} alt={product.name} onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextSibling) nextSibling.style.display = 'flex';
                        }} />
                      ) : null}
                      <div className="product-icon" style={{ display: product.imageLink ? 'none' : 'flex' }}><Store size={32} /></div>
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-brand">{product.brand}</p>
                      <p className="product-model">{product.model}</p>
                      <p className="product-price">Rs. {product.price.toLocaleString()}</p>
                      <p className="product-stock">Stock: {product.quantity} units</p>
                    </div>
                    <div className="product-actions">
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditProduct(product)}
                      >
                        Edit Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Customer Orders</h2>
            </div>

            {/* Search Bar */}
            <div className="order-search-container">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="order-search-input"
                  placeholder="Search by order ID, customer name, or email..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
                {orderSearchQuery && (
                  <button 
                    className="clear-search-btn"
                    onClick={() => setOrderSearchQuery('')}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="order-filters-row">
              {/* Status Filter Chips */}
              <div className="status-filter-chips">
                <button
                  className={`filter-chip ${orderStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('all')}
                >
                  All Orders
                  <span className="chip-badge">{orderStatusCounts.all}</span>
                </button>
                <button
                  className={`filter-chip ${orderStatusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('pending')}
                >
                  Pending
                  <span className="chip-badge">{orderStatusCounts.pending}</span>
                </button>
                <button
                  className={`filter-chip ${orderStatusFilter === 'in_progress' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('in_progress')}
                >
                  In Progress
                  <span className="chip-badge">{orderStatusCounts.in_progress}</span>
                </button>
                <button
                  className={`filter-chip ${orderStatusFilter === 'ready_to_pickup' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('ready_to_pickup')}
                >
                  Ready to Pickup
                  <span className="chip-badge">{orderStatusCounts.ready_to_pickup}</span>
                </button>
                <button
                  className={`filter-chip ${orderStatusFilter === 'delivered' ? 'active' : ''}`}
                  onClick={() => setOrderStatusFilter('delivered')}
                >
                  Delivered
                  <span className="chip-badge">{orderStatusCounts.delivered}</span>
                </button>
              </div>

              {/* Date and Sort Filters */}
              <div className="date-sort-filters">
                {/* Quick Date Filters */}
                <div className="quick-date-filters">
                  <button 
                    className="quick-filter-btn"
                    onClick={() => applyQuickDateFilter('today')}
                    title="Show today's orders"
                  >
                    Today
                  </button>
                  <button 
                    className="quick-filter-btn"
                    onClick={() => applyQuickDateFilter('week')}
                    title="Show last 7 days"
                  >
                    Last 7 Days
                  </button>
                  <button 
                    className="quick-filter-btn"
                    onClick={() => applyQuickDateFilter('month')}
                    title="Show last 30 days"
                  >
                    Last 30 Days
                  </button>
                </div>

                {/* Custom Date Range */}
                <div className="date-range-filter">
                  <input
                    type="date"
                    className="date-input"
                    value={orderDateFrom}
                    onChange={(e) => setOrderDateFrom(e.target.value)}
                    placeholder="From Date"
                  />
                  <span className="date-separator">to</span>
                  <input
                    type="date"
                    className="date-input"
                    value={orderDateTo}
                    onChange={(e) => setOrderDateTo(e.target.value)}
                    placeholder="To Date"
                  />
                  {(orderDateFrom || orderDateTo) && (
                    <button 
                      className="clear-dates-btn"
                      onClick={() => {
                        setOrderDateFrom('');
                        setOrderDateTo('');
                      }}
                      title="Clear dates"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="sort-filter">
                  <label htmlFor="order-sort">Sort by:</label>
                  <select
                    id="order-sort"
                    className="sort-select"
                    value={orderSortBy}
                    onChange={(e) => setOrderSortBy(e.target.value as any)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount_high">Amount: High to Low</option>
                    <option value="amount_low">Amount: Low to High</option>
                    <option value="name_az">Customer Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="active-filters-summary">
                <div className="active-filters-tags">
                  {orderStatusFilter !== 'all' && (
                    <span className="filter-tag">
                      Status: {orderStatusFilter.replace('_', ' ')}
                      <button onClick={() => setOrderStatusFilter('all')}>✕</button>
                    </span>
                  )}
                  {orderSearchQuery && (
                    <span className="filter-tag">
                      Search: "{orderSearchQuery}"
                      <button onClick={() => setOrderSearchQuery('')}>✕</button>
                    </span>
                  )}
                  {(orderDateFrom || orderDateTo) && (
                    <span className="filter-tag">
                      Date: {orderDateFrom || '...'} to {orderDateTo || '...'}
                      <button onClick={() => {
                        setOrderDateFrom('');
                        setOrderDateTo('');
                      }}>✕</button>
                    </span>
                  )}
                </div>
                <button className="clear-all-filters-btn" onClick={clearAllFilters}>
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Results Count */}
            <div className="results-count">
              {isFiltering ? (
                <span className="filtering-indicator"><RefreshCw size={14} className="spin" /> Filtering...</span>
              ) : (
                <span>
                  Showing <strong>{filteredOrders.length}</strong> of <strong>{customerOrders.length}</strong> orders
                </span>
              )}
            </div>
            
            {/* Orders Grid or Empty State */}
            {filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Inbox size={48} /></div>
                <h3>No orders found matching your filters</h3>
                <p>Try adjusting your search criteria or filters</p>
                {hasActiveFilters && (
                  <button className="clear-filters-btn" onClick={clearAllFilters}>
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-info">
                        <h3 className="order-id">Order #{order.id}</h3>
                        <p className="customer-name">{order.customerName}</p>
                        <p className="order-date">{formatDateTime(order.orderDate)}</p>
                      </div>
                      <div className="order-status">
                        <select 
                          value={order.status} 
                          onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value as CustomerOrder['status'])}
                          className={`status-dropdown ${order.status}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="ready_to_pickup">Ready to Pickup</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="order-items">
                      <h4>Items:</h4>
                      <ul className="items-list">
                        {order.items.map((item, index) => (
                          <li key={index} className="item-row">
                            <span className="item-name">{item.name}</span>
                            <span className="item-quantity">Qty: {item.quantity}</span>
                            <span className="item-price">Rs. {item.price.toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="order-details">
                      <div className="detail-row">
                        <span className="detail-label">Total Amount:</span>
                        <span className="detail-value total-amount">Rs. {order.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Contact:</span>
                        <span className="detail-value">{order.contactNumber}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{order.customerEmail}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Delivery:</span>
                        <span className="detail-value">{order.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="returns-section">
            <h2>Return Requests</h2>
            <div className="returns-grid">
              {returnRequests.map(request => (
                <div key={request.id} className="return-item">
                  <div className="return-header">
                    <div className="return-id">Return #{request.id}</div>
                    <span className={`status-badge ${request.status}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="return-details">
                    <p><strong>Customer:</strong> {request.customerName}</p>
                    <p><strong>Order:</strong> {request.orderNumber}</p>
                    <p><strong>Item:</strong> {request.itemName}</p>
                    <p><strong>Reason:</strong> {request.reason}</p>
                    <p><strong>Date:</strong> {request.requestDate}</p>
                  </div>
                  <div className="return-actions">
                    <button 
                      className="view-chat-btn"
                      onClick={() => setSelectedReturn(request)}
                    >
                      View Details & Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="close-modal">×</button>
            </div>
            <form className="add-product-form">
              <div className="form-group">
                <label>Product Name:</label>
                <input 
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-group">
                <label>Brand:</label>
                <input 
                  type="text"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  placeholder="Enter brand name"
                />
              </div>
              <div className="form-group">
                <label>Model:</label>
                <input 
                  type="text"
                  value={newProduct.model}
                  onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                  placeholder="Enter model"
                />
              </div>
              <div className="form-group">
                <label>Price (Rs.):</label>
                <input 
                  type="number"
                  min="0"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  placeholder="Enter price"
                />
              </div>
              <div className="form-group">
                <label>Quantity:</label>
                <input 
                  type="number"
                  min="0"
                  value={newProduct.quantity || ''}
                  onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                  placeholder="Enter quantity"
                />
              </div>
              <div className="form-group">
                <label>Image Link:</label>
                <input 
                  type="url"
                  value={newProduct.imageLink}
                  onChange={(e) => setNewProduct({...newProduct, imageLink: e.target.value})}
                  placeholder="Enter image URL (optional)"
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={handleAddProduct} className="save-btn">Add Product</button>
                <button type="button" onClick={() => setShowAddProduct(false)} className="cancel-btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          roleLabel="Manager"
        />
      )}

      {/* Edit Product Modal */}
      {showEditProduct && selectedProduct && (
        <EditProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditProduct(false);
            setSelectedProduct(null);
          }}
          onSave={handleUpdateProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      {/* Return Chat Modal */}
      {selectedReturn && (
        <ReturnChatModal
          returnRequest={selectedReturn}
          onClose={() => setSelectedReturn(null)}
          onAction={handleReturnAction}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
};

// Edit Product Modal Component
const EditProductModal: React.FC<{
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete: (productId: string) => void;
}> = ({ product, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Product>(product);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Product name must be at least 2 characters long';
    }

    if (!formData.brand || formData.brand.trim().length < 2) {
      newErrors.brand = 'Brand must be at least 2 characters long';
    }

    if (!formData.model || formData.model.trim().length < 1) {
      newErrors.model = 'Model is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof Product, value: string | number) => {
    setFormData({...formData, [field]: value});
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  const handleDelete = () => {
    onDelete(product.id);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-product-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="product-icon-header"><Package size={24} /></div>
            <h2>Edit Product</h2>
          </div>
          <button onClick={onClose} className="close-modal">×</button>
        </div>

        <div className="edit-product-form">
          <div className="form-group">
            <label htmlFor="productName">
              <Tag size={16} className="label-icon" />
              Product Name *
            </label>
            <input
              id="productName"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter product name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">
                <Factory size={16} className="label-icon" />
                Brand *
              </label>
              <input
                id="brand"
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                placeholder="Enter brand name"
                className={errors.brand ? 'error' : ''}
              />
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="model">
                <Car size={16} className="label-icon" />
                Model *
              </label>
              <input
                id="model"
                type="text"
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="Enter model"
                className={errors.model ? 'error' : ''}
              />
              {errors.model && <span className="error-message">{errors.model}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">
                <DollarSign size={16} className="label-icon" />
                Price (Rs.) *
              </label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', Number(e.target.value))}
                placeholder="Enter price"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">
                <BarChart2 size={16} className="label-icon" />
                Quantity *
              </label>
              <input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity || ''}
                onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                placeholder="Enter quantity"
                className={errors.quantity ? 'error' : ''}
              />
              {errors.quantity && <span className="error-message">{errors.quantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="imageLink">
              <Image size={16} className="label-icon" />
              Image Link
            </label>
            <input
              id="imageLink"
              type="url"
              value={formData.imageLink}
              onChange={(e) => handleInputChange('imageLink', e.target.value)}
              placeholder="Enter image URL (optional)"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="save-btn">
              Save Changes
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="button" onClick={handleDelete} className="delete-btn-modal">
              <Trash2 size={16} /> Delete Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



// Return Chat Modal Component
const ReturnChatModal: React.FC<{
  returnRequest: ReturnRequest;
  onClose: () => void;
  onAction: (returnId: string, action: 'approved' | 'rejected', message?: string) => void;
  onSendMessage: (returnId: string, message: string) => void;
}> = ({ returnRequest, onClose, onAction, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(returnRequest.id, newMessage);
      setNewMessage('');
    }
  };

  const handleAction = (action: 'approved' | 'rejected') => {
    onAction(returnRequest.id, action, actionMessage || undefined);
    setActionMessage('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content chat-modal">
        <div className="modal-header">
          <h2>Return Request #{returnRequest.id}</h2>
          <button onClick={onClose} className="close-modal">×</button>
        </div>
        
        <div className="return-info">
          <h4>Request Details</h4>
          <p><strong>Customer:</strong> {returnRequest.customerName}</p>
          <p><strong>Email:</strong> {returnRequest.customerEmail}</p>
          <p><strong>Order:</strong> {returnRequest.orderNumber}</p>
          <p><strong>Item:</strong> {returnRequest.itemName}</p>
          <p><strong>Reason:</strong> {returnRequest.reason}</p>
          <p><strong>Status:</strong> <span className={`status-badge ${returnRequest.status}`}>{returnRequest.status.toUpperCase()}</span></p>
        </div>

        <div className="chat-section">
          <h4>Communication</h4>
          <div className="chat-messages">
            {returnRequest.messages && returnRequest.messages.length > 0 ? (
              returnRequest.messages.map((msg, index) => {
                // Ensure msg exists and has required properties
                if (!msg || typeof msg !== 'object') {
                  return null;
                }
                return (
                  <div key={`${returnRequest.id}-${index}`} className={`message ${msg.sender === 'manager1' ? 'manager' : 'customer'}`}>
                    <div className="message-sender">{msg.sender || 'Unknown'}</div>
                    <div className="message-content">{msg.message || ''}</div>
                    <div className="message-time">{msg.timestamp || ''}</div>
                  </div>
                );
              })
            ) : (
              <div className="no-messages">No messages yet</div>
            )}
          </div>

          <div className="chat-input">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <button onClick={handleSendMessage} className="send-btn">Send</button>
          </div>
        </div>

        {returnRequest.status === 'pending' && (
          <div className="action-section">
            <h4>Take Action</h4>
            <div className="form-group">
              <label>Response Message (Optional):</label>
              <textarea 
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Add a message with your decision..."
              />
            </div>
            <div className="action-buttons">
              <button 
                onClick={() => handleAction('approved')} 
                className="approve-btn"
              >
                Approve Return
              </button>
              <button 
                onClick={() => handleAction('rejected')} 
                className="reject-btn"
              >
                Reject Return
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;