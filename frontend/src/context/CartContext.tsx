import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import Toast from '../components/Toast';
import { cartApi, Cart as ApiCart, CartItem as ApiCartItem } from '../services/api';
import { AxiosError } from 'axios';

// Helper to check if error is a network/connection error
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof AxiosError) {
    // ERR_NETWORK, ERR_CONNECTION_REFUSED, ECONNREFUSED, timeout
    return (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('Network Error') ||
      error.response === undefined
    );
  }
  return false;
};

// Local product type (for guest cart)
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

// Unified cart item (works for both guest and logged-in users)
export interface CartItem {
  id: string;           // product_id for guest, cart_item_id for logged-in
  productId: string;    // Always the product ID
  name: string;
  brand: string;
  model: string;
  price: number;
  quantity: number;
  quantityAvailable: number;
  image?: string;
}

interface CartContextType {
  cart: CartItem[];
  isLoading: boolean;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  syncCartFromApi: () => Promise<void>;
  mergeLocalCartToServer: () => Promise<void>;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper to check if user is logged in
const isLoggedIn = (): boolean => {
  return !!localStorage.getItem('token');
};

// Helper to check if the logged-in user is a customer
// Cart functionality should ONLY work for customers, not employees
const isCustomerLoggedIn = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  const storedUser = localStorage.getItem('currentUser');
  if (!storedUser) return false;

  try {
    const user = JSON.parse(storedUser);
    return user.role === 'customer';
  } catch {
    return false;
  }
};

// Convert API cart item to unified format
const apiCartItemToCartItem = (item: ApiCartItem): CartItem => ({
  id: item.id,
  productId: item.product_id,
  name: item.product_name,
  brand: item.product_brand,
  model: '',
  price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
  quantity: item.quantity,
  quantityAvailable: item.available_stock,
  image: item.product_image_url,
});

