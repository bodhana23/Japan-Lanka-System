import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Shop.css';

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

interface CartItem extends Product {
  quantity: number;
}

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Vehicle parts inventory for demo
  const [products] = useState<Product[]>([
    {
      id: 'P001',
      name: 'Brake Pads Set',
      model: 'Toyota Camry',
      modelYear: '2018-2023',
      price: 4500.00,
      quantityAvailable: 25,
      category: 'Brake System',
      image: '🔧',
      description: 'High-quality ceramic brake pads for Toyota Camry 2018-2023'
    },
    {
      id: 'P002',
      name: 'Engine Oil Filter',
      model: 'Honda Civic',
      modelYear: '2016-2021',
      price: 1200.00,
      quantityAvailable: 2,
      category: 'Engine Parts',
      image: '⚙️',
      description: 'Premium oil filter for Honda Civic 2016-2021'
    },
    {
      id: 'P003',
      name: 'LED Headlight Bulbs',
      model: 'BMW 3 Series',
      modelYear: '2019-2024',
      price: 2800.00,
      quantityAvailable: 1,
      category: 'Lighting',
      image: '💡',
      description: 'LED headlight bulb set for BMW 3 Series 2019-2024'
    },
    {
      id: 'P004',
      name: 'Air Filter',
      model: 'Ford Focus',
      modelYear: '2015-2020',
      price: 1850.00,
      quantityAvailable: 30,
      category: 'Engine Parts',
      image: '🌪️',
      description: 'High-flow air filter for Ford Focus 2015-2020'
    },
    {
      id: 'P005',
      name: 'Spark Plugs Set',
      model: 'Nissan Altima',
      modelYear: '2017-2022',
      price: 3200.00,
      quantityAvailable: 15,
      category: 'Engine Parts',
      image: '⚡',
      description: 'Iridium spark plugs for Nissan Altima 2017-2022'
    },
    {
      id: 'P006',
      name: 'Timing Belt',
      model: 'Honda Accord',
      modelYear: '2013-2017',
      price: 5500.00,
      quantityAvailable: 8,
      category: 'Engine Parts',
      image: '⏰',
      description: 'Timing belt kit for Honda Accord 2013-2017'
    }
  ]);

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.quantityAvailable) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        alert('Maximum quantity reached for this item');
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter(item => item.id !== productId));
    } else {
      setCart(cart.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    
    alert(`Order placed successfully! Total: Rs. ${getTotalPrice().toFixed(2)}`);
    setCart([]);
    navigate('/dashboard');
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
              🛒 Cart ({getTotalItems()})
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