import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Toast from '../components/Toast';

export interface Product {
  id: string;
  name: string;
  model: string;
  modelYear: string;
  price: number;
  quantityAvailable: number;
  category: string;
  image: string;
  description: string;
  brand?: string;
  yearFrom?: number;
  yearTo?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Load cart from sessionStorage on initialization
    try {
      const savedCart = sessionStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from sessionStorage:', error);
      return [];
    }
  });

  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  // Save cart to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to sessionStorage:', error);
    }
  }, [cart]);

  const addToCart = (product: Product) => {
    if (!product || !product.id || typeof product.price !== 'number' || product.price < 0) {
      showToast('Invalid product data. Please try again.', 'error');
      return;
    }

    if (product.quantityAvailable <= 0) {
      showToast('This item is out of stock.', 'error');
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.quantityAvailable) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        showToast(`${product.name} quantity updated!`, 'success');
      } else {
        showToast('Maximum quantity reached for this item', 'error');
      }
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
      showToast(`${product.name} added to cart!`, 'success');
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (!productId || typeof newQuantity !== 'number' || newQuantity < 0) {
      showToast('Invalid quantity update request.', 'error');
      return;
    }

    if (newQuantity === 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find(i => i.id === productId);
    if (!item) {
      showToast('Product not found in cart.', 'error');
      return;
    }

    if (newQuantity > item.quantityAvailable) {
      showToast('Cannot exceed available stock quantity.', 'error');
      return;
    }
    
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
    sessionStorage.removeItem('cart');
  };

  const getTotalPrice = () => {
    if (!Array.isArray(cart)) {
      return 0;
    }
    
    return cart.reduce((total, item) => {
      if (!item || typeof item !== 'object') {
        return total;
      }
      
      const price = typeof item.price === 'number' && !isNaN(item.price) && item.price >= 0 ? item.price : 0;
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity >= 0 ? item.quantity : 0;
      
      return total + (price * quantity);
    }, 0);
  };

  const getTotalItems = () => {
    if (!Array.isArray(cart)) {
      return 0;
    }
    
    return cart.reduce((total, item) => {
      if (!item || typeof item !== 'object') {
        return total;
      }
      
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity >= 0 ? item.quantity : 0;
      return total + quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
