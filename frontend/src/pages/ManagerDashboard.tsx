import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManagerDashboard.css';

interface Product {
  id: string;
  name: string;
  model: string;
  modelYear: string;
  price: number;
  quantityAvailable: number;
  category: string;
  image: string;
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
  username: string;
  role: string;
  mobile: string;
  garageName?: string;
  registrationNumber?: string;
}

const ManagerDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'returns'>('inventory');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const navigate = useNavigate();

  // Hardcoded products inventory
  const [products, setProducts] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Brake Pads',
      model: 'Toyota Camry',
      modelYear: '2018-2023',
      price: 4599.00,
      quantityAvailable: 25,
      category: 'Brake System',
      image: '🔧',
      description: 'High-quality ceramic brake pads for optimal stopping power'
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      model: 'Honda Civic',
      modelYear: '2016-2021',
      price: 1299.00,
      quantityAvailable: 50,
      category: 'Engine',
      image: '⚙️',
      description: 'Premium oil filter for engine protection and performance'
    },
    {
      id: 'P003',
      name: 'Headlight Bulb',
      model: 'BMW 3 Series',
      modelYear: '2019-2024',
      price: 2850.00,
      quantityAvailable: 15,
      category: 'Lighting',
      image: '💡',
      description: 'LED headlight bulb with enhanced brightness and longevity'
    },
    {
      id: 'P004',
      name: 'Air Filter',
      model: 'Ford Focus',
      modelYear: '2015-2020',
      price: 1875.00,
      quantityAvailable: 30,
      category: 'Engine',
      image: '🌪️',
      description: 'High-flow air filter for improved engine breathing'
    }
  ]);

  // Hardcoded return requests
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([
    {
      id: 'RET-001',
      customerName: 'customer1',
      customerEmail: 'customer1@gmail.com',
      orderNumber: 'ORD-001',
      itemName: 'Brake Pads',
      reason: 'Wrong size - received 2018 model instead of 2020',
      status: 'pending',
      requestDate: '2025-09-29',
      messages: [
        {
          sender: 'customer1',
          message: 'I received the wrong brake pads. I ordered for 2020 Camry but got 2018 model.',
          timestamp: '2025-09-29T10:30:00'
        }
      ]
    },
    {
      id: 'RET-002',
      customerName: 'customer1',
      customerEmail: 'customer1@gmail.com',
      orderNumber: 'ORD-002',
      itemName: 'Headlight Bulb',
      reason: 'Defective product - bulb not working',
      status: 'pending',
      requestDate: '2025-09-30',
      messages: [
        {
          sender: 'customer1',
          message: 'The headlight bulb is not working properly. It flickers and dims randomly.',
          timestamp: '2025-09-30T14:15:00'
        }
      ]
    }
  ]);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const userData = JSON.parse(currentUser);
      if (userData.role !== 'manager') {
        navigate('/dashboard');
        return;
      }
      setUser(userData);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId));
      alert('Product deleted successfully!');
    }
  };

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...product,
      id: `P${String(products.length + 1).padStart(3, '0')}`
    };
    setProducts([...products, newProduct]);
    setShowAddProduct(false);
    alert('Product added successfully!');
  };

  const handleReturnAction = (returnId: string, action: 'approved' | 'rejected', message?: string) => {
    setReturnRequests(returnRequests.map(request => {
      if (request.id === returnId) {
        const updatedRequest = {
          ...request,
          status: action,
          messages: message ? [...request.messages, {
            sender: 'manager1',
            message: message,
            timestamp: new Date().toISOString()
          }] : request.messages
        };
        return updatedRequest;
      }
      return request;
    }));
    
    alert(`Return request ${action}!`);
    setSelectedReturn(null);
  };

  const handleSendMessage = (returnId: string, message: string) => {
    setReturnRequests(returnRequests.map(request => {
      if (request.id === returnId) {
        return {
          ...request,
          messages: [...request.messages, {
            sender: 'manager1',
            message: message,
            timestamp: new Date().toISOString()
          }]
        };
      }
      return request;
    }));
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="manager-dashboard-container">
      <header className="manager-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises - Manager Portal</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.username}!</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <main className="manager-main">
        <div className="manager-tabs">
          <button 
            className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            🔄 Return Requests ({returnRequests.filter(r => r.status === 'pending').length})
          </button>
        </div>

        {activeTab === 'inventory' ? (
          <div className="inventory-section">
            <div className="section-header">
              <h2>Product Inventory</h2>
              <button 
                onClick={() => setShowAddProduct(true)} 
                className="add-product-btn"
              >
                ➕ Add New Product
              </button>
            </div>

            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-item">
                  <div className="product-icon">{product.image}</div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-model">{product.model} ({product.modelYear})</p>
                    <p className="product-price">Rs. {product.price.toFixed(2)}</p>
                    <p className="product-stock">Stock: {product.quantityAvailable}</p>
                    <div className="product-actions">
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="delete-btn"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="returns-section">
            <h2>Return Requests</h2>
            <div className="returns-grid">
              {returnRequests.map(request => (
                <div key={request.id} className="return-item">
                  <div className="return-header">
                    <span className="return-id">#{request.id}</span>
                    <span className={`status-badge ${request.status}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="return-details">
                    <p><strong>Customer:</strong> {request.customerName}</p>
                    <p><strong>Order:</strong> {request.orderNumber}</p>
                    <p><strong>Item:</strong> {request.itemName}</p>
                    <p><strong>Reason:</strong> {request.reason}</p>
                    <p><strong>Date:</strong> {new Date(request.requestDate).toLocaleDateString()}</p>
                  </div>
                  <div className="return-actions">
                    <button 
                      onClick={() => setSelectedReturn(request)}
                      className="view-chat-btn"
                    >
                      💬 View Chat
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
        <AddProductModal
          onClose={() => setShowAddProduct(false)}
          onAdd={handleAddProduct}
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

// Add Product Modal Component
const AddProductModal: React.FC<{
  onClose: () => void;
  onAdd: (product: Omit<Product, 'id'>) => void;
}> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    modelYear: '',
    price: 0,
    quantityAvailable: 0,
    category: '',
    image: '🔧',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantityAvailable' ? Number(value) : value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button onClick={onClose} className="close-modal">×</button>
        </div>
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Vehicle Model</label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Model Year</label>
            <input
              type="text"
              name="modelYear"
              value={formData.modelYear}
              onChange={handleChange}
              placeholder="e.g., 2018-2023"
              required
            />
          </div>
          <div className="form-group">
            <label>Price (Rs.)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="form-group">
            <label>Quantity Available</label>
            <input
              type="number"
              name="quantityAvailable"
              value={formData.quantityAvailable}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              <option value="Engine">Engine</option>
              <option value="Brake System">Brake System</option>
              <option value="Electrical">Electrical</option>
              <option value="Lighting">Lighting</option>
              <option value="Transmission">Transmission</option>
              <option value="Exterior">Exterior</option>
            </select>
          </div>
          <div className="form-group">
            <label>Icon</label>
            <select
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
            >
              <option value="🔧">🔧 Tools</option>
              <option value="⚙️">⚙️ Engine</option>
              <option value="💡">💡 Lighting</option>
              <option value="🔋">🔋 Battery</option>
              <option value="🛢️">🛢️ Oil</option>
              <option value="🌪️">🌪️ Filter</option>
              <option value="⚡">⚡ Electrical</option>
              <option value="🌧️">🌧️ Exterior</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Add Product
            </button>
          </div>
        </form>
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
    onAction(returnRequest.id, action, actionMessage);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content chat-modal">
        <div className="modal-header">
          <h2>Return Request #{returnRequest.id}</h2>
          <button onClick={onClose} className="close-modal">×</button>
        </div>
        
        <div className="return-info">
          <p><strong>Customer:</strong> {returnRequest.customerName}</p>
          <p><strong>Item:</strong> {returnRequest.itemName}</p>
          <p><strong>Reason:</strong> {returnRequest.reason}</p>
        </div>

        <div className="chat-messages">
          {returnRequest.messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender === 'manager1' ? 'manager' : 'customer'}`}>
              <div className="message-sender">{msg.sender}</div>
              <div className="message-content">{msg.message}</div>
              <div className="message-time">
                {new Date(msg.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {returnRequest.status === 'pending' && (
          <>
            <div className="chat-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="send-btn">Send</button>
            </div>

            <div className="action-section">
              <textarea
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                placeholder="Add a final message (optional)..."
                rows={2}
              />
              <div className="action-buttons">
                <button 
                  onClick={() => handleAction('approved')} 
                  className="approve-btn"
                >
                  ✅ Approve Return
                </button>
                <button 
                  onClick={() => handleAction('rejected')} 
                  className="reject-btn"
                >
                  ❌ Reject Return
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;