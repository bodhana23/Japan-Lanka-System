import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: 'customer' | 'manager' | 'admin' | 'auditor';
  is_active: boolean;
  is_google_user?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Employee {
  id: string;
  email: string;
  full_name: string;
  role: 'MANAGER' | 'ADMIN' | 'AUDITOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAuthResponse {
  access_token: string;
  token_type: string;
  user_type: string;
  role: string;
  user: Employee;
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
  shipping_address?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  notes?: string;
  items: CreateOrderItem[];
}

// Cart types
export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_image_url?: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  available_stock: number;
  created_at: string;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_items: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'order_update' | 'return_update' | 'system' | 'promotion';
  is_read: boolean;
  related_order_id?: string;
  related_return_id?: string;
  created_at: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Return Request types
export interface ReturnItem {
  id: string;
  order_item_id: string;
  quantity: number;
  created_at: string;
  product_id?: string;
  product_name?: string;
  unit_price?: number;
  original_quantity?: number;
}

export interface ReturnItemCreate {
  order_item_id: string;
  quantity: number;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  order_total?: number;
  order_status?: string;
  order_date?: string;
  customer_name?: string;
  customer_email?: string;
  items: ReturnItem[];
}

export interface ReturnRequestListResponse {
  items: ReturnRequest[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateReturnRequest {
  order_id: string;
  reason: string;
  description?: string;
  items: ReturnItemCreate[];
}

// Eligible order types for returns
export interface EligibleOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  already_returned_quantity: number;
  returnable_quantity: number;
}

export interface EligibleOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_method: string;
  items: EligibleOrderItem[];
  has_pending_return: boolean;
}

export interface EligibleOrdersResponse {
  items: EligibleOrder[];
  total: number;
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
    const response = await api.post<AuthResponse>('/auth/customer/register', {
      email,
      full_name: fullName,
      password,
      phone_number: phoneNumber,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/customer/login', {
      email,
      password,
    });
    return response.data;
  },

  googleAuth: async (firebaseToken: string, displayName?: string, email?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/customer/google', {
      firebase_token: firebaseToken,
      name: displayName || '',
      email: email || '',
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/customer/profile');
    return response.data;
  },

  updateMe: async (data: { full_name?: string; phone_number?: string }): Promise<User> => {
    const response = await api.put<User>('/auth/customer/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/auth/customer/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/customer/forgot-password', {
      email,
    });
    return response.data;
  },

  resendVerificationEmail: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/customer/resend-verification', {
      email,
    });
    return response.data;
  },

  completeRegistration: async (
    email: string,
    password: string,
    fullName: string,
    phoneNumber?: string | null
  ): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/customer/complete-registration', {
      email,
      password,
      full_name: fullName,
      phone_number: phoneNumber,
    });
    return response.data;
  },
};

// ============ EMPLOYEE AUTH API ============

