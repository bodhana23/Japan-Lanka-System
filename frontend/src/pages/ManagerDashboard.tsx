import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  // Debug effect to track showProfile changes
  useEffect(() => {
    console.log('Manager Dashboard - showProfile changed to:', showProfile);
  }, [showProfile]);

  // User state
  const [user, setUser] = useState<UserProfile>({
    email: 'manager1@gmail.com',
    name: 'Manager User',
    role: 'Manager',
    password: 'manager@1'
  });

  // Product management state - Vehicle parts inventory
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Brake Pads Set',
      brand: 'Toyota',
      model: 'Camry 2018-2023',
      price: 4500,
      quantity: 25,
      imageLink: 'https://example.com/brake-pads.jpg'
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      brand: 'Honda',
      model: 'Civic 2016-2021',
      price: 1200,
      quantity: 2,
      imageLink: 'https://example.com/oil-filter.jpg'
    },
    {
      id: 'P003',
      name: 'LED Headlight Bulbs',
      brand: 'BMW',
      model: '3 Series 2019-2024',
      price: 2800,
      quantity: 1,
      imageLink: 'https://example.com/headlight.jpg'
    },
    {
      id: 'P004',
      name: 'Air Filter',
      brand: 'Ford',
      model: 'Focus 2015-2020',
      price: 1850,
      quantity: 30,
      imageLink: 'https://example.com/air-filter.jpg'
    },
    {
      id: 'P005',
      name: 'Spark Plugs Set',
      brand: 'Nissan',
      model: 'Altima 2017-2022',
      price: 3200,
      quantity: 15,
      imageLink: 'https://example.com/spark-plugs.jpg'
    },
    {
      id: 'P006',
      name: 'Timing Belt',
      brand: 'Honda',
      model: 'Accord 2013-2017',
      price: 5500,
      quantity: 8,
      imageLink: 'https://example.com/timing-belt.jpg'
    }
  ]);

  // Customer orders state
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([
    {
      id: 'ORD-001',
      customerName: 'John Silva',
      customerEmail: 'john.silva@gmail.com',
      items: [
        { name: 'Brake Pads Set', quantity: 1, price: 4500 },
        { name: 'Engine Oil Filter', quantity: 2, price: 1200 }
      ],
      totalAmount: 6900,
      status: 'pending',
      orderDate: '2025-10-05',
      deliveryAddress: '123 Main Street, Colombo 03',
      contactNumber: '+94 77 123 4567'
    },
    {
      id: 'ORD-002',
      customerName: 'Sarah Fernando',
      customerEmail: 'sarah.fernando@gmail.com',
      items: [
        { name: 'LED Headlight Bulbs', quantity: 1, price: 2800 },
        { name: 'Air Filter', quantity: 1, price: 1850 }
      ],
      totalAmount: 4650,
      status: 'in_progress',
      orderDate: '2025-10-04',
      deliveryAddress: '456 Galle Road, Mount Lavinia',
      contactNumber: '+94 71 987 6543'
    },
    {
      id: 'ORD-003',
      customerName: 'Michael Perera',
      customerEmail: 'michael.perera@gmail.com',
      items: [
        { name: 'Spark Plugs Set', quantity: 1, price: 3200 },
        { name: 'Timing Belt', quantity: 1, price: 5500 }
      ],
      totalAmount: 8700,
      status: 'ready_to_pickup',
      orderDate: '2025-10-03',
      deliveryAddress: 'Self pickup from store',
      contactNumber: '+94 76 555 1234'
    },
    {
      id: 'ORD-004',
      customerName: 'Anna Rajapaksa',
      customerEmail: 'anna.rajapaksa@gmail.com',
      items: [
        { name: 'Brake Pads Set', quantity: 2, price: 4500 },
        { name: 'Engine Oil Filter', quantity: 3, price: 1200 }
      ],
      totalAmount: 12600,
      status: 'delivered',
      orderDate: '2025-10-02',
      deliveryAddress: '789 Kandy Road, Kegalle',
      contactNumber: '+94 75 444 9876'
    },
    {
      id: 'ORD-005',
      customerName: 'David Wickramasinghe',
      customerEmail: 'david.w@gmail.com',
      items: [
        { name: 'LED Headlight Bulbs', quantity: 2, price: 2800 },
        { name: 'Air Filter', quantity: 2, price: 1850 },
        { name: 'Spark Plugs Set', quantity: 1, price: 3200 }
      ],
      totalAmount: 12500,
      status: 'in_progress',
      orderDate: '2025-10-06',
      deliveryAddress: '321 Negombo Road, Katunayake',
      contactNumber: '+94 77 333 2222'
    }
  ]);

  // Hardcoded return requests
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([
    {
      id: 'RET-001',
      customerName: 'customer1',
      customerEmail: 'customer1@gmail.com',
      orderNumber: 'ORD-2024-001',
      itemName: 'Brake Pads Set',
      reason: 'Product damaged during shipping',
      status: 'pending',
      requestDate: '2024-01-15',
      messages: [
        {
          sender: 'customer1',
          message: 'The brake pads arrived with damaged packaging and some parts were missing.',
          timestamp: '2024-01-15 10:30 AM'
        }
      ]
    },
    {
      id: 'RET-002',
      customerName: 'customer2',
      customerEmail: 'customer2@gmail.com',
      orderNumber: 'ORD-2024-002',
      itemName: 'Engine Oil Filter',
      reason: 'Wrong item received',
      status: 'approved',
      requestDate: '2024-01-10',
      messages: [
        {
          sender: 'customer2',
          message: 'I ordered an oil filter for Honda Civic but received a filter for Toyota Camry instead.',
          timestamp: '2024-01-10 2:15 PM'
        },
        {
          sender: 'manager1',
          message: 'We apologize for the mistake. Return approved and correct oil filter will be sent.',
          timestamp: '2024-01-10 3:45 PM'
        }
      ]
    }
  ]);

  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    brand: '',
    model: '',
    price: 0,
    quantity: 0,
    imageLink: ''
  });

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
              onClick={() => {
                console.log('Manager Profile button clicked, current showProfile:', showProfile);
                setShowProfile(!showProfile);
                console.log('Manager showProfile should now be:', !showProfile);
              }}
            >
              <span className="profile-btn-icon">👤</span>
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
        {showProfile && (
          <div className="profile-section">
            <div className="section-header">
              <h2>Manager Profile</h2>
              <div className="profile-header-buttons">
                <button 
                  className="edit-profile-btn"
                  onClick={() => setShowEditProfile(true)}
                >
                  <span className="edit-icon">✏️</span>
                  Edit Profile
                </button>
                <button 
                  className="hide-profile-btn"
                  onClick={() => setShowProfile(false)}
                >
                  <span className="hide-icon">👁️‍🗨️</span>
                  Hide Profile
                </button>
              </div>
            </div>
            
            <div className="profile-card-horizontal">
              <div className="profile-avatar-section">
                <div className="profile-avatar-large">
                  <div className="avatar-large">
                    {(user.name && user.name.length > 0) ? user.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                </div>
              </div>
              
              <div className="profile-details-horizontal">
                <div className="profile-info-grid">
                  <div className="profile-item-horizontal">
                    <div className="profile-item-icon">�</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Full Name</span>
                      <span className="profile-value">{user.name}</span>
                    </div>
                  </div>

                  <div className="profile-item-horizontal">
                    <div className="profile-item-icon">📧</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Email Address</span>
                      <span className="profile-value">{user.email}</span>
                    </div>
                  </div>

                  <div className="profile-item-horizontal">
                    <div className="profile-item-icon">�</div>
                    <div className="profile-item-content">
                      <span className="profile-label">Role</span>
                      <span className="profile-value">{user.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-item">
                  <div className="product-image">
                    {product.imageLink ? (
                      <img src={product.imageLink} alt={product.name} onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextSibling) nextSibling.style.display = 'flex';
                      }} />
                    ) : null}
                    <div className="product-icon" style={{ display: product.imageLink ? 'none' : 'flex' }}>🏪</div>
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
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Customer Orders</h2>
              <div className="order-stats">
                <div className="stat-item">
                  <span className="stat-number">{customerOrders.filter(o => o.status === 'pending').length}</span>
                  <span className="stat-label">Pending</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{customerOrders.filter(o => o.status === 'in_progress').length}</span>
                  <span className="stat-label">In Progress</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{customerOrders.filter(o => o.status === 'ready_to_pickup').length}</span>
                  <span className="stat-label">Ready</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">{customerOrders.filter(o => o.status === 'delivered').length}</span>
                  <span className="stat-label">Delivered</span>
                </div>
              </div>
            </div>
            
            <div className="orders-grid">
              {customerOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <h3 className="order-id">Order #{order.id}</h3>
                      <p className="customer-name">{order.customerName}</p>
                      <p className="order-date">
                        {(() => {
                          try {
                            const date = new Date(order.orderDate);
                            return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-LK');
                          } catch {
                            return 'Invalid Date';
                          }
                        })()}
                      </p>
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
      {showEditProfile && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onSave={(updatedProfile: UserProfile) => {
            setUser(updatedProfile);
            localStorage.setItem('currentUser', JSON.stringify(updatedProfile));
            setShowEditProfile(false);
            alert('Profile updated successfully!');
          }}
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
            <div className="product-icon-header">📦</div>
            <h2>Edit Product</h2>
          </div>
          <button onClick={onClose} className="close-modal">×</button>
        </div>

        <div className="edit-product-form">
          <div className="form-group">
            <label htmlFor="productName">
              <span className="label-icon">🏷️</span>
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
                <span className="label-icon">🏭</span>
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
                <span className="label-icon">🚗</span>
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
                <span className="label-icon">💰</span>
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
                <span className="label-icon">📊</span>
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
              <span className="label-icon">🖼️</span>
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
              🗑️ Delete Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onSave: (user: UserProfile) => void;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<UserProfile>(user);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Name validation
    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (only if changing password)
    if (showPasswordChange) {
      if (!newPassword || newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters long';
      }
      
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser = {
        ...formData,
        password: showPasswordChange ? newPassword : formData.password
      };
      
      onSave(updatedUser);
    } catch (error) {
      alert('Error updating profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData({...formData, [field]: value});
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-profile-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="profile-icon">👤</div>
            <h2>Edit Manager Profile</h2>
          </div>
          <button onClick={onClose} className="close-modal" disabled={isLoading}>×</button>
        </div>

        <div className="edit-profile-form">
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-avatar">
              <div className="avatar-placeholder">
                {(formData.name && formData.name.length > 0) ? formData.name.charAt(0).toUpperCase() : 'M'}
              </div>
            </div>
            <p className="profile-email">{formData.email}</p>
            <p className="profile-role">{formData.role}</p>
          </div>

          {/* Form Fields */}
          <div className="form-fields">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">
                  <span className="label-icon">📝</span>
                  Full Name *
                </label>
                <input 
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.name ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  <span className="label-icon">�</span>
                  Email Address *
                </label>
                <input 
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className={errors.email ? 'error' : ''}
                  disabled={isLoading}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            {/* Password Change Section */}
            <div className="password-section">
              <div className="password-header">
                <h4>Password Settings</h4>
                <button 
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  disabled={isLoading}
                >
                  {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
                </button>
              </div>

              {showPasswordChange && (
                <div className="password-fields">
                  <div className="form-group">
                    <label htmlFor="newPassword">
                      <span className="label-icon">🔒</span>
                      New Password *
                    </label>
                    <input 
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                      className={errors.newPassword ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">
                      <span className="label-icon">🔒</span>
                      Confirm New Password *
                    </label>
                    <input 
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className={errors.confirmPassword ? 'error' : ''}
                      disabled={isLoading}
                    />
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            onClick={onClose} 
            className="cancel-btn"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className={`save-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Saving...
              </>
            ) : (
              <>
                <span className="save-icon">💾</span>
                Save Changes
              </>
            )}
          </button>
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