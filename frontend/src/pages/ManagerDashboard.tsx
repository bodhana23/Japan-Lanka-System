import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig, DashboardUser } from '../components/shared';
import { DashboardInventory, DashboardOrders, DashboardReturns, DashboardProfile } from '../components/manager';
import { productsApi, ordersApi, returnsApi, inventoryApi, Product as ApiProduct, Order as ApiOrder, ReturnRequest as ApiReturnRequest } from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import {
  Package, Clock, RotateCcw, AlertTriangle,
  Tag, Factory, Car, DollarSign, BarChart2, Image, Trash2, RefreshCw, FileText, CheckCircle, XCircle,
  ClipboardList, User, Store, AlertCircle, PlusCircle, MinusCircle
} from 'lucide-react';
import './ManagerDashboard.css';

// ── Product dropdown options ─────────────────────────────────────────────────
const PRODUCT_BRANDS = [
  'Toyota', 'Honda', 'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Suzuki',
  'Isuzu', 'Daihatsu', 'Lexus', 'Infiniti', 'Acura', 'Scion', 'Hino',
  'Denso', 'NGK', 'Bosch', 'Gates', 'Aisin', 'Exedy', 'KYB', 'Monroe',
  'Brembo', 'Akebono', 'NTN', 'NSK', 'Koyo', 'Other',
];

const PRODUCT_CATEGORIES = [
  'Engine Parts', 'Brake System', 'Suspension', 'Transmission', 'Electrical',
  'Cooling System', 'Fuel System', 'Exhaust', 'Body Parts', 'Interior',
  'Filters', 'Belts & Chains', 'Clutch', 'Steering', 'Drivetrain',
  'Lighting', 'Tyres & Wheels', 'Other',
];

// Navigation item IDs for Manager Dashboard
type ManagerNavId = 'inventory' | 'orders' | 'offline-sales' | 'returns' | 'profile';

interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  imageLink: string;
}

interface ReturnRequestUI {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  order_total?: number;
  order_status?: string;
  order_date?: string;
  items: {
    id: string;
    order_item_id: string;
    quantity: number;
    created_at: string;
    product_id?: string;
    product_name?: string;
    product_image?: string;
    unit_price?: number;
    original_quantity?: number;
  }[];
}

interface CustomerOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'pending' | 'in_progress' | 'shipped' | 'ready_to_pickup' | 'delivered' | 'picked_up' | 'return_approved';
  orderDate: string;
  deliveryAddress?: string;
  contactNumber: string;
  deliveryMethod?: 'pickup' | 'shipping';
  // Offline sales fields
  salesChannel?: 'online' | 'offline';
  offlineCustomerName?: string;
  offlineCustomerPhone?: string;
  // Bill generation
  isBillable?: boolean;
}

interface UserProfile {
  email: string;
  name: string;
  role: string;
  password: string;
}

// Map URL paths to nav IDs
const pathToNavId: Record<string, ManagerNavId> = {
  '/manager/inventory': 'inventory',
  '/manager/orders': 'orders',
  '/manager/offline-sales': 'offline-sales',
  '/manager/returns': 'returns',
  '/manager/profile': 'profile',
};

