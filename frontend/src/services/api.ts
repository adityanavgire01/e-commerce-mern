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

export default api; 