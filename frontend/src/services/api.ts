import axios, { type AxiosError } from 'axios';

// Configure axios for backend API
const API_BASE_URL = 'http://localhost:5000';
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Types
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string | Category; // Can be populated or just ID
  image: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  count: number;
  data: T;
  message?: string;
}

// API Service Functions
export const productApi = {
  // Get all active products
  getAllProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get<ApiResponse<Product[]>>('/api/products');
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch products');
    }
  },

  // Get single product by ID
  getProductById: async (id: string): Promise<Product> => {
    try {
      const response = await api.get<ApiResponse<Product>>(`/api/products/${id}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch product');
    }
  },

  // Get products by category
  getProductsByCategory: async (categoryId: string): Promise<Product[]> => {
    try {
      const response = await api.get<ApiResponse<Product[]>>(`/api/products?category=${categoryId}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch products by category');
    }
  }
};

export const categoryApi = {
  // Get all active categories
  getAllCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.get<ApiResponse<Category[]>>('/api/categories');
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Update category (admin only) - placeholder for now
  updateCategory: async (categoryId: string, categoryData: Partial<Omit<Category, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Category> => {
    try {
      const response = await api.put<ApiResponse<Category>>(`/api/categories/${categoryId}`, categoryData);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update category');
    }
  },

  // Delete category (admin only) - placeholder for now
  deleteCategory: async (categoryId: string): Promise<void> => {
    try {
      await api.delete(`/api/categories/${categoryId}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete category');
    }
  }
};

// Cart item interface
export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface CartSummary {
  totalItems: number;
  totalPrice: number;
}

export interface CartData {
  items: CartItem[];
  summary: CartSummary;
}

export const cartApi = {
  // Get user's cart
  getCart: async (): Promise<CartData> => {
    try {
      const response = await api.get<ApiResponse<CartData>>('/api/cart');
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch cart');
    }
  },

  // Add product to cart - Fixed endpoint format
  addToCart: async (productId: string, quantity: number = 1): Promise<void> => {
    try {
      await api.post(`/api/cart/add/${productId}`, { quantity });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to add product to cart');
    }
  },

  // Update item quantity in cart
  updateCartItem: async (productId: string, quantity: number): Promise<void> => {
    try {
      await api.put(`/api/cart/update/${productId}`, { quantity });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update cart item');
    }
  },

  // Remove item from cart
  removeFromCart: async (productId: string): Promise<void> => {
    try {
      await api.delete(`/api/cart/remove/${productId}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to remove item from cart');
    }
  },

  // Clear entire cart
  clearCart: async (): Promise<void> => {
    try {
      await api.delete('/api/cart/clear');
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to clear cart');
    }
  }
};

// Order interfaces
export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderCustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: string | OrderCustomer;
  items: OrderItem[];
  totalItems: number;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutData {
  shippingAddress: ShippingAddress;
  notes?: string;
}

export const orderApi = {
  // Checkout - Create order from cart
  checkout: async (checkoutData: CheckoutData): Promise<Order> => {
    try {
      const response = await api.post<ApiResponse<Order>>('/api/orders/checkout', checkoutData);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to process checkout');
    }
  },

  // Get user's orders
  getUserOrders: async (): Promise<Order[]> => {
    try {
      const response = await api.get<ApiResponse<Order[]>>('/api/orders');
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch orders');
    }
  },

  // Get single order
  getOrderById: async (orderId: string): Promise<Order> => {
    try {
      const response = await api.get<ApiResponse<Order>>(`/api/orders/${orderId}`);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch order');
    }
  }
};

// Admin interfaces
export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export const adminApi = {
  // Get all users (admin only)
  getAllUsers: async (): Promise<AdminUser[]> => {
    try {
      const response = await api.get<{ success: boolean; data: { users: AdminUser[] } }>('/api/auth/admin/users');
      return response.data.data.users;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Get admin statistics
  getAdminStats: async (): Promise<AdminStats> => {
    try {
      // Fetch data from admin endpoints
      const [usersResponse, productsResponse, ordersResponse] = await Promise.all([
        api.get('/api/auth/admin/users'),
        api.get('/api/products'),
        api.get('/api/orders/admin/all')
      ]);

      return {
        totalUsers: usersResponse.data.data?.pagination?.totalUsers || usersResponse.data.data?.users?.length || 0,
        totalProducts: productsResponse.data.count || 0,
        totalOrders: ordersResponse.data.pagination?.totalOrders || ordersResponse.data.count || 0,
        totalRevenue: 0 // We'll calculate this from orders if needed
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch admin stats');
    }
  },

  // Create product (admin only)
  createProduct: async (productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    try {
      const response = await api.post<ApiResponse<Product>>('/api/products', productData);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create product');
    }
  },

  // Update product (admin only)
  updateProduct: async (productId: string, productData: Partial<Omit<Product, '_id' | 'createdAt' | 'updatedAt'>>): Promise<Product> => {
    try {
      const response = await api.put<ApiResponse<Product>>(`/api/products/${productId}`, productData);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update product');
    }
  },

  // Delete product (admin only)
  deleteProduct: async (productId: string): Promise<void> => {
    try {
      await api.delete(`/api/products/${productId}`);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to delete product');
    }
  },

  // Create category (admin only)
  createCategory: async (categoryData: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>): Promise<Category> => {
    try {
      const response = await api.post<ApiResponse<Category>>('/api/categories', categoryData);
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to create category');
    }
  },

  // Update order status (admin only)
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<Order> => {
    try {
      const response = await api.put<ApiResponse<Order>>(`/api/orders/${orderId}/status`, { status });
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update order status');
    }
  },

  // Update user status (admin only)
  updateUserStatus: async (userId: string, isActive: boolean): Promise<AdminUser> => {
    try {
      const response = await api.put<ApiResponse<AdminUser>>(`/api/auth/admin/users/${userId}/status`, { isActive });
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to update user status');
    }
  },

  // Reset user password (admin only)
  resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    try {
      await api.put(`/api/auth/admin/users/${userId}/reset-password`, { newPassword });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to reset user password');
    }
  },

  // Get user order history (admin only)
  getUserOrders: async (userId: string): Promise<{ user: AdminUser; orders: Order[]; totalSpent: number; totalOrders: number }> => {
    try {
      const response = await api.get(`/api/auth/admin/users/${userId}/orders`);
      return {
        user: response.data.data.user,
        orders: response.data.data.orders,
        totalSpent: response.data.data.totalSpent,
        totalOrders: response.data.data.pagination.totalOrders
      };
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      throw new Error(axiosError.response?.data?.message || 'Failed to fetch user orders');
    }
  }
};

export default api; 