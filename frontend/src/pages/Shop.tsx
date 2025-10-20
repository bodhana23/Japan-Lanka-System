import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart, Product } from '../context/CartContext';
import './Shop.css';

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, getTotalPrice, getTotalItems } = useCart();
  const [showCart, setShowCart] = useState(false);

  // Vehicle parts inventory for demo - Sri Lankan realistic data
  const [products] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Brake Pads Set',
      model: 'Toyota Camry',
      modelYear: '2018-2023',
      price: 8500.00,
      quantityAvailable: 25,
      category: 'Brake System',
      image: '🔧',
      description: 'High-quality ceramic brake pads set (front) for Toyota Camry 2018-2023. Includes installation kit.'
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      model: 'Honda Civic',
      modelYear: '2016-2021',
      price: 1800.00,
      quantityAvailable: 40,
      category: 'Engine Parts',
      image: '⚙️',
      description: 'Premium oil filter for Honda Civic 2016-2021. OEM quality replacement part.'
    },
    {
      id: 'P003',
      name: 'LED Headlight Bulbs',
      model: 'BMW 3 Series',
      modelYear: '2019-2024',
      price: 12500.00,
      quantityAvailable: 15,
      category: 'Lighting',
      image: '💡',
      description: 'High-intensity LED headlight bulb set for BMW 3 Series 2019-2024. 6000K white light.'
    },
    {
      id: 'P004',
      name: 'Air Filter',
      model: 'Nissan Leaf',
      modelYear: '2018-2023',
      price: 2200.00,
      quantityAvailable: 30,
      category: 'Engine Parts',
      image: '🌪️',
      description: 'High-flow air filter for Nissan Leaf 2018-2023. Improves engine performance.'
    },
    {
      id: 'P005',
      name: 'Spark Plugs Set',
      model: 'Toyota Prius',
      modelYear: '2016-2022',
      price: 4500.00,
      quantityAvailable: 20,
      category: 'Engine Parts',
      image: '⚡',
      description: 'Iridium spark plugs set (4pc) for Toyota Prius 2016-2022. Long-lasting performance.'
    },
    {
      id: 'P006',
      name: 'Timing Belt Kit',
      model: 'Honda Accord',
      modelYear: '2013-2017',
      price: 15500.00,
      quantityAvailable: 8,
      category: 'Engine Parts',
      image: '⏰',
      description: 'Complete timing belt kit for Honda Accord 2013-2017. Includes tensioner and pulleys.'
    },
    {
      id: 'P007',
      name: 'Wiper Blade Set',
      model: 'Toyota Axio',
      modelYear: '2014-2021',
      price: 1200.00,
      quantityAvailable: 50,
      category: 'Accessories',
      image: '🌧️',
      description: 'Silicone wiper blade set for Toyota Axio 2014-2021. All-weather performance.'
    },
    {
      id: 'P008',
      name: 'Battery 12V 60Ah',
      model: 'Universal',
      modelYear: '2015-2025',
      price: 18500.00,
      quantityAvailable: 12,
      category: 'Electrical',
      image: '🔋',
      description: 'Maintenance-free car battery 12V 60Ah. 2-year warranty. Fits most Japanese vehicles.'
    }
  ]);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    navigate('/checkout');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="shop-container">
      <header className="shop-header">
        <div className="header-content">
          <h1>Japan Lanka Auto Parts</h1>
          <div className="header-actions">
            <button 
              onClick={() => setShowCart(!showCart)} 
              className="cart-btn"
            >
              🛒 Cart
              {getTotalItems() > 0 && (
                <span className="cart-badge">{getTotalItems()}</span>
              )}
            </button>
            <button onClick={handleBackToDashboard} className="back-btn">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="shop-main">
        <div className="shop-layout">
          {/* Products Section */}
          <section className="products-section">
            <h2>Available Parts</h2>
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-image">
                    <span className="product-icon">{product.image}</span>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-model">{product.model}</p>
                    <p className="product-year">Year: {product.modelYear}</p>
                    <p className="product-description">{product.description}</p>
                    <div className="product-details">
                      <span className="product-price">Rs. {product.price}</span>
                      <span className="product-stock">
                        Stock: {product.quantityAvailable}
                      </span>
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="add-to-cart-btn"
                      disabled={product.quantityAvailable === 0}
                    >
                      {product.quantityAvailable > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cart Sidebar */}
          {showCart && (
            <aside className="cart-sidebar">
              <div className="cart-header">
                <h3>Shopping Cart</h3>
                <button 
                  onClick={() => setShowCart(false)} 
                  className="close-cart"
                >
                  ×
                </button>
              </div>
              
              <div className="cart-items">
                {cart.length === 0 ? (
                  <p className="empty-cart">Your cart is empty</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-icon">{item.image}</span>
                        <div>
                          <h4>{item.name}</h4>
                          <p>{item.model}</p>
                          <span className="cart-item-price">Rs. {item.price}</span>
                        </div>
                      </div>
                      <div className="quantity-controls">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="quantity-btn"
                        >
                          -
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="quantity-btn"
                          disabled={item.quantity >= item.quantityAvailable}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="cart-footer">
                  <div className="cart-total">
                    <strong>Total: Rs. {getTotalPrice().toFixed(2)}</strong>
                  </div>
                  <button onClick={handleCheckout} className="checkout-btn">
                    Checkout
                  </button>
                </div>
              )}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
};

export default Shop;