// Convert Product to CartItem for guest cart
const productToCartItem = (product: Product, quantity: number): CartItem => ({
  id: product.id,  // Use product ID as item ID for guest cart
  productId: product.id,
  name: product.name,
  brand: product.brand || '',
  model: product.model,
  price: product.price,
  quantity,
  quantityAvailable: product.quantityAvailable,
  image: product.image,
});

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info'
  });

  // Track if backend is reachable to prevent repeated error spam
  const backendAvailable = useRef<boolean>(true);
  const lastNetworkErrorTime = useRef<number>(0);

  // Throttle network error logs (max once per 30 seconds)
  const logNetworkError = (context: string) => {
    const now = Date.now();
    if (now - lastNetworkErrorTime.current > 30000) {
      console.warn(`[Cart] Backend unreachable during ${context}. Using local cart.`);
      lastNetworkErrorTime.current = now;
    }
  };

  // Helper to add product to local cart (used when backend is unreachable)
  const addToLocalCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.quantityAvailable) {
        setCart(cart.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
        showToast(`${product.name} quantity updated! (offline mode)`, 'success');
      } else {
        showToast('Maximum quantity reached for this item', 'error');
      }
    } else {
      setCart([...cart, productToCartItem(product, 1)]);
      showToast(`${product.name} added to cart! (offline mode)`, 'success');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  // Load cart from sessionStorage (for guests) on initialization
  useEffect(() => {
    if (!isLoggedIn()) {
      try {
        const savedCart = sessionStorage.getItem('cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          // Convert old format to new unified format if needed
          const convertedCart = parsedCart.map((item: any) => ({
            id: item.id || item.productId,
            productId: item.productId || item.id,
            name: item.name,
            brand: item.brand || '',
            model: item.model || '',
            price: item.price,
            quantity: item.quantity,
            quantityAvailable: item.quantityAvailable || item.quantityAvailable || 999,
            image: item.image,
          }));
          setCart(convertedCart);
        }
      } catch (error) {
        console.error('Error loading cart from sessionStorage:', error);
      }
    }
  }, []);

  // Save guest cart to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoggedIn() && cart.length >= 0) {
      try {
        sessionStorage.setItem('cart', JSON.stringify(cart));
      } catch (error) {
        console.error('Error saving cart to sessionStorage:', error);
      }
    }
  }, [cart]);

  // Sync cart from API (for logged-in CUSTOMERS only)
  const syncCartFromApi = useCallback(async () => {
    if (!isCustomerLoggedIn()) return;

    // Skip if backend was recently unreachable
    if (!backendAvailable.current) {
      // Load from sessionStorage fallback
      try {
        const savedCart = sessionStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch {
        // Ignore parsing errors
      }
      return;
    }

    setIsLoading(true);
    try {
      const apiCart = await cartApi.getCart();
      const cartItems = apiCart.items.map(apiCartItemToCartItem);
      setCart(cartItems);
      backendAvailable.current = true; // Backend is responding
    } catch (error) {
      if (isNetworkError(error)) {
        backendAvailable.current = false;
        logNetworkError('syncCartFromApi');
        // Fallback to sessionStorage cart
        try {
          const savedCart = sessionStorage.getItem('cart');
          if (savedCart) {
            setCart(JSON.parse(savedCart));
          }
        } catch {
          // Ignore parsing errors
        }
      } else {
        // Non-network error, log it
        console.error('Error syncing cart from API:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Merge local cart to server when CUSTOMER logs in
  const mergeLocalCartToServer = useCallback(async () => {
    if (!isCustomerLoggedIn()) return;

    // Skip if backend is known to be unavailable
    if (!backendAvailable.current) {
      logNetworkError('mergeLocalCartToServer');
      // Keep using local cart
      try {
        const savedCart = sessionStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch {
        // Ignore parsing errors
      }
      return;
    }

    const localCart = sessionStorage.getItem('cart');
    if (!localCart) {
      // No local cart, just sync from server
      await syncCartFromApi();
      return;
    }

    try {
      const localItems = JSON.parse(localCart);
      if (localItems.length === 0) {
        await syncCartFromApi();
        return;
      }

      setIsLoading(true);

      // Add each local item to server cart
      for (const item of localItems) {
        try {
          const productId = item.productId || item.id;
          await cartApi.addItem(productId, item.quantity);
        } catch (error) {
          if (isNetworkError(error)) {
            backendAvailable.current = false;
            logNetworkError('mergeLocalCartToServer item add');
            // Keep local cart, don't clear it
            setCart(localItems);
            return;
          }
          console.error(`Error adding item ${item.name} to server cart:`, error);
        }
      }

      // Clear local cart after successful merge
      sessionStorage.removeItem('cart');

      // Sync the merged cart from server
      await syncCartFromApi();
      showToast('Your cart has been synced!', 'success');
    } catch (error) {
      if (isNetworkError(error)) {
        backendAvailable.current = false;
        logNetworkError('mergeLocalCartToServer');
      } else {
        console.error('Error merging local cart to server:', error);
      }
      // If merge fails, keep using local cart
      try {
        const savedCart = sessionStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      } catch {
        // Ignore parsing errors
      }
    } finally {
      setIsLoading(false);
    }
  }, [syncCartFromApi]);

  const addToCart = async (product: Product): Promise<void> => {
    if (!product || !product.id || typeof product.price !== 'number' || product.price < 0) {
      showToast('Invalid product data. Please try again.', 'error');
      return;
    }

    if (product.quantityAvailable <= 0) {
      showToast('This item is out of stock.', 'error');
      return;
    }

    if (isCustomerLoggedIn() && backendAvailable.current) {
      // Customer logged in and backend available: Use API
      setIsLoading(true);
      try {
        const updatedCart = await cartApi.addItem(product.id, 1);
        setCart(updatedCart.items.map(apiCartItemToCartItem));
        showToast(`${product.name} added to cart!`, 'success');
        backendAvailable.current = true;
      } catch (error: any) {
        if (isNetworkError(error)) {
          backendAvailable.current = false;
          logNetworkError('addToCart');
          // Fallback to local cart behavior
          addToLocalCart(product);
        } else {
          const message = error.response?.data?.detail || 'Failed to add item to cart';
          showToast(message, 'error');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest: Use local state
      const existingItem = cart.find(item => item.productId === product.id);

      if (existingItem) {
        if (existingItem.quantity < product.quantityAvailable) {
          setCart(cart.map(item =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ));
          showToast(`${product.name} quantity updated!`, 'success');
        } else {
          showToast('Maximum quantity reached for this item', 'error');
        }
      } else {
        setCart([...cart, productToCartItem(product, 1)]);
        showToast(`${product.name} added to cart!`, 'success');
      }
    }
  };

  const removeFromCart = async (itemId: string): Promise<void> => {
    if (isCustomerLoggedIn() && backendAvailable.current) {
      setIsLoading(true);
      try {
        const updatedCart = await cartApi.removeItem(itemId);
        setCart(updatedCart.items.map(apiCartItemToCartItem));
        showToast('Item removed from cart', 'info');
        backendAvailable.current = true;
      } catch (error: any) {
        if (isNetworkError(error)) {
          backendAvailable.current = false;
          logNetworkError('removeFromCart');
          // Fallback to local removal
          setCart(cart.filter(item => item.id !== itemId && item.productId !== itemId));
          showToast('Item removed from cart (offline mode)', 'info');
        } else {
          const message = error.response?.data?.detail || 'Failed to remove item';
          showToast(message, 'error');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest or backend unavailable: Remove by productId (which is the id for guest cart)
      setCart(cart.filter(item => item.id !== itemId && item.productId !== itemId));
      showToast('Item removed from cart', 'info');
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number): Promise<void> => {
    if (typeof newQuantity !== 'number' || newQuantity < 0) {
      showToast('Invalid quantity update request.', 'error');
      return;
    }

    if (newQuantity === 0) {
      await removeFromCart(itemId);
      return;
    }

    if (isCustomerLoggedIn() && backendAvailable.current) {
      setIsLoading(true);
      try {
        const updatedCart = await cartApi.updateItem(itemId, newQuantity);
        setCart(updatedCart.items.map(apiCartItemToCartItem));
        backendAvailable.current = true;
      } catch (error: any) {
        if (isNetworkError(error)) {
          backendAvailable.current = false;
          logNetworkError('updateQuantity');
          // Fallback to local update
          updateLocalQuantity(itemId, newQuantity);
        } else {
          const message = error.response?.data?.detail || 'Failed to update quantity';
          showToast(message, 'error');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Guest or backend unavailable: Update locally
      updateLocalQuantity(itemId, newQuantity);
    }
  };

  // Helper to update quantity locally
  const updateLocalQuantity = (itemId: string, newQuantity: number) => {
    const item = cart.find(i => i.id === itemId || i.productId === itemId);
    if (!item) {
      showToast('Product not found in cart.', 'error');
      return;
    }

    if (newQuantity > item.quantityAvailable) {
      showToast('Cannot exceed available stock quantity.', 'error');
      return;
    }

    setCart(cart.map(item =>
      (item.id === itemId || item.productId === itemId)
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const clearCart = async (): Promise<void> => {
    if (isCustomerLoggedIn() && backendAvailable.current) {
      setIsLoading(true);
      try {
        await cartApi.clearCart();
        setCart([]);
        sessionStorage.removeItem('cart');
        backendAvailable.current = true;
      } catch (error) {
        if (isNetworkError(error)) {
          backendAvailable.current = false;
          logNetworkError('clearCart');
          // Clear locally anyway
          setCart([]);
          sessionStorage.removeItem('cart');
        } else {
          console.error('Error clearing cart:', error);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setCart([]);
      sessionStorage.removeItem('cart');
    }
  };

  const getTotalPrice = (): number => {
    if (!Array.isArray(cart)) return 0;

    return cart.reduce((total, item) => {
      if (!item || typeof item !== 'object') return total;

      const price = typeof item.price === 'number' && !isNaN(item.price) && item.price >= 0 ? item.price : 0;
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity >= 0 ? item.quantity : 0;

      return total + (price * quantity);
    }, 0);
  };

  const getTotalItems = (): number => {
    if (!Array.isArray(cart)) return 0;

    return cart.reduce((total, item) => {
      if (!item || typeof item !== 'object') return total;

      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity >= 0 ? item.quantity : 0;
      return total + quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        syncCartFromApi,
        mergeLocalCartToServer,
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
