import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import './DashboardCart.css';

type NavItemId = 'overview' | 'orders' | 'order-details' | 'returns' | 'cart' | 'profile' | 'change-password';

interface DashboardCartProps {
  onNavigate: (section: NavItemId) => void;
}

const DashboardCart: React.FC<DashboardCartProps> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const { cart: items, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(id, newQuantity);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  return (
    <div className="dcart-container">
      {/* Page Header */}
      <div className="dcart-page-header">
        <div className="dcart-header-info">
          <h2 className="dcart-page-title">
            <ShoppingCart size={24} className="dcart-title-icon" />
            Shopping Cart
          </h2>
          <p className="dcart-page-subtitle">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.length} item${items.length > 1 ? 's' : ''} in your cart`
            }
          </p>
        </div>
        {items.length > 0 && (
          <button className="dcart-clear-btn" onClick={clearCart}>
            <Trash2 size={18} />
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="dcart-empty">
          <ShoppingBag size={64} className="dcart-empty-icon" />
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any items to your cart yet.</p>
          <button className="dcart-shop-btn" onClick={handleContinueShopping}>
            <ShoppingCart size={20} />
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="dcart-content">
          {/* Cart Items */}
          <div className="dcart-items-section">
            <div className="dcart-items-list">
              {items.map((item) => (
                <div key={item.id} className="dcart-item-card">
                  <div className="dcart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="dcart-item-placeholder">
                        <ShoppingBag size={32} />
                      </div>
                    )}
                  </div>
                  <div className="dcart-item-details">
                    <h4 className="dcart-item-name">{item.name}</h4>
                    <p className="dcart-item-price">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="dcart-item-quantity">
                    <button
                      className="dcart-qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="dcart-qty-value">{item.quantity}</span>
                    <button
                      className="dcart-qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="dcart-item-subtotal">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                  <button
                    className="dcart-remove-btn"
                    onClick={() => removeFromCart(item.id)}
                    title="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="dcart-summary-section">
            <div className="dcart-summary-card">
              <h3 className="dcart-summary-title">Order Summary</h3>

              <div className="dcart-summary-rows">
                <div className="dcart-summary-row">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="dcart-summary-row">
                  <span>Shipping</span>
                  <span className="dcart-shipping-note">Calculated at checkout</span>
                </div>
              </div>

              <div className="dcart-summary-total">
                <span>Total</span>
                <span className="dcart-total-amount">{formatCurrency(getTotalPrice())}</span>
              </div>

              <button className="dcart-checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <button className="dcart-continue-btn" onClick={handleContinueShopping}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCart;
