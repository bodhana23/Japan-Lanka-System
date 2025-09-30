import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManagerDashboard.css';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  quantity: number;
  description: string;
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

interface UserProfile {
  email: string;
  name: string;
  role: string;
  phone: string;
  address: string;
  joinDate: string;
}

const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'returns' | 'profile'>('inventory');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const navigate = useNavigate();

  // User state
  const [user, setUser] = useState<UserProfile>({
    email: 'manager1@gmail.com',
    name: 'Manager User',
    role: 'Manager',
    phone: '+94 11 123 4567',
    address: 'Colombo, Sri Lanka',
    joinDate: '2023-01-15'
  });

  // Product management state - Vehicle parts inventory
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Brake Pads Set',
      price: 4500,
      category: 'Brake System',
      quantity: 25,
      description: 'High-quality ceramic brake pads for Toyota Camry 2018-2023'
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      price: 1200,
      category: 'Engine Parts',
      quantity: 2,
      description: 'Premium oil filter for Honda Civic 2016-2021'
    },
    {
      id: 'P003',
      name: 'LED Headlight Bulbs',
      price: 2800,
      category: 'Lighting',
      quantity: 1,
      description: 'LED headlight bulb set for BMW 3 Series 2019-2024'
    },
    {
      id: 'P004',
      name: 'Air Filter',
      price: 1850,
      category: 'Engine Parts',
      quantity: 30,
      description: 'High-flow air filter for Ford Focus 2015-2020'
    },
    {
      id: 'P005',
      name: 'Spark Plugs Set',
      price: 3200,
      category: 'Engine Parts',
      quantity: 15,
      description: 'Iridium spark plugs for Nissan Altima 2017-2022'
    },
    {
      id: 'P006',
      name: 'Timing Belt',
      price: 5500,
      category: 'Engine Parts',
      quantity: 8,
      description: 'Timing belt kit for Honda Accord 2013-2017'
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
    price: 0,
    category: '',
    quantity: 0,
    description: ''
  });

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.category) {
      const product: Product = {
        ...newProduct,
        id: `P${Date.now()}`
      };
      setProducts([...products, product]);
      setNewProduct({
        name: '',
        price: 0,
        category: '',
        quantity: 0,
        description: ''
      });
      setShowAddProduct(false);
      alert('Product added successfully!');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
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

  // Check authentication on component mount
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/');
      return;
    }
    
    const parsedUser = JSON.parse(currentUser);
    if (parsedUser.role !== 'manager') {
      navigate('/');
      return;
    }
  }, [navigate]);

  return (
    <div className="manager-dashboard-container">
      <header className="manager-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises - Manager Portal</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="manager-main">
        <nav className="manager-tabs">
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventory Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            Return Requests
          </button>
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
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
                  <div className="product-icon">🏪</div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-model">{product.category}</p>
                    <p className="product-price">Rs. {product.price.toLocaleString()}</p>
                    <p className="product-stock">Stock: {product.quantity} units</p>
                    <p>{product.description}</p>
                  </div>
                  <div className="product-actions">
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      Delete Product
                    </button>
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

        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2>Manager Profile</h2>
            <div className="profile-card">
              <div className="profile-info">
                <div className="profile-item">
                  <span className="profile-label">Email:</span>
                  <span className="profile-value">{user.email}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Name:</span>
                  <span className="profile-value">{user.name}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Role:</span>
                  <span className="profile-value">{user.role}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Phone:</span>
                  <span className="profile-value">{user.phone}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Address:</span>
                  <span className="profile-value">{user.address}</span>
                </div>
                <div className="profile-item">
                  <span className="profile-label">Join Date:</span>
                  <span className="profile-value">{user.joinDate}</span>
                </div>
              </div>
              <button 
                className="edit-profile-btn"
                onClick={() => setShowEditProfile(true)}
              >
                Edit Profile
              </button>
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
                <label>Category:</label>
                <input 
                  type="text"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  placeholder="Enter category"
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
                <label>Description:</label>
                <textarea 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Enter product description"
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

// Edit Profile Modal Component
const EditProfileModal: React.FC<{
  user: UserProfile;
  onClose: () => void;
  onSave: (user: UserProfile) => void;
}> = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState<UserProfile>(user);

  const handleSave = () => {
    if (formData.name && formData.phone && formData.address) {
      onSave(formData);
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Edit Profile</h3>
        <div className="form-group">
          <label>Name:</label>
          <input 
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Phone:</label>
          <input 
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Address:</label>
          <textarea 
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave} className="confirm-btn">Save Changes</button>
          <button onClick={onClose} className="cancel-btn">Cancel</button>
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
            {returnRequest.messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender === 'manager1' ? 'manager' : 'customer'}`}>
                <div className="message-sender">{msg.sender}</div>
                <div className="message-content">{msg.message}</div>
                <div className="message-time">{msg.timestamp}</div>
              </div>
            ))}
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