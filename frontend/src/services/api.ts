import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: 'customer' | 'manager' | 'admin' | 'auditor';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  brand: string;
  model: string;
  year_from?: number;
  year_to?: number;
  category: string;
  price: number | string; // Backend returns Decimal which may serialize as string
  quantity_available: number;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  model?: string;
  year?: number;
  min_price?: number;
  max_price?: number;
  search?: string;
  page?: number;
  page_size?: number;
  include_inactive?: boolean;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'ready_to_pickup' | 'delivered' | 'cancelled';
  delivery_method: 'pickup' | 'shipping';
  total_amount: number;
  shipping_address?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  customer_phone: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer_name?: string;
  customer_email?: string;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateOrderItem {
  product_id: string;
  quantity: number;
}

export interface CreateOrderRequest {
  delivery_method: 'pickup' | 'shipping';
  customer_phone: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  notes?: string;
  items: CreateOrderItem[];
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// API Error type
export interface ApiError {
  detail: string;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API ============

export const authApi = {
  register: async (email: string, fullName: string, password: string, phoneNumber?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      full_name: fullName,
      password,
      phone_number: phoneNumber,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  googleAuth: async (firebaseToken: string, displayName?: string, email?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', {
      firebase_token: firebaseToken,
      name: displayName || '',
      email: email || '',
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  updateMe: async (data: { full_name?: string; phone_number?: string }): Promise<User> => {
    const response = await api.put<User>('/auth/me', data);
    return response.data;
  },
};

// ============ PRODUCTS API ============

export const productsApi = {
  getProducts: async (filters?: ProductFilters): Promise<ProductListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get<ProductListResponse>(`/products?${params.toString()}`);
    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (product: Omit<Product, 'id' | 'is_active' | 'created_at' | 'updated_at'>): Promise<Product> => {
    const response = await api.post<Product>('/products', product);
    return response.data;
  },

  updateProduct: async (id: string, product: Partial<Product>): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: string): Promise<Product> => {
    const response = await api.delete<Product>(`/products/${id}`);
    return response.data;
  },
};

// ============ ORDERS API ============

export const ordersApi = {
  getOrders: async (params?: {
    status?: string;
    delivery_method?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<OrderListResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get<OrderListResponse>(`/orders?${searchParams.toString()}`);
    return response.data;
  },

  getMyOrders: async (status?: string, page?: number, pageSize?: number): Promise<OrderListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', String(page));
    if (pageSize) params.append('page_size', String(pageSize));
    const response = await api.get<OrderListResponse>(`/orders/my-orders?${params.toString()}`);
    return response.data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const response = await api.get<Order>(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (order: CreateOrderRequest): Promise<Order> => {
    const response = await api.post<Order>('/orders', order);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: Order['status']): Promise<Order> => {
    const response = await api.put<Order>(`/orders/${id}/status`, { status });
    return response.data;
  },
};

// ============ USERS API ============

export const usersApi = {
  getUsers: async (params?: {
    role?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<UserListResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get<UserListResponse>(`/users?${searchParams.toString()}`);
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: string, role: User['role']): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/status`, { is_active: isActive });
    return response.data;
  },
};

export default api;
