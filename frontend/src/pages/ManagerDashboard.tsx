import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout, roleConfigs } from '../components/shared';
import type { NavItem, RoleConfig, DashboardUser } from '../components/shared';
import { DashboardInventory, DashboardOrders, DashboardReturns, DashboardProfile } from '../components/manager';
import { productsApi, ordersApi, returnsApi, Product as ApiProduct, Order as ApiOrder, ReturnRequest as ApiReturnRequest } from '../services/api';
import { formatDateTime } from '../utils/dateUtils';
import {
  Package, Clock, RotateCcw, AlertTriangle,
  Tag, Factory, Car, DollarSign, BarChart2, Image, Trash2, RefreshCw, FileText, CheckCircle, XCircle,
  ClipboardList, User
} from 'lucide-react';
import './ManagerDashboard.css';

// Navigation item IDs for Manager Dashboard
type ManagerNavId = 'inventory' | 'orders' | 'returns' | 'profile';

interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  model: string;
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
  const [activeNav, setActiveNav] = useState<ManagerNavId>('inventory');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

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
    price: 0,
    quantity: 0,
    imageLink: ''
  });

  // Statistics calculations using useMemo

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
      description: '',
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
      alert(`Return request ${action} successfully!`);
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
      const apiStatus = newStatus === 'in_progress' ? 'confirmed' : newStatus;

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

      // Show success message
      const statusMessages = {
        'pending': 'Order marked as pending',
        'in_progress': 'Order marked as in progress',
        'ready_to_pickup': 'Order marked as ready for pickup',
        'delivered': 'Order marked as delivered'
      };

      alert(statusMessages[newStatus] || 'Order status updated');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update order status.';
      alert(`Error: ${errorMessage}`);
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

  // Navigation handler
  const handleNavigation = (navId: ManagerNavId) => {
    setActiveNav(navId);
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
                <label>Description:</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Enter product description (optional)"
                  rows={3}
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
        />
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



// Return Detail Modal Component
const ReturnDetailModal: React.FC<{
  returnRequest: ReturnRequestUI;
  onClose: () => void;
  onAction: (returnId: string, action: 'approved' | 'rejected', adminNotes?: string) => void;
  isProcessing: boolean;
  error: string | null;
}> = ({ returnRequest, onClose, onAction, isProcessing, error }) => {
  const [adminNotes, setAdminNotes] = useState(returnRequest.admin_notes || '');

  const handleAction = (action: 'approved' | 'rejected') => {
    onAction(returnRequest.id, action, adminNotes || undefined);
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
    <div className="modal-overlay">
      <div className="modal-content return-detail-modal">
        <div className="modal-header">
          <h2>Return Request #{returnRequest.id.slice(-8).toUpperCase()}</h2>
          <button onClick={onClose} className="close-modal">×</button>
        </div>

        <div className="return-detail-content">
          {/* Customer & Order Info */}
          <div className="return-info-section">
            <h4>Customer Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Name:</span>
                <span className="info-value">{returnRequest.customer_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{returnRequest.customer_email}</span>
              </div>
            </div>
          </div>

          <div className="return-info-section">
            <h4>Order Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Order ID:</span>
                <span className="info-value">#{returnRequest.order_id.slice(-8).toUpperCase()}</span>
              </div>
              {returnRequest.order_total && (
                <div className="info-item">
                  <span className="info-label">Order Total:</span>
                  <span className="info-value">Rs. {returnRequest.order_total.toLocaleString()}</span>
                </div>
              )}
              {returnRequest.order_status && (
                <div className="info-item">
                  <span className="info-label">Order Status:</span>
                  <span className="info-value">{returnRequest.order_status}</span>
                </div>
              )}
              {returnRequest.order_date && (
                <div className="info-item">
                  <span className="info-label">Order Date:</span>
                  <span className="info-value">{formatDateTime(returnRequest.order_date)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Return Request Info */}
          <div className="return-info-section">
            <h4>Return Request Details</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  <span
                    className="status-badge-inline"
                    style={{ backgroundColor: getStatusColor(returnRequest.status), color: 'white' }}
                  >
                    {returnRequest.status.toUpperCase()}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Request Date:</span>
                <span className="info-value">{formatDateTime(returnRequest.created_at)}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Reason:</span>
                <span className="info-value">{returnRequest.reason}</span>
              </div>
              {returnRequest.description && (
                <div className="info-item full-width">
                  <span className="info-label">Additional Description:</span>
                  <span className="info-value">{returnRequest.description}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items to Return */}
          {returnRequest.items && returnRequest.items.length > 0 && (
            <div className="return-info-section">
              <h4>Items to Return</h4>
              <table className="return-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequest.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td>{item.product_name || `Product ${item.product_id?.slice(-8)}`}</td>
                      <td>{item.quantity}</td>
                      <td>{item.unit_price ? `Rs. ${item.unit_price.toLocaleString()}` : '-'}</td>
                      <td>{item.unit_price ? `Rs. ${(item.unit_price * item.quantity).toLocaleString()}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Existing Admin Notes (if any and not pending) */}
          {returnRequest.status !== 'pending' && returnRequest.admin_notes && (
            <div className="return-info-section">
              <h4>Manager Response</h4>
              <div className="existing-admin-notes">
                {returnRequest.admin_notes}
              </div>
            </div>
          )}

          {/* Action Section (only for pending requests) */}
          {returnRequest.status === 'pending' && (
            <div className="return-action-section">
              <h4>Take Action</h4>

              {error && (
                <div className="action-error">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="admin-notes">
                  Manager Message / Notes:
                  <span className="required-hint">(Required for rejection)</span>
                </label>
                <textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter your message or reason for the decision..."
                  rows={4}
                  disabled={isProcessing}
                />
              </div>

              <div className="action-buttons">
                <button
                  onClick={() => handleAction('approved')}
                  className="approve-btn"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><RefreshCw size={16} className="spin" /> Processing...</>
                  ) : (
                    <><CheckCircle size={16} /> Approve Return</>
                  )}
                </button>
                <button
                  onClick={() => handleAction('rejected')}
                  className="reject-btn"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><RefreshCw size={16} className="spin" /> Processing...</>
                  ) : (
                    <><XCircle size={16} /> Reject Return</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;