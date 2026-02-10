import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersApi, District, InitiateCheckoutResponse, PayHereFormData } from '../services/api';
import { Store, Truck, MapPin, Clock, Info, AlertTriangle, Package, Check, CheckCircle, ShoppingBag, ArrowLeft, Shield, CreditCard, Wallet, Banknote } from 'lucide-react';
import './Checkout.css';

interface ShippingInfo {
  fullName: string;
  phone: string;
  district: string;
  address: string;
  city: string;
  postalCode: string;
}

interface FormErrors {
  [key: string]: string;
}

type DeliveryMethod = 'pickup' | 'shipping';
type PaymentOption = 'full' | 'minimum' | 'none';

// PayHere sandbox URL
const PAYHERE_CHECKOUT_URL = 'https://sandbox.payhere.lk/pay/checkout';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('full');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const payhereFormRef = useRef<HTMLFormElement>(null);
  const [payhereFormData, setPayhereFormData] = useState<PayHereFormData | null>(null);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    fullName: '',
    phone: '',
    district: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Load districts on mount
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const response = await ordersApi.getDistricts();
        setDistricts(response.districts);
      } catch (error) {
        console.error('Failed to load districts:', error);
      }
    };
    loadDistricts();
  }, []);

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

  // Update delivery fee when district changes
  useEffect(() => {
    if (shippingInfo.district && deliveryMethod === 'shipping') {
      const selectedDistrict = districts.find(d => d.name === shippingInfo.district);
      setDeliveryFee(selectedDistrict?.delivery_fee || 0);
    } else {
      setDeliveryFee(0);
    }
  }, [shippingInfo.district, deliveryMethod, districts]);

  // Submit PayHere form when data is ready
  useEffect(() => {
    if (payhereFormData && payhereFormRef.current) {
      payhereFormRef.current.submit();
    }
  }, [payhereFormData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      if (!shippingInfo.district) {
        newErrors.district = 'District is required for delivery';
      }

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

      // Payment validation for shipping - must pay at least minimum
      if (paymentOption === 'none') {
        newErrors.paymentOption = 'Payment is required for delivery orders';
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
      // Build checkout request
      const checkoutRequest = {
        delivery_method: deliveryMethod!,
        shipping_district: deliveryMethod === 'shipping' ? shippingInfo.district : undefined,
        shipping_address: deliveryMethod === 'shipping' ? shippingInfo.address : undefined,
        shipping_city: deliveryMethod === 'shipping' ? shippingInfo.city : undefined,
        shipping_postal_code: deliveryMethod === 'shipping' ? shippingInfo.postalCode : undefined,
        notes: undefined,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        })),
        pay_full_amount: paymentOption === 'full',
        skip_payment: paymentOption === 'none'
      };

      // Initiate checkout
      const response: InitiateCheckoutResponse = await ordersApi.initiateCheckout(checkoutRequest);

      if (response.requires_payment && response.payhere_form_data) {
        // Redirect to PayHere
        setPayhereFormData(response.payhere_form_data);
        // Clear cart after initiating payment
        await clearCart();
      } else {
        // Order placed without payment (pickup without payment)
        await clearCart();
        setOrderId(response.order_id.substring(0, 8).toUpperCase());
        setShowSuccessModal(true);

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/customer');
        }, 3000);
      }

    } catch (error: any) {
      console.error('Error placing order:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to place order. Please try again.';
      setOrderError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;
  const minimumPayment = Math.ceil(total * 0.30 * 100) / 100; // 30% rounded up
  const payNowAmount = paymentOption === 'full' ? total : paymentOption === 'minimum' ? minimumPayment : 0;
  const remainingCOD = total - payNowAmount;

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
      {/* Hidden PayHere Form */}
      {payhereFormData && (
        <form
          ref={payhereFormRef}
          method="post"
          action={PAYHERE_CHECKOUT_URL}
          style={{ display: 'none' }}
        >
          <input type="hidden" name="merchant_id" value={payhereFormData.merchant_id} />
          <input type="hidden" name="return_url" value={payhereFormData.return_url} />
          <input type="hidden" name="cancel_url" value={payhereFormData.cancel_url} />
          <input type="hidden" name="notify_url" value={payhereFormData.notify_url} />
          <input type="hidden" name="order_id" value={payhereFormData.order_id} />
          <input type="hidden" name="items" value={payhereFormData.items} />
          <input type="hidden" name="currency" value={payhereFormData.currency} />
          <input type="hidden" name="amount" value={payhereFormData.amount} />
          <input type="hidden" name="first_name" value={payhereFormData.first_name} />
          <input type="hidden" name="last_name" value={payhereFormData.last_name} />
          <input type="hidden" name="email" value={payhereFormData.email} />
          <input type="hidden" name="phone" value={payhereFormData.phone} />
          <input type="hidden" name="address" value={payhereFormData.address} />
          <input type="hidden" name="city" value={payhereFormData.city} />
          <input type="hidden" name="country" value={payhereFormData.country} />
          {payhereFormData.hash && (
            <input type="hidden" name="hash" value={payhereFormData.hash} />
          )}
        </form>
      )}

      <header className="checkout-header">
        <div className="header-content">
          <button onClick={() => navigate('/shop')} className="back-btn">
            <ArrowLeft size={18} />
            <span>Back to Shop</span>
          </button>
          <h1 style={{ color: '#ffffff' }}><ShoppingBag size={24} color="#ffffff" /> Checkout</h1>
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
                        setPaymentOption('none'); // Default to no payment for pickup
                        setErrors(prev => ({ ...prev, deliveryMethod: '' }));
                      }}
                    >
                      <div className="option-icon"><Store size={24} /></div>
                      <div className="option-content">
                        <h4>Pickup from Store</h4>
                        <p>Collect your order from our location</p>
                        <span className="option-badge free">No Delivery Fee</span>
                      </div>
                      <div className="option-radio">
                        {deliveryMethod === 'pickup' && <span className="radio-checked"><Check size={16} /></span>}
                      </div>
                    </div>

                    <div
                      className={`delivery-option ${deliveryMethod === 'shipping' ? 'selected' : ''} ${errors.deliveryMethod && !deliveryMethod ? 'error' : ''}`}
                      onClick={() => {
                        setDeliveryMethod('shipping');
                        setPaymentOption('full'); // Default to full payment for shipping
                        setErrors(prev => ({ ...prev, deliveryMethod: '' }));
                      }}
                    >
                      <div className="option-icon"><Truck size={24} /></div>
                      <div className="option-content">
                        <h4>Home Delivery</h4>
                        <p>Get your order delivered to your address</p>
                        <span className="option-badge">Fee based on district</span>
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
                      <label htmlFor="district">
                        District <span className="required">*</span>
                      </label>
                      <select
                        id="district"
                        name="district"
                        value={shippingInfo.district}
                        onChange={handleInputChange}
                        className={errors.district ? 'error' : ''}
                      >
                        <option value="">Select your district</option>
                        {districts.map(district => (
                          <option key={district.name} value={district.name}>
                            {district.name} - Rs. {district.delivery_fee.toFixed(2)}
                          </option>
                        ))}
                      </select>
                      {errors.district && (
                        <span className="error-message">{errors.district}</span>
                      )}
                      {shippingInfo.district && (
                        <span className="field-hint">
                          Delivery fee: Rs. {deliveryFee.toFixed(2)}
                        </span>
                      )}
                    </div>

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

                    {/* Payment Options for Delivery */}
                    <div className="form-group">
                      <label>
                        Payment Option <span className="required">*</span>
                      </label>
                      <div className="payment-options">
                        <div
                          className={`payment-option ${paymentOption === 'full' ? 'selected' : ''}`}
                          onClick={() => setPaymentOption('full')}
                        >
                          <div className="option-icon"><CreditCard size={20} /></div>
                          <div className="option-content">
                            <h4>Pay Full Amount</h4>
                            <p>Rs. {total.toFixed(2)}</p>
                          </div>
                          <div className="option-radio">
                            {paymentOption === 'full' && <span className="radio-checked"><Check size={16} /></span>}
                          </div>
                        </div>

                        <div
                          className={`payment-option ${paymentOption === 'minimum' ? 'selected' : ''}`}
                          onClick={() => setPaymentOption('minimum')}
                        >
                          <div className="option-icon"><Wallet size={20} /></div>
                          <div className="option-content">
                            <h4>Pay 30% Now (Minimum)</h4>
                            <p>Rs. {minimumPayment.toFixed(2)} now, Rs. {(total - minimumPayment).toFixed(2)} on delivery</p>
                          </div>
                          <div className="option-radio">
                            {paymentOption === 'minimum' && <span className="radio-checked"><Check size={16} /></span>}
                          </div>
                        </div>
                      </div>
                      {errors.paymentOption && (
                        <span className="error-message">{errors.paymentOption}</span>
                      )}
                    </div>
                  </>
                )}

                {/* Pickup Information */}
                {deliveryMethod === 'pickup' && (
                  <>
                    <div className="pickup-info">
                      <div className="info-box">
                        <h4><MapPin size={16} /> Pickup Location</h4>
                        <p><strong>Japan Lanka Enterprises</strong></p>
                        <p>Matara-Hakmana Rd, Thihagoda 81000</p>
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

                    {/* Payment Options for Pickup (Optional) */}
                    <div className="form-group">
                      <label>
                        Payment Option <span className="optional">(Optional)</span>
                      </label>
                      <div className="payment-options">
                        <div
                          className={`payment-option ${paymentOption === 'none' ? 'selected' : ''}`}
                          onClick={() => setPaymentOption('none')}
                        >
                          <div className="option-icon"><Banknote size={20} /></div>
                          <div className="option-content">
                            <h4>Pay at Pickup</h4>
                            <p>Pay Rs. {total.toFixed(2)} when you collect</p>
                          </div>
                          <div className="option-radio">
                            {paymentOption === 'none' && <span className="radio-checked"><Check size={16} /></span>}
                          </div>
                        </div>

                        <div
                          className={`payment-option ${paymentOption === 'full' ? 'selected' : ''}`}
                          onClick={() => setPaymentOption('full')}
                        >
                          <div className="option-icon"><CreditCard size={20} /></div>
                          <div className="option-content">
                            <h4>Pay Now</h4>
                            <p>Pay Rs. {total.toFixed(2)} online</p>
                          </div>
                          <div className="option-radio">
                            {paymentOption === 'full' && <span className="radio-checked"><Check size={16} /></span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
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
                    <div className="item-icon" style={{ width: '80px', minWidth: '80px', height: '80px', minHeight: '80px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', border: '1px solid #dee2e6', borderRadius: '8px', padding: 0 }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="item-image" style={{ width: '100%', height: '100%', minWidth: '80px', minHeight: '80px', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <Package size={32} color="#6c757d" />
                      )}
                    </div>
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
                {deliveryMethod === 'shipping' && (
                  <div className="total-row">
                    <span>Delivery Fee:</span>
                    <span>Rs. {deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>

                {/* Payment Breakdown */}
                {deliveryMethod && paymentOption !== 'none' && (
                  <>
                    <div className="payment-breakdown">
                      <div className="total-row pay-now">
                        <span><CreditCard size={14} /> Pay Now:</span>
                        <span className="highlight">Rs. {payNowAmount.toFixed(2)}</span>
                      </div>
                      {remainingCOD > 0 && (
                        <div className="total-row cod">
                          <span><Banknote size={14} /> Cash on Delivery:</span>
                          <span>Rs. {remainingCOD.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {deliveryMethod === 'pickup' && paymentOption === 'none' && (
                  <div className="payment-breakdown">
                    <div className="total-row cod">
                      <span><Banknote size={14} /> Pay at Pickup:</span>
                      <span>Rs. {total.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handlePlaceOrder}
                className="place-order-btn"
                disabled={isProcessing || !deliveryMethod}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner-small"></span>
                    Processing...
                  </>
                ) : paymentOption === 'none' ? (
                  <>
                    <ShoppingBag size={20} />
                    Place Order
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay Rs. {payNowAmount.toFixed(2)}
                  </>
                )}
              </button>

              <div className="secure-checkout-badge">
                <Shield size={16} />
                <span>Secure Checkout via PayHere</span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
