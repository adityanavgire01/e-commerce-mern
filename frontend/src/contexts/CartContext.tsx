import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { cartApi, type CartData } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartData: CartData | null;
  isLoading: boolean;
  error: string | null;
  cartItemCount: number;
  
  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateCartItem: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Calculate cart item count
  const cartItemCount = cartData?.summary?.totalItems || 0;

  // Fetch cart data
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCartData(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await cartApi.getCart();
      setCartData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cart';
      setError(errorMessage);
      console.error('Cart fetch error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to add items to cart');
    }

    try {
      setError(null);
      await cartApi.addToCart(productId, quantity);
      // Refresh cart after adding
      await fetchCart();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (productId: string, quantity: number) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to update cart');
    }

    try {
      setError(null);
      await cartApi.updateCartItem(productId, quantity);
      // Refresh cart after updating
      await fetchCart();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update cart item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error('Please log in to remove items from cart');
    }

    try {
      setError(null);
      await cartApi.removeFromCart(productId);
      // Refresh cart after removing
      await fetchCart();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove item from cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) {
      throw new Error('Please log in to clear cart');
    }

    try {
      setError(null);
      await cartApi.clearCart();
      // Refresh cart after clearing
      await fetchCart();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Refresh cart (alias for fetchCart for external use)
  const refreshCart = fetchCart;

  // Load cart when user logs in or component mounts
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCart();
    } else {
      // Clear cart data when user logs out
      setCartData(null);
      setError(null);
    }
  }, [isAuthenticated, user]);

  const value: CartContextType = {
    cartData,
    isLoading,
    error,
    cartItemCount,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 