export const employeeAuthApi = {
  login: async (email: string, password: string): Promise<EmployeeAuthResponse> => {
    const response = await api.post<EmployeeAuthResponse>('/auth/employee/login', {
      email,
      password,
    });
    return response.data;
  },

  getProfile: async (): Promise<Employee> => {
    const response = await api.get<Employee>('/auth/employee/profile');
    return response.data;
  },

  updateProfile: async (data: { full_name?: string }): Promise<Employee> => {
    const response = await api.put<Employee>('/auth/employee/profile', data);
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

  deleteCustomer: async (id: string): Promise<{ message: string; deleted_id: string }> => {
    const response = await api.delete<{ message: string; deleted_id: string }>(`/users/customer/${id}`);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<{ message: string; deleted_id: string }> => {
    const response = await api.delete<{ message: string; deleted_id: string }>(`/users/employee/${id}`);
    return response.data;
  },

  createStaff: async (data: {
    email: string;
    full_name: string;
    password: string;
    role: 'MANAGER' | 'AUDITOR';
  }): Promise<{
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    message: string;
  }> => {
    const response = await api.post('/users/staff', data);
    return response.data;
  },

  getEmployees: async (params?: {
    role?: string;
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Employee[]; total: number; page: number; page_size: number; total_pages: number }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/users/employees?${searchParams.toString()}`);
    return response.data;
  },

  updateEmployeeStatus: async (id: string, isActive: boolean): Promise<Employee> => {
    const response = await api.put<Employee>(`/users/employee/${id}/status`, { is_active: isActive });
    return response.data;
  },

  getCustomers: async (params?: {
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Customer[]; total: number; page: number; page_size: number; total_pages: number }> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/users/customers?${searchParams.toString()}`);
    return response.data;
  },

  updateCustomerStatus: async (id: string, isActive: boolean): Promise<Customer> => {
    const response = await api.put<Customer>(`/users/customer/${id}/status`, { is_active: isActive });
    return response.data;
  },
};

// ============ RETURNS API ============

export const returnsApi = {
  getMyReturns: async (status?: string, page?: number, pageSize?: number): Promise<ReturnRequestListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', String(page));
    if (pageSize) params.append('page_size', String(pageSize));
    const response = await api.get<ReturnRequestListResponse>(`/returns/my-requests?${params.toString()}`);
    return response.data;
  },

  getEligibleOrders: async (): Promise<EligibleOrdersResponse> => {
    const response = await api.get<EligibleOrdersResponse>('/returns/eligible-orders');
    return response.data;
  },

  createReturn: async (data: CreateReturnRequest): Promise<ReturnRequest> => {
    const response = await api.post<ReturnRequest>('/returns', data);
    return response.data;
  },

  getAllReturns: async (status?: string, page?: number, pageSize?: number): Promise<ReturnRequestListResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (page) params.append('page', String(page));
    if (pageSize) params.append('page_size', String(pageSize));
    const response = await api.get<ReturnRequestListResponse>(`/returns?${params.toString()}`);
    return response.data;
  },

  getReturn: async (id: string): Promise<ReturnRequest> => {
    const response = await api.get<ReturnRequest>(`/returns/${id}`);
    return response.data;
  },

  updateReturnStatus: async (id: string, status: ReturnRequest['status'], adminNotes?: string): Promise<ReturnRequest> => {
    const response = await api.put<ReturnRequest>(`/returns/${id}/status`, {
      status,
      admin_notes: adminNotes,
    });
    return response.data;
  },
};

// ============ CART API ============

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const response = await api.get<Cart>('/cart');
    return response.data;
  },

  addItem: async (productId: string, quantity: number = 1): Promise<Cart> => {
    const response = await api.post<Cart>('/cart/items', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  updateItem: async (itemId: string, quantity: number): Promise<Cart> => {
    const response = await api.put<Cart>(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const response = await api.delete<Cart>(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async (): Promise<Cart> => {
    const response = await api.delete<Cart>('/cart');
    return response.data;
  },
};

// ============ NOTIFICATIONS API ============

export const notificationsApi = {
  getNotifications: async (params?: {
    type?: string;
    unread_only?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<NotificationListResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get<NotificationListResponse>(`/notifications?${searchParams.toString()}`);
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get<{ unread_count: number }>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.put<Notification>(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/notifications/${id}`);
    return response.data;
  },
};

// ============ AUDITOR API ============

// Inventory Log types
export interface InventoryLog {
  id: string;
  actor_customer_id?: string;
  actor_employee_id?: string;
  actor_name?: string;
  actor_email?: string;
  actor_type?: 'customer' | 'employee';
  action_type: string;
  description: string;
  related_entity_type?: 'order' | 'product' | 'return_request';
  related_entity_id?: string;
  related_entity_summary?: string;
  created_at: string;
}

export interface InventoryLogListResponse {
  items: InventoryLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Activity Log types
export interface ActivityLog {
  id: string;
  customer_id?: string;
  employee_id?: string;
  user_name?: string;
  user_email?: string;
  user_type?: 'customer' | 'employee';
  activity_type: string;
  description: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivityLogListResponse {
  items: ActivityLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const auditorApi = {
  getInventoryLogs: async (params?: {
    action_type?: string;
    related_entity_type?: string;
    actor_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<InventoryLogListResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get<InventoryLogListResponse>(`/auditor/inventory-logs?${searchParams.toString()}`);
    return response.data;
  },

  getActivityLogs: async (params?: {
    activity_type?: string;
    user_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<ActivityLogListResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const response = await api.get<ActivityLogListResponse>(`/auditor/activity-logs?${searchParams.toString()}`);
    return response.data;
  },
};

export default api;
