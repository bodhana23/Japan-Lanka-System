import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileModal from '../components/ProfileModal';
import './CustomerDashboard.css';

interface OrderItem {
  partName: string;
  carModel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  items: string[]; // For backward compatibility in list view
  itemsDetailed: OrderItem[]; // For detailed modal view
  amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'ready_to_pickup' | 'delivered';
  orderDate: string;
  deliveryMethod: 'pickup' | 'shipping';
  customerName: string;
  customerPhone: string;
  shippingAddress?: {
    address: string;
    city: string;
    postalCode: string;
  };
  trackingInfo?: {
    orderPlaced: string;
    confirmed?: string;
    shipped?: string;
    delivered?: string;
    estimatedDelivery?: string;
  };
}

interface ReturnRequest {
  id: string;
  orderId: string;
  items: string[];
  itemsDetailed?: OrderItem[];
  reason: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  processedDate?: string;
  refundAmount?: number;
}

interface UserProfile {
  email: string;
  fullName: string;
  role: string;
  phoneNumber: string;
}

const CustomerDashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile>({
    email: '',
    fullName: '',
    role: 'customer',
    phoneNumber: ''
  });
  const [showProfile, setShowProfile] = useState(false);
  const [viewMode, setViewMode] = useState<'orders' | 'returns'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showReturnRequestModal, setShowReturnRequestModal] = useState(false);
  const [returnRequestOrder, setReturnRequestOrder] = useState<Order | null>(null);
  const navigate = useNavigate();
  const ordersRef = useRef<HTMLElement>(null);

  // Previous vehicle parts orders for demo
  const [orders] = useState<Order[]>([
    {
      id: 'ORD-001',
      items: ['Brake Pads Set (Toyota Camry)', 'Engine Oil Filter (Honda Civic)'],
      itemsDetailed: [
        { partName: 'Brake Pads Set', carModel: 'Toyota Camry', quantity: 1, unitPrice: 4500, subtotal: 4500 },
        { partName: 'Engine Oil Filter', carModel: 'Honda Civic', quantity: 1, unitPrice: 1200, subtotal: 1200 }
      ],
      amount: 5700.00,
      status: 'delivered',
      orderDate: '2025-01-10',
      deliveryMethod: 'shipping',
      customerName: 'Customer',
      customerPhone: '0771234567',
      shippingAddress: {
        address: '123 Main Street',
        city: 'Colombo',
        postalCode: '00100'
      },
      trackingInfo: {
        orderPlaced: '2025-01-10',
        confirmed: '2025-01-10',
        shipped: '2025-01-11',
        delivered: '2025-01-13'
      }
    },
    {
      id: 'ORD-002',
      items: ['LED Headlight Bulbs (BMW 3 Series)', 'Air Filter (Ford Focus)'],
      itemsDetailed: [
        { partName: 'LED Headlight Bulbs', carModel: 'BMW 3 Series', quantity: 2, unitPrice: 1850, subtotal: 3700 },
        { partName: 'Air Filter', carModel: 'Ford Focus', quantity: 1, unitPrice: 950, subtotal: 950 }
      ],
      amount: 4650.00,
      status: 'ready_to_pickup',
      orderDate: '2025-01-18',
      deliveryMethod: 'pickup',
      customerName: 'Customer',
      customerPhone: '0771234567',
      trackingInfo: {
        orderPlaced: '2025-01-18',
        confirmed: '2025-01-18'
      }
    },
    {
      id: 'ORD-003',
      items: ['Spark Plugs Set (Nissan Altima)', 'Timing Belt (Honda Accord)'],
      itemsDetailed: [
        { partName: 'Spark Plugs Set', carModel: 'Nissan Altima', quantity: 1, unitPrice: 2800, subtotal: 2800 },
        { partName: 'Timing Belt', carModel: 'Honda Accord', quantity: 1, unitPrice: 5900, subtotal: 5900 }
      ],
      amount: 8700.00,
      status: 'shipped',
      orderDate: '2025-01-20',
      deliveryMethod: 'shipping',
      customerName: 'Customer',
      customerPhone: '0771234567',
      shippingAddress: {
        address: '456 Park Avenue',
        city: 'Kandy',
        postalCode: '20000'
      },
      trackingInfo: {
        orderPlaced: '2025-01-20',
        confirmed: '2025-01-20',
        shipped: '2025-01-21',
        estimatedDelivery: '2025-01-24'
      }
    },
    {
      id: 'ORD-004',
      items: ['Car Battery (Suzuki Alto)'],
      itemsDetailed: [
        { partName: 'Car Battery', carModel: 'Suzuki Alto', quantity: 1, unitPrice: 18500, subtotal: 18500 }
      ],
      amount: 18500.00,
      status: 'pending',
      orderDate: '2025-01-22',
      deliveryMethod: 'pickup',
      customerName: 'Customer',
      customerPhone: '0771234567',
      trackingInfo: {
        orderPlaced: '2025-01-22',
        estimatedDelivery: '2025-01-24'
      }
    },
    {
      id: 'ORD-005',
      items: ['Windshield Wipers (Mazda 3)', 'Brake Pads Set (Toyota Corolla)'],
      itemsDetailed: [
        { partName: 'Windshield Wipers', carModel: 'Mazda 3', quantity: 1, unitPrice: 1350, subtotal: 1350 },
        { partName: 'Brake Pads Set', carModel: 'Toyota Corolla', quantity: 1, unitPrice: 4200, subtotal: 4200 }
      ],
      amount: 5550.00,
      status: 'confirmed',
      orderDate: '2025-01-21',
      deliveryMethod: 'shipping',
      customerName: 'Customer',
      customerPhone: '0771234567',
      shippingAddress: {
        address: '789 Lake Road',
        city: 'Galle',
        postalCode: '80000'
      },
      trackingInfo: {
        orderPlaced: '2025-01-21',
        confirmed: '2025-01-21',
        estimatedDelivery: '2025-01-25'
      }
    },
    {
      id: 'ORD-006',
      items: ['Engine Oil Filter (Nissan March)', 'Air Filter (Toyota Vitz)'],
      itemsDetailed: [
        { partName: 'Engine Oil Filter', carModel: 'Nissan March', quantity: 2, unitPrice: 1200, subtotal: 2400 },
        { partName: 'Air Filter', carModel: 'Toyota Vitz', quantity: 1, unitPrice: 950, subtotal: 950 }
      ],
      amount: 3350.00,
      status: 'delivered',
      orderDate: '2025-01-05',
      deliveryMethod: 'pickup',
      customerName: 'Customer',
      customerPhone: '0771234567',
      trackingInfo: {
        orderPlaced: '2025-01-05',
        confirmed: '2025-01-05',
        delivered: '2025-01-07'
      }
    },
    {
      id: 'ORD-007',
      items: ['Headlight Assembly (Honda Civic)', 'Fog Light Bulbs (Toyota Camry)'],
      itemsDetailed: [
        { partName: 'Headlight Assembly', carModel: 'Honda Civic', quantity: 1, unitPrice: 8900, subtotal: 8900 },
        { partName: 'Fog Light Bulbs', carModel: 'Toyota Camry', quantity: 2, unitPrice: 650, subtotal: 1300 }
      ],
      amount: 10200.00,
      status: 'delivered',
      orderDate: '2025-01-15',
      deliveryMethod: 'shipping',
      customerName: 'Customer',
      customerPhone: '0771234567',
      shippingAddress: {
        address: '789 Beach Road',
        city: 'Colombo',
        postalCode: '00300'
      },
      trackingInfo: {
        orderPlaced: '2025-01-15',
        confirmed: '2025-01-15',
        shipped: '2025-01-16',
        delivered: '2025-01-18'
      }
    },
    {
      id: 'ORD-008',
      items: ['Radiator Coolant (Nissan Altima)', 'Spark Plugs Set (Ford Focus)'],
      itemsDetailed: [
        { partName: 'Radiator Coolant', carModel: 'Nissan Altima', quantity: 2, unitPrice: 1850, subtotal: 3700 },
        { partName: 'Spark Plugs Set', carModel: 'Ford Focus', quantity: 1, unitPrice: 2400, subtotal: 2400 }
      ],
      amount: 6100.00,
      status: 'delivered',
      orderDate: '2025-01-12',
      deliveryMethod: 'pickup',
      customerName: 'Customer',
      customerPhone: '0771234567',
      trackingInfo: {
        orderPlaced: '2025-01-12',
        confirmed: '2025-01-12',
        delivered: '2025-01-14'
      }
    }
  ]);

  // Return requests for demo
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([
    {
      id: 'RET-001',
      orderId: 'ORD-001',
      items: ['Brake Pads Set (Toyota Camry)'],
      itemsDetailed: [
        { partName: 'Brake Pads Set', carModel: 'Toyota Camry', quantity: 1, unitPrice: 4500, subtotal: 4500 }
      ],
      reason: 'Wrong part received',
      description: 'Ordered brake pads for 2020 Toyota Camry model but received parts for 2018 model. The part number on the package does not match my order confirmation.',
      status: 'approved',
      requestDate: '2025-01-16',
      processedDate: '2025-01-17',
      refundAmount: 4500.00
    },
    {
      id: 'RET-002',
      orderId: 'ORD-002',
      items: ['LED Headlight Bulbs (BMW 3 Series)'],
      itemsDetailed: [
        { partName: 'LED Headlight Bulbs', carModel: 'BMW 3 Series', quantity: 2, unitPrice: 1850, subtotal: 3700 }
      ],
      reason: 'Wrong part received',
      description: 'Ordered LED Headlight Bulbs for BMW 3 Series 2022 model, but received bulbs for 2019 model. Part number does not match my vehicle specifications. I need the correct parts before I pick up the order.',
      status: 'pending',
      requestDate: '2025-01-21'
    },
    {
      id: 'RET-003',
      orderId: 'ORD-006',
      items: ['Engine Oil Filter (Nissan March)'],
      itemsDetailed: [
        { partName: 'Engine Oil Filter', carModel: 'Nissan March', quantity: 1, unitPrice: 1200, subtotal: 1200 }
      ],
      reason: 'Other',
      description: 'Changed my mind about this purchase. Found the same part at a lower price from another supplier. Would like to return for a refund.',
      status: 'rejected',
      requestDate: '2025-01-08',
      processedDate: '2025-01-09'
    },
    {
      id: 'RET-004',
      orderId: 'ORD-001',
      items: ['Engine Oil Filter (Honda Civic)'],
      itemsDetailed: [
        { partName: 'Engine Oil Filter', carModel: 'Honda Civic', quantity: 1, unitPrice: 1200, subtotal: 1200 }
      ],
      reason: 'Not as described',
      description: 'The product description mentioned "premium quality filter" but the received item appears to be a standard quality filter. Does not match the specifications listed on the website.',
      status: 'pending',
      requestDate: '2025-01-20'
    }
  ]);

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        // Validate user data structure
        if (!userData || typeof userData !== 'object' || !userData.email || !userData.role) {
          throw new Error('Invalid user data structure');
        }
        
        setUser({
          email: userData.email,
          fullName: userData.fullName || userData.name || 'Customer',
          role: userData.role,
          phoneNumber: userData.phoneNumber || ''
        });
      } catch (error) {
        console.error('Error parsing user data from localStorage:', error);
        try {
          localStorage.removeItem('currentUser');
        } catch (storageError) {
          console.error('Error removing corrupted user data:', storageError);
        }
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    try {
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
    navigate('/');
  };

  const handleNewOrder = () => {
    navigate('/shop');
  };


  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: 'Pending', class: 'status-pending' },
      'confirmed': { text: 'Confirmed', class: 'status-confirmed' },
      'shipped': { text: 'Shipped', class: 'status-shipped' },
      'ready_to_pickup': { text: 'Ready to Pickup', class: 'status-ready' },
      'delivered': { text: 'Delivered', class: 'status-delivered' }
    };
    return statusMap[status as keyof typeof statusMap] || { text: status, class: 'status-default' };
  };

  const getReturnStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: 'Pending Review', class: 'return-status-pending' },
      'approved': { text: 'Approved', class: 'return-status-approved' },
      'rejected': { text: 'Rejected', class: 'return-status-rejected' }
    };
    return statusMap[status as keyof typeof statusMap] || { text: status, class: 'return-status-default' };
  };

  // Check if a return request already exists for an order
  const hasExistingReturn = (orderId: string): boolean => {
    return returnRequests.some(returnReq => returnReq.orderId === orderId);
  };

  const handleSubmitReturn = (formData: {
    orderId: string;
    selectedItems: OrderItem[];
    reason: string;
    description: string;
  }) => {
    // Validate formData before processing
    if (!formData || !formData.orderId || !formData.selectedItems || formData.selectedItems.length === 0) {
      alert('Invalid return request data. Please try again.');
      return;
    }

    // Simulate API call
    setTimeout(() => {
      try {
        const newReturnId = `RET-${String(returnRequests.length + 1).padStart(3, '0')}`;
        const newReturn: ReturnRequest = {
          id: newReturnId,
          orderId: formData.orderId,
          items: formData.selectedItems.map(item => `${item.partName} (${item.carModel})`),
          itemsDetailed: formData.selectedItems,
          reason: formData.reason,
          description: formData.description,
          status: 'pending',
          requestDate: new Date().toISOString().split('T')[0]
        };
        
        setReturnRequests([newReturn, ...returnRequests]);
        setShowReturnRequestModal(false);
        setReturnRequestOrder(null);
        setViewMode('returns');
        
        // Show success message
        alert('Return request submitted successfully! We will review your request within 24-48 hours.');
      } catch (error) {
        console.error('Error submitting return request:', error);
        alert('Failed to submit return request. Please try again.');
      }
    }, 1000);
  };

  const scrollToOrders = () => {
    setViewMode('orders');
    setTimeout(() => {
      ordersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Japan Lanka Enterprises</h1>
          <div className="header-actions">
            <span className="welcome-text">Welcome, {user.fullName}!</span>
            <button 
              className="profile-header-btn"
              onClick={() => setShowProfile(!showProfile)}
            >
              <span className="profile-btn-icon">👤</span>
              <span className="profile-btn-text">Profile</span>
            </button>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* Action Buttons Section */}
      <div className="top-action-section">
        <button onClick={handleNewOrder} className="place-order-btn">
          <span className="btn-icon">🛒</span>
          Place an Order
        </button>
        <button 
          onClick={scrollToOrders} 
          className={`view-toggle-btn ${viewMode === 'orders' ? 'active' : ''}`}
        >
          <span className="btn-icon">📦</span>
          View Orders
        </button>
        <button 
          onClick={() => setViewMode('returns')} 
          className={`view-toggle-btn ${viewMode === 'returns' ? 'active' : ''}`}
        >
          <span className="btn-icon">↩️</span>
          View Return Requests
        </button>
      </div>

      <main className="dashboard-main">

        {/* Orders Section */}
        {viewMode === 'orders' && (
          <section ref={ordersRef} className="orders-section">
            <h2>Previous Orders</h2>
            <div className="orders-list">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-card-clickable" onClick={() => setSelectedOrder(order)}>
                      <div className="order-header">
                        <span className="order-id">#{order.id}</span>
                        <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                          {getStatusBadge(order.status).text}
                        </span>
                      </div>
                      <div className="order-details">
                        <p className="order-items">
                          <strong>Items:</strong> {order.items.join(', ')}
                        </p>
                        <div className="order-meta">
                          <span className="order-amount">Rs. {order.amount.toFixed(2)}</span>
                          <span className="order-date">
                            {(() => {
                              try {
                                if (!order.orderDate) return 'No Date';
                                const date = new Date(order.orderDate);
                                if (isNaN(date.getTime())) return 'Invalid Date';
                                return date.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                });
                              } catch (error) {
                                console.error('Date parsing error:', error);
                                return 'Invalid Date';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {(order.status === 'delivered' || order.status === 'ready_to_pickup') && (
                      <div className="order-card-actions">
                        {hasExistingReturn(order.id) ? (
                          <span className="return-requested-text">Return Requested</span>
                        ) : (
                          <button 
                            className="btn-request-return-card"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReturnRequestOrder(order);
                              setShowReturnRequestModal(true);
                            }}
                          >
                            Request Return
                            {order.status === 'ready_to_pickup' && (
                              <span className="before-pickup-badge">Before Pickup</span>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="no-orders">No previous orders found.</p>
              )}
            </div>
          </section>
        )}

        {/* Return Requests Section */}
        {viewMode === 'returns' && (
          <section className="returns-section">
            <h2>Return Requests</h2>
            <div className="returns-list">
              {returnRequests.length > 0 ? (
                returnRequests.map((returnReq) => (
                    <div key={returnReq.id} className="return-card" onClick={() => setSelectedReturn(returnReq)}>
                      <div className="return-header">
                        <div className="return-ids">
                          <span className="return-id">#{returnReq.id}</span>
                        </div>
                        <span className={`status-badge ${getReturnStatusBadge(returnReq.status).class}`}>
                          {getReturnStatusBadge(returnReq.status).text}
                        </span>
                      </div>
                      <div className="return-details">
                        <p className="return-items">
                          <strong>Items:</strong> {returnReq.items.join(', ')}
                        </p>
                      </div>
                  </div>
                ))
              ) : (
                <div className="no-returns-container">
                  <p className="no-returns">No return requests found.</p>
                  <p className="no-returns-hint">You can request returns for delivered or ready-to-pickup orders.</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          roleLabel="Customer"
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.id}</h2>
              <button className="close-button" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            
            {/* Order Status and Tracking */}
            <div className="order-tracking-section">
                <h3>Order Status</h3>
                <div className="order-timeline">
                  <div className={`timeline-step ${selectedOrder.trackingInfo?.orderPlaced ? 'completed' : ''}`}>
                    <div className="step-icon">📦</div>
                    <div className="step-content">
                      <div className="step-title">Order Placed</div>
                      {selectedOrder.trackingInfo?.orderPlaced && (
                        <div className="step-date">{new Date(selectedOrder.trackingInfo.orderPlaced).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>

                  <div className={`timeline-step ${selectedOrder.trackingInfo?.confirmed ? 'completed' : selectedOrder.status === 'pending' ? 'pending' : ''}`}>
                    <div className="step-icon">✓</div>
                    <div className="step-content">
                      <div className="step-title">Confirmed</div>
                      {selectedOrder.trackingInfo?.confirmed && (
                        <div className="step-date">{new Date(selectedOrder.trackingInfo.confirmed).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>

                  {selectedOrder.deliveryMethod === 'shipping' ? (
                    <>
                      <div className={`timeline-step ${selectedOrder.trackingInfo?.shipped ? 'completed' : ['pending', 'confirmed'].includes(selectedOrder.status) ? 'pending' : ''}`}>
                        <div className="step-icon">🚚</div>
                        <div className="step-content">
                          <div className="step-title">Shipped</div>
                          {selectedOrder.trackingInfo?.shipped && (
                            <div className="step-date">{new Date(selectedOrder.trackingInfo.shipped).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>

                      <div className={`timeline-step ${selectedOrder.trackingInfo?.delivered ? 'completed' : ''}`}>
                        <div className="step-icon">🏠</div>
                        <div className="step-content">
                          <div className="step-title">Delivered</div>
                          {selectedOrder.trackingInfo?.delivered ? (
                            <div className="step-date">{new Date(selectedOrder.trackingInfo.delivered).toLocaleDateString()}</div>
                          ) : selectedOrder.trackingInfo?.estimatedDelivery ? (
                            <div className="step-date estimated">Est: {new Date(selectedOrder.trackingInfo.estimatedDelivery).toLocaleDateString()}</div>
                          ) : null}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`timeline-step ${selectedOrder.status === 'ready_to_pickup' || selectedOrder.status === 'delivered' ? 'completed' : ''}`}>
                      <div className="step-icon">🏪</div>
                      <div className="step-content">
                        <div className="step-title">Ready for Pickup</div>
                        {selectedOrder.status === 'ready_to_pickup' && (
                          <div className="step-date">Available now at our store</div>
                        )}
                        {selectedOrder.trackingInfo?.delivered && (
                          <div className="step-date">Picked up: {new Date(selectedOrder.trackingInfo.delivered).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="order-info-section">
                <h3>Customer Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{selectedOrder.customerName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Delivery Method:</span>
                    <span className="info-value">{selectedOrder.deliveryMethod === 'shipping' ? 'Home Delivery' : 'Store Pickup'}</span>
                  </div>
                  {selectedOrder.shippingAddress && (
                    <div className="info-item full-width">
                      <span className="info-label">Delivery Address:</span>
                      <span className="info-value">
                        {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city} {selectedOrder.shippingAddress.postalCode}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="order-items-section">
                <h3>Order Items</h3>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Part Name</th>
                      <th>Car Model</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.itemsDetailed.map((item, index) => (
                      <tr key={index}>
                        <td>{item.partName}</td>
                        <td>{item.carModel}</td>
                        <td>{item.quantity}</td>
                        <td>Rs. {item.unitPrice.toFixed(2)}</td>
                        <td>Rs. {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="total-label">Total Amount:</td>
                      <td className="total-amount">Rs. {selectedOrder.amount.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Action Buttons */}
              {(selectedOrder.status === 'delivered' || selectedOrder.status === 'ready_to_pickup') && (
                <div className="modal-actions">
                  {hasExistingReturn(selectedOrder.id) ? (
                    <span className="return-requested-text-modal">Return Requested</span>
                  ) : (
                    <button className="btn-request-return" onClick={() => {
                      setReturnRequestOrder(selectedOrder);
                      setSelectedOrder(null);
                      setShowReturnRequestModal(true);
                    }}>
                      Request Return
                      {selectedOrder.status === 'ready_to_pickup' && (
                        <span className="before-pickup-badge-modal">Before Pickup</span>
                      )}
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {showReturnRequestModal && returnRequestOrder && (
        <div className="modal-overlay" onClick={() => setShowReturnRequestModal(false)}>
          <div className="return-request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Request Return - Order #{returnRequestOrder.id}</h2>
              <button className="close-button" onClick={() => setShowReturnRequestModal(false)}>×</button>
            </div>
            
            <ReturnRequestForm
              order={returnRequestOrder}
              onSubmit={handleSubmitReturn}
              onCancel={() => setShowReturnRequestModal(false)}
            />
          </div>
        </div>
      )}

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="modal-overlay" onClick={() => setSelectedReturn(null)}>
          <div className="return-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Return Request Details - #{selectedReturn.id}</h2>
              <button className="close-button" onClick={() => setSelectedReturn(null)}>×</button>
            </div>
            
            {/* Return Status */}
            <div className="return-status-section">
                <div className="status-display">
                  <span className="status-label">Current Status:</span>
                  <span className={`status-badge-large ${getReturnStatusBadge(selectedReturn.status).class}`}>
                    {getReturnStatusBadge(selectedReturn.status).text}
                  </span>
                </div>
                {selectedReturn.processedDate && (
                  <div className="processed-date">
                    Processed on: {new Date(selectedReturn.processedDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Original Order Reference */}
              <div className="order-info-section">
                <h3>Original Order</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Order ID:</span>
                    <span className="info-value">#{selectedReturn.orderId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Request Date:</span>
                    <span className="info-value">{new Date(selectedReturn.requestDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Returned Items */}
              <div className="order-items-section">
                <h3>Returned Items</h3>
                {selectedReturn.itemsDetailed && selectedReturn.itemsDetailed.length > 0 ? (
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Part Name</th>
                        <th>Car Model</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReturn.itemsDetailed.map((item, index) => (
                        <tr key={index}>
                          <td>{item.partName}</td>
                          <td>{item.carModel}</td>
                          <td>{item.quantity}</td>
                          <td>Rs. {item.unitPrice.toFixed(2)}</td>
                          <td>Rs. {item.subtotal.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="items-simple-list">
                    {selectedReturn.items.map((item, index) => (
                      <div key={index} className="item-entry">• {item}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Return Reason */}
              <div className="reason-section">
                <h3>Return Reason</h3>
                <div className="reason-category">
                  <span className="reason-label">Category:</span>
                  <span className="reason-value">{selectedReturn.reason}</span>
                </div>
                <div className="description-box">
                  <strong>Description:</strong>
                  <p>{selectedReturn.description}</p>
                </div>
              </div>

              {/* Refund Information */}
              {selectedReturn.refundAmount && (
                <div className="refund-section">
                  <h3>Refund Information</h3>
                  <div className="refund-amount-display">
                    <span className="refund-label">Refund Amount:</span>
                    <span className="refund-amount">Rs. {selectedReturn.refundAmount.toFixed(2)}</span>
                  </div>
                  {selectedReturn.status === 'approved' && (
                    <div className="refund-note">
                      The refund will be processed to your original payment method within 5-7 business days.
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

// Return Request Form Component
interface ReturnRequestFormProps {
  order: Order;
  onSubmit: (formData: {
    orderId: string;
    selectedItems: OrderItem[];
    reason: string;
    description: string;
  }) => void;
  onCancel: () => void;
}

const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({ order, onSubmit, onCancel }) => {
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine available reasons based on order status
  const isPickupOrder = order.status === 'ready_to_pickup';
  const reasonOptions = isPickupOrder 
    ? ['Wrong part received'] 
    : ['Wrong part received', 'Damaged item', 'Not as described', 'Changed mind', 'Other'];

  // Auto-select reason for pickup orders
  React.useEffect(() => {
    if (isPickupOrder) {
      setReason('Wrong part received');
    }
  }, [isPickupOrder]);

  const handleItemToggle = (item: OrderItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.partName === item.partName && i.carModel === item.carModel);
      if (exists) {
        return prev.filter(i => !(i.partName === item.partName && i.carModel === item.carModel));
      } else {
        return [...prev, item];
      }
    });
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (selectedItems.length === 0) {
      newErrors.items = 'Please select at least one item to return';
    }

    if (!reason) {
      newErrors.reason = 'Please select a return reason';
    }

    // Validate reason for pickup orders
    if (isPickupOrder && reason !== 'Wrong part received') {
      newErrors.reason = 'For pickup orders, only "Wrong part received" is accepted as a return reason';
    }

    if (!description || description.trim().length < 20) {
      newErrors.description = 'Please provide a detailed description (minimum 20 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    onSubmit({
      orderId: order.id,
      selectedItems,
      reason,
      description
    });
  };

  return (
    <form className="return-request-form" onSubmit={handleSubmit}>
      <div className="modal-content">
        {/* Order Information */}
        <div className="form-section">
          <div className="order-summary-box">
            <div className="summary-header">
              <span className="summary-label">Order:</span>
              <span className="summary-value">#{order.id}</span>
            </div>
            <div className="summary-info">
              <span>Order Date: {(() => {
                try {
                  if (!order.orderDate) return 'No Date';
                  const date = new Date(order.orderDate);
                  if (isNaN(date.getTime())) return 'Invalid Date';
                  return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  });
                } catch (error) {
                  console.error('Date parsing error:', error);
                  return 'Invalid Date';
                }
              })()}</span>
              <span>Total: Rs. {order.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Select Items to Return */}
        <div className="form-section">
          <label className="form-label">Select Items to Return *</label>
          {errors.items && <div className="error-message">{errors.items}</div>}
          <div className="items-checklist">
            {order.itemsDetailed && order.itemsDetailed.length > 0 ? (
              order.itemsDetailed.map((item, index) => (
                <div key={index} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`item-${index}`}
                    checked={selectedItems.some(i => i.partName === item.partName && i.carModel === item.carModel)}
                    onChange={() => handleItemToggle(item)}
                  />
                  <label htmlFor={`item-${index}`}>
                    <span className="item-name">{item.partName}</span>
                    <span className="item-model">({item.carModel})</span>
                    <span className="item-price">- Rs. {item.subtotal.toFixed(2)}</span>
                  </label>
                </div>
              ))
            ) : (
              <p className="no-items-message">No items available for this order.</p>
            )}
          </div>
        </div>

        {/* Return Reason */}
        <div className="form-section">
          <label className="form-label" htmlFor="reason">Return Reason *</label>
          {errors.reason && <div className="error-message">{errors.reason}</div>}
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`form-select ${errors.reason ? 'error' : ''}`}
            disabled={isPickupOrder}
          >
            {!isPickupOrder && <option value="">-- Select a reason --</option>}
            {reasonOptions.map((opt, index) => (
              <option key={index} value={opt}>{opt}</option>
            ))}
          </select>
          {isPickupOrder && (
            <div className="form-helper-text">
              <span className="helper-icon">ℹ️</span>
              Note: For pickup orders, returns are only accepted for wrong parts before collection.
            </div>
          )}
        </div>

        {/* Description */}
        <div className="form-section">
          <label className="form-label" htmlFor="description">
            Detailed Description * 
            <span className="char-count">({description.length}/20 min)</span>
          </label>
          {errors.description && <div className="error-message">{errors.description}</div>}
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide detailed information about why you want to return this item..."
            rows={5}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
          />
          <div className="form-help-text">
            Provide as much detail as possible to help us process your return request quickly.
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="modal-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-submit-return"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Return Request'}
        </button>
      </div>
    </form>
  );
};

export default CustomerDashboard;