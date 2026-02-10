import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig, DashboardUser } from '../components/shared';
import {
  Package, ClipboardList, RotateCcw, User, Store,
  Search, Plus, Minus, Trash2, ShoppingCart, Check, AlertCircle, X,
  UserCircle, Phone
} from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';
import { productsApi, ordersApi, Product, CreateOfflineSaleRequest } from '../services/api';
import './OfflineSales.css';

// Navigation item IDs for Manager Dashboard (same as ManagerDashboard)
type ManagerNavId = 'inventory' | 'orders' | 'returns' | 'profile' | 'offline-sales';

// Map nav IDs to URL paths (consistent with ManagerDashboard)
const navIdToPath: Record<ManagerNavId, string> = {
  'inventory': '/manager/inventory',
  'orders': '/manager/orders',
  'offline-sales': '/manager/offline-sales',
  'returns': '/manager/returns',
  'profile': '/manager/profile',
};

// Sale item type for the current sale
interface SaleItem {
  product_id: string;
  product_name: string;
  brand: string;
  available_stock: number;
  quantity: number;
  unit_price: number;
}

const OfflineSales: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [activeNav] = useState<ManagerNavId>('offline-sales');

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Sale items state
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState('');

  // Customer info state (name required, phone optional)
  const [customerName, setCustomerName] = useState('');
  const [customerNameError, setCustomerNameError] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Navigation items for Manager Dashboard
  const navItems: NavItem<ManagerNavId>[] = useMemo(() => [
    { id: 'inventory', label: 'Inventory Management', icon: <Package size={20} /> },
    { id: 'orders', label: 'Order Management', icon: <ClipboardList size={20} /> },
    { id: 'offline-sales', label: 'Offline Sales', icon: <Store size={20} /> },
    { id: 'returns', label: 'Return Requests', icon: <RotateCcw size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
  ], []);

  // Role configuration for Manager
  const roleConfig: RoleConfig = useMemo(() => ({
    role: 'manager',
    ...roleConfigs.manager,
  }), []);

  // Dashboard user for layout - try authUser first, then localStorage
  const dashboardUser: DashboardUser | undefined = useMemo(() => {
    // First try authUser from context
    if (authUser && authUser.full_name) {
      return {
        email: authUser.email,
        full_name: authUser.full_name,
        role: authUser.role,
      };
    }

    // Fallback to localStorage (for employee logins)
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        return {
          email: parsed.email || '',
          full_name: parsed.full_name || parsed.name || 'Manager',
          role: parsed.role || 'manager',
        };
      }
    } catch {
      // Ignore parse errors
    }

    return undefined;
  }, [authUser]);

  // Check authentication on component mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(currentUser);

      if (!parsedUser || typeof parsedUser !== 'object' || !parsedUser.role || !parsedUser.email) {
        throw new Error('Invalid user data structure');
      }

      if (parsedUser.role !== 'manager') {
        console.warn('Unauthorized access attempt to offline sales page');
        navigate('/');
        return;
      }
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

  // Fetch products based on search query
  const fetchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setShowProductDropdown(false);
      return;
    }

    setIsLoadingProducts(true);
    try {
      const response = await productsApi.getProducts({
        search: query,
        page_size: 10,
      });
      // Filter to only show active products with available stock
      const availableProducts = response.items.filter(
        (p) => p.is_active && p.quantity_available > 0
      );
      setProducts(availableProducts);
      setShowProductDropdown(availableProducts.length > 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchProducts]);

  // Navigation handler - always use URL navigation (consistent with ManagerDashboard)
  const handleNavigation = (navId: ManagerNavId) => {
    const path = navIdToPath[navId];
    if (path) {
      navigate(path);
    }
  };

  // Add product to sale
  const handleAddProduct = (product: Product) => {
    // Check if product already in sale items
    if (saleItems.some((item) => item.product_id === product.id)) {
      showToastMessage('Product already added to sale', 'warning');
      return;
    }

    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

    const newItem: SaleItem = {
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      available_stock: product.quantity_available,
      quantity: 1,
      unit_price: price,
    };

    setSaleItems([...saleItems, newItem]);
    setSearchQuery('');
    setProducts([]);
    setShowProductDropdown(false);
  };

  // Update item quantity
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setSaleItems((items) =>
      items.map((item) => {
        if (item.product_id === productId) {
          // Ensure quantity is within valid bounds
          const validQuantity = Math.max(1, Math.min(newQuantity, item.available_stock));
          return { ...item, quantity: validQuantity };
        }
        return item;
      })
    );
  };

  // Update unit price
  const handlePriceChange = (productId: string, newPrice: number) => {
    setSaleItems((items) =>
      items.map((item) => {
        if (item.product_id === productId) {
          // Ensure price is non-negative
          const validPrice = Math.max(0, newPrice);
          return { ...item, unit_price: validPrice };
        }
        return item;
      })
    );
  };

  // Remove item from sale
  const handleRemoveItem = (productId: string) => {
    setSaleItems((items) => items.filter((item) => item.product_id !== productId));
  };

  // Calculate totals
  const subtotal = useMemo(() => {
    return saleItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  }, [saleItems]);

  const totalItems = useMemo(() => {
    return saleItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [saleItems]);

  // Show toast helper
  const showToastMessage = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Validate Sri Lankan phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone.trim()) {
      setPhoneError('');
      return true; // Empty is valid (optional field)
    }
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    // Sri Lankan format: 10 digits starting with 0
    if (!/^0\d{9}$/.test(cleaned)) {
      setPhoneError('Phone must be 10 digits starting with 0 (e.g., 0771234567)');
      return false;
    }
    setPhoneError('');
    return true;
  };

  // Handle phone input change with validation
  const handlePhoneChange = (value: string) => {
    setCustomerPhone(value);
    if (value.trim()) {
      validatePhoneNumber(value);
    } else {
      setPhoneError('');
    }
  };

  // Handle customer name change with validation
  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    if (value.trim()) {
      setCustomerNameError('');
    }
  };

  // Submit offline sale
  const handleSubmitSale = async () => {
    if (saleItems.length === 0) {
      showToastMessage('Please add at least one item to the sale', 'error');
      return;
    }

    // Validate customer name (required)
    if (!customerName.trim()) {
      setCustomerNameError('Customer name is required');
      showToastMessage('Please enter customer name', 'error');
      return;
    }

    // Validate phone if provided
    if (customerPhone.trim() && !validatePhoneNumber(customerPhone)) {
      showToastMessage('Please enter a valid phone number', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateOfflineSaleRequest = {
        items: saleItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        notes: notes.trim() || undefined,
        // Customer name is required, phone is optional
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || undefined,
      };

      await ordersApi.createOfflineSale(payload);
      showToastMessage('Offline sale completed successfully', 'success');

      // Clear form
      setSaleItems([]);
      setNotes('');
      setSearchQuery('');
      setCustomerName('');
      setCustomerPhone('');
      setPhoneError('');

    } catch (error: unknown) {
      console.error('Error creating offline sale:', error);
      // Extract error message from response
      let errorMessage = 'Failed to create offline sale';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        if (axiosError.response?.data?.detail) {
          errorMessage = axiosError.response.data.detail;
        }
      }
      showToastMessage(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear entire sale
  const handleClearSale = () => {
    setSaleItems([]);
    setNotes('');
    setSearchQuery('');
    setCustomerName('');
    setCustomerNameError('');
    setCustomerPhone('');
    setPhoneError('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.product-search-container')) {
        setShowProductDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DashboardLayout<ManagerNavId>
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={handleNavigation}
      roleConfig={roleConfig}
      user={dashboardUser}
    >
      <div className="offline-sales-container">
        <div className="offline-sales-header">
          <div className="header-icon">
            <Store size={32} />
          </div>
          <div className="header-text">
            <h1>Offline Sales</h1>
            <p>Record walk-in or phone orders</p>
          </div>
        </div>

        <div className="offline-sales-content">
          {/* Product Search Section */}
          <div className="product-search-section">
            <h2>
              <Search size={20} />
              Search Products
            </h2>
            <div className="product-search-container">
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, brand, or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="product-search-input"
                />
                {isLoadingProducts && (
                  <div className="search-loading">
                    <div className="loading-spinner-small"></div>
                  </div>
                )}
              </div>

              {/* Product Dropdown */}
              {showProductDropdown && (
                <div className="product-dropdown">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="product-dropdown-item"
                      onClick={() => handleAddProduct(product)}
                    >
                      <div className="product-dropdown-info">
                        <span className="product-dropdown-name">{product.name}</span>
                        <span className="product-dropdown-brand">{product.brand}</span>
                      </div>
                      <div className="product-dropdown-meta">
                        <span className="product-dropdown-stock">
                          {product.quantity_available} in stock
                        </span>
                        <span className="product-dropdown-price">
                          LKR {typeof product.price === 'string'
                            ? parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })
                            : product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Plus size={18} className="product-dropdown-add" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sale Items Section */}
          <div className="sale-items-section">
            <div className="sale-items-header">
              <h2>
                <ShoppingCart size={20} />
                Sale Items
              </h2>
              {saleItems.length > 0 && (
                <button
                  className="clear-sale-btn"
                  onClick={handleClearSale}
                  type="button"
                >
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>

            {saleItems.length === 0 ? (
              <div className="empty-sale-message">
                <AlertCircle size={40} />
                <p>No items added yet</p>
                <span>Search and select products above to add them to the sale</span>
              </div>
            ) : (
              <div className="sale-items-list">
                {saleItems.map((item) => (
                  <div key={item.product_id} className="sale-item-card">
                    <div className="sale-item-info">
                      <div className="sale-item-name">{item.product_name}</div>
                      <div className="sale-item-brand">{item.brand}</div>
                      <div className="sale-item-stock">
                        {item.available_stock} available
                      </div>
                    </div>

                    <div className="sale-item-controls">
                      <div className="quantity-control">
                        <label>Qty</label>
                        <div className="quantity-input-group">
                          <button
                            type="button"
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value) || 1)}
                            min={1}
                            max={item.available_stock}
                            className="quantity-input"
                          />
                          <button
                            type="button"
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                            disabled={item.quantity >= item.available_stock}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="price-control">
                        <label>Unit Price (LKR)</label>
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handlePriceChange(item.product_id, parseFloat(e.target.value) || 0)}
                          min={0}
                          step={0.01}
                          className="price-input"
                        />
                      </div>

                      <div className="line-total">
                        <label>Total</label>
                        <span className="line-total-value">
                          LKR {(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="remove-item-btn"
                        onClick={() => handleRemoveItem(item.product_id)}
                        title="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Information Section */}
          <div className="customer-info-section">
            <h2>
              <UserCircle size={20} />
              Customer Information
            </h2>
            <p className="section-hint">Record walk-in customer details for this sale</p>
            <div className="customer-info-fields">
              <div className="form-field">
                <label htmlFor="customerName">
                  Customer Name <span className="required-indicator">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  placeholder="Enter customer name..."
                  value={customerName}
                  onChange={(e) => handleCustomerNameChange(e.target.value)}
                  className={`customer-input ${customerNameError ? 'input-error' : ''}`}
                  maxLength={200}
                  required
                />
                {customerNameError && <span className="field-error">{customerNameError}</span>}
              </div>
              <div className="form-field">
                <label htmlFor="customerPhone">
                  <Phone size={14} />
                  Phone Number (Optional)
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  placeholder="0771234567"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`customer-input ${phoneError ? 'input-error' : ''}`}
                  maxLength={15}
                />
                {phoneError && <span className="field-error">{phoneError}</span>}
                <span className="field-hint">Sri Lankan format: 10 digits starting with 0</span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="notes-section">
            <h2>Notes (Optional)</h2>
            <textarea
              placeholder="Add any notes about this sale..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="notes-textarea"
              rows={3}
            />
          </div>

          {/* Sale Summary Section */}
          <div className="sale-summary-section">
            <div className="summary-row">
              <span className="summary-label">Total Items:</span>
              <span className="summary-value">{totalItems}</span>
            </div>
            <div className="summary-row subtotal-row">
              <span className="summary-label">Subtotal:</span>
              <span className="summary-value">
                LKR {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="summary-row total-row">
              <span className="summary-label">Total:</span>
              <span className="summary-value total-value">
                LKR {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="submit-section">
            <button
              type="button"
              className="submit-sale-btn"
              onClick={handleSubmitSale}
              disabled={isSubmitting || saleItems.length === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Complete Offline Sale
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default OfflineSales;