// Map nav IDs to URL paths
const navIdToPath: Record<ManagerNavId, string> = {
  'inventory': '/manager/inventory',
  'orders': '/manager/orders',
  'offline-sales': '/manager/offline-sales',
  'returns': '/manager/returns',
  'profile': '/manager/profile',
};

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();

  // Derive active nav from current URL path (or ?section= query param from notification click)
  const activeNav = useMemo<ManagerNavId>(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section') as ManagerNavId | null;
    if (sectionParam && ['inventory', 'orders', 'returns', 'offline-sales', 'profile'].includes(sectionParam)) {
      return sectionParam;
    }
    return pathToNavId[location.pathname] || 'inventory';
  }, [location.pathname, location.search]);

  // Parse order_id and return_id from URL query params (for notification deep-links)
  const urlOrderId = useMemo(() => new URLSearchParams(location.search).get('order_id') || undefined, [location.search]);
  const urlReturnId = useMemo(() => new URLSearchParams(location.search).get('return_id') || undefined, [location.search]);

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // User state
  const [user, setUser] = useState<UserProfile>({
    email: 'manager1@gmail.com',
    name: 'Manager User',
    role: 'Manager',
    password: 'manager@1'
  });

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

  // Dashboard user for layout
  const dashboardUser: DashboardUser | undefined = useMemo(() => {
    if (authUser) {
      return {
        email: authUser.email,
        full_name: authUser.full_name,
        role: authUser.role,
      };
    }
    return {
      email: user.email,
      full_name: user.name,
      role: user.role,
    };
  }, [authUser, user]);

  // Product management state - fetched from API
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Customer orders state - fetched from API
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Return requests state - fetched from API
  const [returnRequests, setReturnRequests] = useState<ReturnRequestUI[]>([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);
  const [returnsError, setReturnsError] = useState<string | null>(null);
  const [selectedReturnRequest, setSelectedReturnRequest] = useState<ReturnRequestUI | null>(null);

  // Stock adjustment modal state
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<Product | null>(null);
  const [isProcessingAdjustment, setIsProcessingAdjustment] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [adjustmentSuccess, setAdjustmentSuccess] = useState<string | null>(null);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Product update loading state
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // Add product confirmation state
  const [showAddProductConfirm, setShowAddProductConfirm] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
            description: p.description || '',
            brand: p.brand,
            model: p.model,
            category: p.category,
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
          const transformedOrders: CustomerOrder[] = response.items.map((o: ApiOrder) => {
            // For offline sales, use offline customer info if available
            const isOffline = o.sales_channel === 'offline';
            const customerName = isOffline
              ? (o.offline_customer_name || 'Walk-in Customer')
              : (o.customer_name || 'Unknown Customer');
            const customerPhone = isOffline
              ? (o.offline_customer_phone || '')
              : (o.customer_phone || '');

            return {
              id: o.id,
              customerName,
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
              contactNumber: customerPhone,
              deliveryMethod: o.delivery_method as 'pickup' | 'shipping',
              // Offline sales fields
              salesChannel: o.sales_channel,
              offlineCustomerName: o.offline_customer_name,
              offlineCustomerPhone: o.offline_customer_phone,
              // Bill generation
              isBillable: o.is_billable,
            };
          });
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

  // Fetch return requests from API
  useEffect(() => {
    let isMounted = true;

    const fetchReturnRequests = async () => {
      try {
        setIsLoadingReturns(true);
        setReturnsError(null);
        const response = await returnsApi.getAllReturns(undefined, 1, 100);
        if (isMounted) {
          const transformedReturns: ReturnRequestUI[] = response.items.map((r: ApiReturnRequest) => ({
            id: r.id,
            order_id: r.order_id,
            customer_id: r.customer_id,
            customer_name: r.customer_name || 'Unknown Customer',
            customer_email: r.customer_email || '',
            reason: r.reason,
            description: r.description,
            status: r.status,
            admin_notes: r.admin_notes,
            created_at: r.created_at,
            updated_at: r.updated_at,
            order_total: r.order_total,
            order_status: r.order_status,
            order_date: r.order_date,
            items: r.items || []
          }));
          setReturnRequests(transformedReturns);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching return requests:', error);
          setReturnsError('Failed to load return requests.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingReturns(false);
        }
      }
    };

    fetchReturnRequests();

    return () => {
      isMounted = false;
    };
  }, []);

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    description: '',
    brand: '',
    model: '',
    category: '',
    price: 0,
    quantity: 0,
    imageLink: ''
  });

  // Statistics calculations using useMemo

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.brand || !newProduct.model || !newProduct.category) {
      showToast('Please fill in all required fields (name, brand, model, and category).', 'error');
      return;
    }
    if (newProduct.price <= 0) {
      showToast('Price must be greater than 0.', 'error');
      return;
    }
    if (newProduct.quantity < 0) {
      showToast('Quantity cannot be negative.', 'error');
      return;
    }
    // Show confirmation popup before submitting
    setShowAddProductConfirm(true);
  };

  const confirmAddProduct = async () => {
    setShowAddProductConfirm(false);
    try {
      const created = await productsApi.createProduct({
        name: newProduct.name,
        description: newProduct.description || undefined,
        brand: newProduct.brand,
        model: newProduct.model,
        category: newProduct.category,
        price: newProduct.price,
        quantity_available: newProduct.quantity,
        image_url: newProduct.imageLink || undefined,
      });

      setProducts([...products, {
        id: created.id,
        name: created.name,
        description: created.description || '',
        brand: created.brand,
        model: created.model,
        category: created.category,
        price: typeof created.price === 'string' ? parseFloat(created.price) : created.price,
        quantity: created.quantity_available,
        imageLink: created.image_url || '',
      }]);

      setNewProduct({ name: '', description: '', brand: '', model: '', category: '', price: 0, quantity: 0, imageLink: '' });
      setShowAddProduct(false);
      showToast(`"${created.name}" added to inventory successfully!`, 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to add product.';
      showToast(`Error: ${errorMessage}`, 'error');
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setIsUpdatingProduct(true);
    try {
      const payload = {
        name: updatedProduct.name,
        description: updatedProduct.description,
        brand: updatedProduct.brand,
        model: updatedProduct.model,
        price: updatedProduct.price,
        image_url: updatedProduct.imageLink,
      };
      const updated = await productsApi.updateProduct(updatedProduct.id, payload);
      setProducts(products.map(p => p.id === updatedProduct.id ? {
        ...p,
        name: updated.name,
        description: updated.description || '',
        brand: updated.brand,
        model: updated.model,
        price: typeof updated.price === 'string' ? parseFloat(updated.price) : updated.price,
        imageLink: updated.image_url || '',
      } : p));
      setShowEditProduct(false);
      setSelectedProduct(null);
      showToast('Product updated successfully!', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update product.';
      showToast(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const requestDeleteProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setProductToDelete(product);
      setDeleteError(null);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    setDeleteError(null);
    try {
      await productsApi.deleteProduct(productToDelete.id);
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setShowDeleteConfirm(false);
      setProductToDelete(null);
      setShowEditProduct(false);
      setSelectedProduct(null);
      showToast('Product deleted successfully!', 'success');
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to delete product.';
      setDeleteError(errorMessage);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  const cancelDeleteProduct = () => {
    setShowDeleteConfirm(false);
    setProductToDelete(null);
    setDeleteError(null);
  };

  const handleStockAdjustment = async (productId: string, quantityChange: number, reason: string) => {
    setIsProcessingAdjustment(true);
    setAdjustmentError(null);
    setAdjustmentSuccess(null);
    try {
      const response = await inventoryApi.createAdjustment({ product_id: productId, quantity_change: quantityChange, reason });
      setProducts(products.map(p => p.id === productId ? { ...p, quantity: response.quantity_after } : p));
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct({ ...selectedProduct, quantity: response.quantity_after });
      }
      setAdjustmentSuccess(`Stock updated successfully! New quantity: ${response.quantity_after} units.`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to adjust stock.';
      setAdjustmentError(errorMessage);
    } finally {
      setIsProcessingAdjustment(false);
    }
  };

  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [returnActionError, setReturnActionError] = useState<string | null>(null);

  const handleReturnAction = async (returnId: string, action: 'approved' | 'rejected', adminNotes?: string) => {
    // Validation: rejected requests must include a reason
    if (action === 'rejected' && (!adminNotes || !adminNotes.trim())) {
      setReturnActionError('A reason message is required when rejecting a return request.');
      return;
    }

    setIsProcessingReturn(true);
    setReturnActionError(null);

    try {
      const updatedReturn = await returnsApi.updateReturnStatus(returnId, action, adminNotes);

      // Update local state with the response
      setReturnRequests(prev => prev.map(req => {
        if (req.id === returnId) {
          return {
            ...req,
            status: updatedReturn.status,
            admin_notes: updatedReturn.admin_notes,
            updated_at: updatedReturn.updated_at
          };
        }
        return req;
      }));

      setSelectedReturnRequest(null);
      showToast(`Return request ${action} successfully!`, 'success');
    } catch (error: any) {
      console.error('Error updating return status:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update return request status.';
      setReturnActionError(errorMessage);
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: CustomerOrder['status']) => {
    try {
      // Map UI status to API status
      const statusMap: Record<string, string> = {
        'in_progress': 'confirmed',
        'shipped': 'shipped',
      };
      const apiStatus = statusMap[newStatus] ?? newStatus;

      // Call the backend API to update order status
      await ordersApi.updateOrderStatus(orderId, apiStatus as any);

      // Update local state on success
      setCustomerOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            status: newStatus
          };
        }
        return order;
      }));

      // Show success toast
      const statusMessages: Record<string, string> = {
        'pending': 'Order marked as pending',
        'in_progress': 'Order marked as in progress',
        'shipped': 'Order marked as shipped — on the road',
        'ready_to_pickup': 'Order marked as ready for pickup',
        'delivered': 'Order marked as delivered',
        'picked_up': 'Order marked as picked up',
        'return_approved': 'Return approved'
      };

      showToast(statusMessages[newStatus] || 'Order status updated', 'success');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update order status.';
      showToast(`Error: ${errorMessage}`, 'error');
    }
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

  // Navigation handler - always use URL navigation
  const handleNavigation = (navId: ManagerNavId) => {
    const path = navIdToPath[navId];
    if (path) {
      navigate(path);
    }
  };

  // Render the appropriate content based on active navigation
  const renderContent = () => {
    switch (activeNav) {
      case 'inventory':
        return (
          <DashboardInventory
            products={products}
            isLoading={isLoadingProducts}
            error={productsError}
            onEditProduct={handleEditProduct}
            onAddProduct={() => setShowAddProduct(true)}
          />
        );
      
      case 'orders':
        return (
          <DashboardOrders
            orders={customerOrders}
            isLoading={isLoadingOrders}
            error={ordersError}
            onStatusUpdate={handleOrderStatusUpdate}
            highlightOrderId={urlOrderId}
          />
        );
      
      case 'returns':
        return (
          <DashboardReturns
            returnRequests={returnRequests}
            isLoading={isLoadingReturns}
            error={returnsError}
            onViewReturn={(request) => setSelectedReturnRequest(request)}
            onAcceptReturn={(returnId) => {
              const request = returnRequests.find(r => r.id === returnId);
              if (request) {
                setSelectedReturnRequest(request);
              }
            }}
            onRejectReturn={(returnId) => {
              const request = returnRequests.find(r => r.id === returnId);
              if (request) {
                setSelectedReturnRequest(request);
              }
            }}
            highlightReturnId={urlReturnId}
          />
        );

      case 'profile':
        return (
          <DashboardProfile
            user={user}
          />
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout<ManagerNavId>
      navItems={navItems}
      activeNav={activeNav}
      onNavChange={handleNavigation}
      roleConfig={roleConfig}
      user={dashboardUser}
    >
      {renderContent()}

      {/* Add Product Modal — Modern Redesign */}
      {showAddProduct && !showAddProductConfirm && (
        <div className="modal-overlay">
          <div className="modal-content add-product-modal-modern">
            {/* Header */}
            <div className="add-product-modal-header">
              <div className="add-product-header-icon"><Package size={22} /></div>
              <div>
                <h2>Add New Product</h2>
                <p>Fill in the details to add a part to inventory</p>
              </div>
              <button onClick={() => setShowAddProduct(false)} className="close-modal">×</button>
            </div>

            <div className="add-product-form-body">
              {/* Product Name — full width */}
              <div className="apf-group apf-full">
                <label><Tag size={14} /> Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="e.g. Front Brake Pad Set"
                  className="apf-input"
                />
              </div>

              {/* Brand + Category dropdowns */}
              <div className="apf-group">
                <label><Factory size={14} /> Brand *</label>
                <select
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({...newProduct, brand: e.target.value})}
                  className="apf-input"
                >
                  <option value="">Select brand...</option>
                  {PRODUCT_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="apf-group">
                <label><ClipboardList size={14} /> Category *</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="apf-input"
                >
                  <option value="">Select category...</option>
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Model — free text with hint */}
              <div className="apf-group apf-full">
                <label><Car size={14} /> Compatible Model *</label>
                <input
                  type="text"
                  value={newProduct.model}
                  onChange={(e) => setNewProduct({...newProduct, model: e.target.value})}
                  placeholder="e.g. Corolla, Civic, Skyline (or 'Universal')"
                  className="apf-input"
                />
              </div>

              {/* Price + Quantity */}
              <div className="apf-group">
                <label><DollarSign size={14} /> Price (Rs.) *</label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.price || ''}
                  onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  placeholder="0.00"
                  className="apf-input"
                />
              </div>

              <div className="apf-group">
                <label><BarChart2 size={14} /> Initial Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.quantity || ''}
                  onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                  placeholder="0"
                  className="apf-input"
                />
              </div>

              {/* Description — full width */}
              <div className="apf-group apf-full">
                <label><FileText size={14} /> Description (optional)</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Brief description of the part..."
                  rows={3}
                  className="apf-input"
                />
              </div>

              {/* Image URL — full width */}
              <div className="apf-group apf-full">
                <label><Image size={14} /> Image URL (optional)</label>
                <input
                  type="url"
                  value={newProduct.imageLink}
                  onChange={(e) => setNewProduct({...newProduct, imageLink: e.target.value})}
                  placeholder="https://..."
                  className="apf-input"
                />
              </div>
            </div>

            <div className="add-product-modal-footer">
              <button type="button" onClick={() => setShowAddProduct(false)} className="cancel-btn">Cancel</button>
              <button type="button" onClick={handleAddProduct} className="save-btn">
                <CheckCircle size={16} /> Review & Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Confirmation Popup */}
      {showAddProductConfirm && (
        <div className="modal-overlay">
          <div className="modal-content add-product-confirm-modal">
            <div className="confirm-modal-icon"><AlertCircle size={36} /></div>
            <h3>Confirm Add Product</h3>
            <p>Are you sure you want to add this product to inventory?</p>
            <div className="confirm-product-summary">
              <div className="confirm-row"><span>Name:</span><strong>{newProduct.name}</strong></div>
              <div className="confirm-row"><span>Brand:</span><strong>{newProduct.brand}</strong></div>
              <div className="confirm-row"><span>Category:</span><strong>{newProduct.category}</strong></div>
              <div className="confirm-row"><span>Model:</span><strong>{newProduct.model}</strong></div>
              <div className="confirm-row"><span>Price:</span><strong>Rs. {Number(newProduct.price).toLocaleString()}</strong></div>
              <div className="confirm-row"><span>Quantity:</span><strong>{newProduct.quantity} units</strong></div>
            </div>
            <div className="confirm-modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddProductConfirm(false)}>Go Back</button>
              <button className="save-btn" onClick={confirmAddProduct}>
                <CheckCircle size={16} /> Yes, Add Product
              </button>
            </div>
          </div>
        </div>
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
          onDelete={requestDeleteProduct}
          onOpenStockAdjust={(product) => {
            setStockAdjustmentProduct(product);
            setAdjustmentError(null);
            setShowStockAdjustment(true);
          }}
          isSaving={isUpdatingProduct}
        />
      )}

      {/* Stock Adjustment Modal */}
      {showStockAdjustment && stockAdjustmentProduct && (
        <StockAdjustmentModal
          product={stockAdjustmentProduct}
          onClose={() => {
            setShowStockAdjustment(false);
            setStockAdjustmentProduct(null);
            setAdjustmentError(null);
            setAdjustmentSuccess(null);
          }}
          onAdjust={handleStockAdjustment}
          isProcessing={isProcessingAdjustment}
          error={adjustmentError}
          successMessage={adjustmentSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <ConfirmDeleteModal
          product={productToDelete}
          onConfirm={confirmDeleteProduct}
          onCancel={cancelDeleteProduct}
          isDeleting={isDeletingProduct}
          error={deleteError}
        />
      )}

      {/* Return Request Detail Modal */}
      {selectedReturnRequest && (
        <ReturnDetailModal
          returnRequest={selectedReturnRequest}
          onClose={() => {
            setSelectedReturnRequest(null);
            setReturnActionError(null);
          }}
          onAction={handleReturnAction}
          isProcessing={isProcessingReturn}
          error={returnActionError}
          showToast={showToast}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`manager-toast manager-toast-${toast.type}`}>
          <span className="manager-toast-icon">
            {toast.type === 'success' && <CheckCircle size={16} />}
            {toast.type === 'error' && <AlertTriangle size={16} />}
            {toast.type === 'info' && <AlertCircle size={16} />}
          </span>
          <span className="manager-toast-message">{toast.message}</span>
        </div>
      )}
    </DashboardLayout>
  );
};

// Edit Product Modal Component
const EditProductModal: React.FC<{
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
  onDelete: (productId: string) => void;
  onOpenStockAdjust: (product: Product) => void;
  isSaving: boolean;
}> = ({ product, onClose, onSave, onDelete, onOpenStockAdjust, isSaving }) => {
  const [formData, setFormData] = useState<Product>(product);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Sync formData.quantity if parent updates selectedProduct after a stock adjustment
  React.useEffect(() => {
    setFormData(prev => ({ ...prev, quantity: product.quantity }));
  }, [product.quantity]);

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
    if (errors[field as string]) {
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

          <div className="form-group">
            <label htmlFor="description">
              <FileText size={16} className="label-icon" />
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter product description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">
                <Factory size={16} className="label-icon" />
                Brand *
              </label>
              <select
                id="brand"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className={errors.brand ? 'error' : ''}
              >
                <option value="">Select brand...</option>
                {PRODUCT_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                {formData.brand && !PRODUCT_BRANDS.includes(formData.brand) && (
                  <option value={formData.brand}>{formData.brand}</option>
                )}
              </select>
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
                placeholder="e.g. Corolla, Civic, Universal"
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
              <label>
                <BarChart2 size={16} className="label-icon" />
                Current Stock
              </label>
              <div className="quantity-readonly-display">
                {formData.quantity} units
              </div>
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

          <div className="stock-adjustment-section">
            <div className="stock-adjustment-info">
              <BarChart2 size={16} />
              <span>To change stock quantity, use the Stock Adjustment tool</span>
            </div>
            <button
              type="button"
              className="adjust-stock-btn"
              onClick={() => onOpenStockAdjust(formData)}
            >
              <RefreshCw size={16} /> Adjust Stock
            </button>
          </div>
        </div>

        <div className="edit-product-footer">
          <button type="button" onClick={handleSubmit} className="save-btn" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="cancel-btn" disabled={isSaving}>
            Cancel
          </button>
          <button type="button" onClick={handleDelete} className="delete-btn-modal" disabled={isSaving}>
            <Trash2 size={16} /> Delete Product
          </button>
        </div>
      </div>
    </div>
  );
};



// Stock Adjustment Modal Component
const StockAdjustmentModal: React.FC<{
  product: Product;
  onClose: () => void;
  onAdjust: (productId: string, quantityChange: number, reason: string) => void;
  isProcessing: boolean;
  error: string | null;
  successMessage: string | null;
}> = ({ product, onClose, onAdjust, isProcessing, error, successMessage }) => {
  const [direction, setDirection] = useState<'add' | 'reduce'>('add');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = () => {
    setValidationError(null);
    if (!quantity || quantity < 1) {
      setValidationError('Quantity must be at least 1.');
      return;
    }
    if (!reason.trim()) {
      setValidationError('Reason is required.');
      return;
    }
    if (reason.trim().length > 500) {
      setValidationError('Reason must be 500 characters or less.');
      return;
    }
    if (direction === 'reduce' && quantity > product.quantity) {
      setValidationError(`Cannot reduce more than current stock (${product.quantity} units).`);
      return;
    }
    const quantityChange = direction === 'add' ? quantity : -quantity;
    onAdjust(product.id, quantityChange, reason.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content stock-adjustment-modal">
        <div className="modal-header">
          <h2>Adjust Stock</h2>
          <button onClick={onClose} className="close-modal" disabled={isProcessing}>×</button>
        </div>

        <div className="stock-adjustment-body">
          {successMessage ? (
            <div className="adjustment-success-state">
              <CheckCircle size={48} className="success-icon" />
              <p className="success-title">Stock Updated!</p>
              <p className="success-message">{successMessage}</p>
              <button className="close-success-btn" onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="stock-product-info">
                <p className="product-info-name">{product.name}</p>
                <p className="product-info-stock">Current stock: {product.quantity} units</p>
              </div>

              <div className="direction-toggle">
                <button
                  type="button"
                  className={direction === 'add' ? 'active-add' : ''}
                  onClick={() => setDirection('add')}
                >
                  <PlusCircle size={16} /> Add Stock
                </button>
                <button
                  type="button"
                  className={direction === 'reduce' ? 'active-reduce' : ''}
                  onClick={() => setDirection('reduce')}
                >
                  <MinusCircle size={16} /> Reduce Stock
                </button>
              </div>

              <div className="form-group">
                <label>
                  <BarChart2 size={16} />
                  Quantity to {direction === 'add' ? 'Add' : 'Reduce'} *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="Enter quantity"
                />
              </div>

              <div className="form-group">
                <label>
                  <FileText size={16} />
                  Reason *
                </label>
                <textarea
                  rows={4}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for stock adjustment (required)"
                />
                <span className={`char-counter${reason.length > 480 ? ' near-limit' : ''}`}>
                  {reason.length}/500
                </span>
              </div>

              {validationError && (
                <div className="validation-error">{validationError}</div>
              )}
              {error && (
                <div className="api-error">{error}</div>
              )}

              <div className="action-buttons">
                <button
                  type="button"
                  className="cancel-adjust-btn"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="confirm-adjust-btn"
                  onClick={handleSubmit}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : (direction === 'add' ? <><PlusCircle size={16} /> Add Stock</> : <><MinusCircle size={16} /> Reduce Stock</>)}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Confirm Delete Modal Component
const ConfirmDeleteModal: React.FC<{
  product: Product;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  error: string | null;
}> = ({ product, onConfirm, onCancel, isDeleting, error }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-delete-modal">
        <div className="modal-header">
          <h2>Delete Product</h2>
          <button onClick={onCancel} className="close-modal" disabled={isDeleting}>×</button>
        </div>

        <div className="confirm-delete-body">
          <div className="confirm-delete-icon">
            <AlertCircle size={56} />
          </div>
          <h3>Are you sure?</h3>
          <p>
            You are about to delete:{' '}
            <span className="product-name-highlight">{product.name}</span>
          </p>
          <div className="delete-warning">
            This action will deactivate the product and remove it from the store. It cannot be reversed.
          </div>

          {error && (
            <div className="api-error">{error}</div>
          )}

          <div className="action-buttons">
            <button
              type="button"
              className="cancel-delete-btn"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="confirm-delete-btn"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Return Detail Modal Component
const ReturnDetailModal: React.FC<{
  returnRequest: ReturnRequestUI;
  onClose: () => void;
  onAction: (returnId: string, action: 'approved' | 'rejected', adminNotes?: string) => void;
  isProcessing: boolean;
  error: string | null;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}> = ({ returnRequest, onClose, onAction, isProcessing, error, showToast }) => {
  const [adminNotes, setAdminNotes] = useState(returnRequest.admin_notes || '');
  const [pendingAction, setPendingAction] = useState<'approved' | 'rejected' | null>(null);

  const handleActionClick = (action: 'approved' | 'rejected') => {
    if (action === 'rejected' && (!adminNotes || !adminNotes.trim())) {
      showToast('A reason message is required when rejecting a return request.', 'error');
      return;
    }
    setPendingAction(action);
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    onAction(returnRequest.id, pendingAction, adminNotes || undefined);
    setPendingAction(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'completed': return '#3498db';
      default: return '#7f8c8d';
    }
  };

  return (
    <>
      <div className="rdm-overlay" onClick={pendingAction ? undefined : onClose}>
        <div className="rdm-box" onClick={(e) => e.stopPropagation()}>
          <div className="rdm-header">
            <div className="rdm-header-left">
              <RotateCcw size={20} className="rdm-header-icon" />
              <div>
                <h2 className="rdm-title">Return Request</h2>
                <span className="rdm-subtitle">#{returnRequest.id.slice(-8).toUpperCase()}</span>
              </div>
            </div>
            <div className="rdm-header-right">
              <span
                className="rdm-status-badge"
                style={{ backgroundColor: getStatusColor(returnRequest.status) }}
              >
                {returnRequest.status.toUpperCase()}
              </span>
              <button onClick={onClose} className="rdm-close-btn" aria-label="Close">×</button>
            </div>
          </div>

          <div className="rdm-body">
            <div className="rdm-columns">
              {/* Left Column */}
              <div className="rdm-col">
                <div className="rdm-section">
                  <h4 className="rdm-section-title">
                    <User size={15} /> Customer
                  </h4>
                  <div className="rdm-field-grid">
                    <div className="rdm-field">
                      <span className="rdm-label">Name</span>
                      <span className="rdm-value">{returnRequest.customer_name}</span>
                    </div>
                    <div className="rdm-field">
                      <span className="rdm-label">Email</span>
                      <span className="rdm-value rdm-email">{returnRequest.customer_email}</span>
                    </div>
                  </div>
                </div>

                <div className="rdm-section">
                  <h4 className="rdm-section-title">
                    <ClipboardList size={15} /> Order
                  </h4>
                  <div className="rdm-field-grid">
                    <div className="rdm-field">
                      <span className="rdm-label">Order ID</span>
                      <span className="rdm-value rdm-monospace">#{returnRequest.order_id.slice(-8).toUpperCase()}</span>
                    </div>
                    {returnRequest.order_total && (
                      <div className="rdm-field">
                        <span className="rdm-label">Order Total</span>
                        <span className="rdm-value rdm-amount">Rs. {returnRequest.order_total.toLocaleString()}</span>
                      </div>
                    )}
                    {returnRequest.order_date && (
                      <div className="rdm-field">
                        <span className="rdm-label">Order Date</span>
                        <span className="rdm-value">{formatDateTime(returnRequest.order_date)}</span>
                      </div>
                    )}
                    <div className="rdm-field">
                      <span className="rdm-label">Request Date</span>
                      <span className="rdm-value">{formatDateTime(returnRequest.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="rdm-section">
                  <h4 className="rdm-section-title">
                    <AlertCircle size={15} /> Return Reason
                  </h4>
                  <div className="rdm-reason-badge">{returnRequest.reason}</div>
                  {returnRequest.description && (
                    <p className="rdm-description">{returnRequest.description}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="rdm-col">
                {returnRequest.items && returnRequest.items.length > 0 && (
                  <div className="rdm-section">
                    <h4 className="rdm-section-title">
                      <Package size={15} /> Items to Return
                    </h4>
                    <table className="rdm-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnRequest.items.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td>{item.product_name || `Product ${item.product_id?.slice(-8)}`}</td>
                            <td className="rdm-center">{item.quantity}</td>
                            <td className="rdm-right">{item.unit_price ? `Rs. ${item.unit_price.toLocaleString()}` : '—'}</td>
                            <td className="rdm-right rdm-amount">{item.unit_price ? `Rs. ${(item.unit_price * item.quantity).toLocaleString()}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Existing Admin Notes (non-pending) */}
                {returnRequest.status !== 'pending' && returnRequest.admin_notes && (
                  <div className="rdm-section">
                    <h4 className="rdm-section-title">
                      <CheckCircle size={15} /> Manager Response
                    </h4>
                    <div className={`rdm-manager-notes rdm-notes-${returnRequest.status}`}>
                      {returnRequest.admin_notes}
                    </div>
                  </div>
                )}

                {/* Action Section (pending only) */}
                {returnRequest.status === 'pending' && (
                  <div className="rdm-section rdm-action-section">
                    <h4 className="rdm-section-title">
                      <AlertTriangle size={15} /> Take Action
                    </h4>

                    {error && (
                      <div className="rdm-error-msg">
                        <AlertTriangle size={14} /> {error}
                      </div>
                    )}

                    <div className="rdm-form-group">
                      <label className="rdm-form-label">
                        Manager Message / Notes
                        <span className="rdm-required-hint"> (required for rejection)</span>
                      </label>
                      <textarea
                        className="rdm-textarea"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Enter your message or reason for the decision..."
                        rows={4}
                        disabled={isProcessing}
                      />
                    </div>

                    <div className="rdm-action-btns">
                      <button
                        onClick={() => handleActionClick('approved')}
                        className="rdm-approve-btn"
                        disabled={isProcessing}
                      >
                        <CheckCircle size={16} /> Approve Return
                      </button>
                      <button
                        onClick={() => handleActionClick('rejected')}
                        className="rdm-reject-btn"
                        disabled={isProcessing}
                      >
                        <XCircle size={16} /> Reject Return
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {pendingAction && (
        <div className="rdm-confirm-overlay">
          <div className="rdm-confirm-box">
            <div className={`rdm-confirm-icon ${pendingAction === 'approved' ? 'rdm-confirm-approve' : 'rdm-confirm-reject'}`}>
              {pendingAction === 'approved' ? <CheckCircle size={32} /> : <XCircle size={32} />}
            </div>
            <h3 className="rdm-confirm-title">
              {pendingAction === 'approved' ? 'Approve Return?' : 'Reject Return?'}
            </h3>
            <p className="rdm-confirm-msg">
              {pendingAction === 'approved'
                ? 'This will approve the return request and update the order status.'
                : 'This will reject the return request. The customer will be notified.'}
            </p>
            {adminNotes && (
              <div className="rdm-confirm-notes">
                <strong>Your note:</strong> {adminNotes}
              </div>
            )}
            <div className="rdm-confirm-btns">
              <button
                className="rdm-confirm-cancel"
                onClick={() => setPendingAction(null)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={pendingAction === 'approved' ? 'rdm-confirm-approve-btn' : 'rdm-confirm-reject-btn'}
                onClick={handleConfirmAction}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><RefreshCw size={14} className="spin" /> Processing...</>
                ) : (
                  pendingAction === 'approved' ? 'Yes, Approve' : 'Yes, Reject'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManagerDashboard;