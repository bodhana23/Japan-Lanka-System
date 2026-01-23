import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi, CreateOrderRequest } from '../services/api';
import { Store, Truck, MapPin, Clock, Info, AlertTriangle, Package, Check, CheckCircle } from 'lucide-react';
import './Checkout.css';

interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
}

interface FormErrors {
  [key: string]: string;
}

type DeliveryMethod = 'pickup' | 'shipping';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', '/checkout');
      navigate('/login');
      return;
    }

    // Load customer data from authenticated user
    if (user) {
      setShippingInfo(prev => ({
        ...prev,
        fullName: user.full_name || '',
        phone: user.phone_number || ''
      }));
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    // Redirect if cart is empty
    if (cart.length === 0 && !showSuccessModal) {
      navigate('/shop');
    }
  }, [cart, navigate, showSuccessModal]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Delivery method validation
    if (!deliveryMethod) {
      newErrors.deliveryMethod = 'Please select a delivery method';
    }

    // Full name validation
    if (!shippingInfo.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (shippingInfo.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!shippingInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(shippingInfo.phone.replace(/[\s-]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    // Address validation - only required for shipping
    if (deliveryMethod === 'shipping') {
      if (!shippingInfo.address.trim()) {
        newErrors.address = 'Address is required for shipping';
      } else if (shippingInfo.address.trim().length < 10) {
        newErrors.address = 'Please enter a complete address';
      }

      // City validation - only required for shipping
      if (!shippingInfo.city.trim()) {
        newErrors.city = 'City is required for shipping';
      }

      // Postal code validation - only required for shipping
      const postalRegex = /^[0-9]{5}$/;
      if (!shippingInfo.postalCode.trim()) {
        newErrors.postalCode = 'Postal code is required for shipping';
      } else if (!postalRegex.test(shippingInfo.postalCode)) {
        newErrors.postalCode = 'Please enter a valid 5-digit postal code';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsProcessing(true);
    setOrderError(null);

    try {
      // Build order request for API
      const orderRequest: CreateOrderRequest = {
        delivery_method: deliveryMethod!,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        })),
        notes: undefined
      };

      // Add shipping info if delivery method is shipping
      if (deliveryMethod === 'shipping') {
        orderRequest.shipping_address = shippingInfo.address;
        orderRequest.shipping_city = shippingInfo.city;
        orderRequest.shipping_postal_code = shippingInfo.postalCode;
      }

      // Create order via API
      const createdOrder = await ordersApi.createOrder(orderRequest);

      // Clear cart after successful order
      await clearCart();

      setOrderId(createdOrder.id.substring(0, 8).toUpperCase());
      setShowSuccessModal(true);

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to place order. Please try again.';
      setOrderError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.0; // No tax for now
  const total = subtotal + tax;

  if (showSuccessModal) {
    return (
      <div className="checkout-container">
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon"><CheckCircle size={48} color="#16a34a" /></div>
            <h2>Order Placed Successfully!</h2>
            <p className="order-id">Order ID: <strong>#{orderId}</strong></p>
            <p className="delivery-info">
              {deliveryMethod === 'pickup' ? (
                <><MapPin size={16} /> <strong>Pickup from Store</strong> - We'll contact you when ready</>
              ) : (
                <><Truck size={16} /> <strong>Home Delivery</strong> - Your order will be delivered soon</>
              )}
            </p>
            <p className="success-message">
              Thank you for your order. You will be redirected to your dashboard shortly.
            </p>
            <div className="success-spinner">
              <div className="spinner"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <div className="header-content">
          <button onClick={() => navigate('/shop')} className="back-btn">
            ← Back to Shop
          </button>
          <h1>Checkout</h1>
          <div></div>
        </div>
      </header>

      <main className="checkout-main">
        <div className="checkout-layout">
          {/* Left Side - Shipping Information */}
          <div className="checkout-left">
            <section className="shipping-section">
              <h2>Contact & Delivery Information</h2>

              {orderError && (
                <div className="error-banner">
                  <AlertTriangle size={16} className="error-icon" />
                  <span>{orderError}</span>
                </div>
              )}

              <form className="shipping-form">
                {/* Delivery Method Selection */}
                <div className="form-group">
                  <label>
                    Delivery Method <span className="required">*</span>
                  </label>
                  <div className="delivery-method-options">
                    <div
                      className={`delivery-option ${deliveryMethod === 'pickup' ? 'selected' : ''} ${errors.deliveryMethod && !deliveryMethod ? 'error' : ''}`}
                      onClick={() => {
                        setDeliveryMethod('pickup');
                        setErrors(prev => ({ ...prev, deliveryMethod: '' }));
                      }}
                    >
                      <div className="option-icon"><Store size={24} /></div>
                      <div className="option-content">
                        <h4>Pickup from Store</h4>
                        <p>Collect your order from our location</p>
                      </div>
                      <div className="option-radio">
                        {deliveryMethod === 'pickup' && <span className="radio-checked"><Check size={16} /></span>}
                      </div>
                    </div>

                    <div
                      className={`delivery-option ${deliveryMethod === 'shipping' ? 'selected' : ''} ${errors.deliveryMethod && !deliveryMethod ? 'error' : ''}`}
                      onClick={() => {
                        setDeliveryMethod('shipping');
                        setErrors(prev => ({ ...prev, deliveryMethod: '' }));
                      }}
                    >
                      <div className="option-icon"><Truck size={24} /></div>
                      <div className="option-content">
                        <h4>Home Delivery</h4>
                        <p>Get your order delivered to your address</p>
                      </div>
                      <div className="option-radio">
                        {deliveryMethod === 'shipping' && <span className="radio-checked"><Check size={16} /></span>}
                      </div>
                    </div>
                  </div>
                  {errors.deliveryMethod && (
                    <span className="error-message">{errors.deliveryMethod}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="fullName">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={shippingInfo.fullName}
                    onChange={handleInputChange}
                    className={errors.fullName ? 'error' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <span className="error-message">{errors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={shippingInfo.phone}
                    onChange={handleInputChange}
                    className={errors.phone ? 'error' : ''}
                    placeholder="0771234567"
                  />
                  {errors.phone && (
                    <span className="error-message">{errors.phone}</span>
                  )}
                </div>

                {/* Conditional Address Fields - Only show for shipping */}
                {deliveryMethod === 'shipping' && (
                  <>
                    <div className="form-group">
                      <label htmlFor="address">
                        Address <span className="required">*</span>
                      </label>
                      <textarea
                        id="address"
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleInputChange}
                        className={errors.address ? 'error' : ''}
                        placeholder="Enter your complete address"
                        rows={3}
                      />
                      {errors.address && (
                        <span className="error-message">{errors.address}</span>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="city">
                          City <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={shippingInfo.city}
                          onChange={handleInputChange}
                          className={errors.city ? 'error' : ''}
                          placeholder="Colombo"
                        />
                        {errors.city && (
                          <span className="error-message">{errors.city}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="postalCode">
                          Postal Code <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="postalCode"
                          name="postalCode"
                          value={shippingInfo.postalCode}
                          onChange={handleInputChange}
                          className={errors.postalCode ? 'error' : ''}
                          placeholder="10000"
                        />
                        {errors.postalCode && (
                          <span className="error-message">{errors.postalCode}</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Pickup Information */}
                {deliveryMethod === 'pickup' && (
                  <div className="pickup-info">
                    <div className="info-box">
                      <h4><MapPin size={16} /> Pickup Location</h4>
                      <p><strong>Japan Lanka Enterprises</strong></p>
                      <p>123 Galle Road, Colombo 03</p>
                      <p>Sri Lanka</p>
                      <br />
                      <h4><Clock size={16} /> Pickup Hours</h4>
                      <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
                      <p>Sunday: Closed</p>
                      <br />
                      <p className="info-note">
                        <Info size={14} /> Please bring your order confirmation and valid ID when picking up.
                      </p>
                    </div>
                  </div>
                )}
              </form>
            </section>
          </div>

          {/* Right Side - Order Summary */}
          <div className="checkout-right">
            <section className="order-summary-section">
              <h2>Order Summary</h2>

              <div className="order-items">
                {cart.map(item => (
                  <div key={item.id} className="order-item">
                    <div className="item-icon">{item.image && !item.image.startsWith('http') ? <Package size={24} /> : (item.image || <Package size={24} />)}</div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p className="item-model">{item.brand} {item.model}</p>
                      <p className="item-quantity">Qty: {item.quantity}</p>
                    </div>
                    <div className="item-price">
                      Rs. {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>Rs. {subtotal.toFixed(2)}</span>
                </div>
                {tax > 0 && (
                  <div className="total-row">
                    <span>Tax:</span>
                    <span>Rs. {tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="place-order-btn"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
