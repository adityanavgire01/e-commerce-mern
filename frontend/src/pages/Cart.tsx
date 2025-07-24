import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { type CartItem } from '../services/api';

const Cart: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    cartData, 
    isLoading, 
    error, 
    updateCartItem, 
    removeFromCart, 
    clearCart 
  } = useCart();

  const [updatingItems, setUpdatingItems] = useState<{ [key: string]: boolean }>({});
  const [removingItems, setRemovingItems] = useState<{ [key: string]: boolean }>({});

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your cart</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access your shopping cart.</p>
          <div className="space-y-2">
            <Link
              to="/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/products"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdatingItems(prev => ({ ...prev, [productId]: true }));
      await updateCartItem(productId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      // You could add toast notification here
    } finally {
      setUpdatingItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      setRemovingItems(prev => ({ ...prev, [productId]: true }));
      await removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      // You could add toast notification here
    } finally {
      setRemovingItems(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }
    
    try {
      await clearCart();
    } catch (error) {
      console.error('Failed to clear cart:', error);
      // You could add toast notification here
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Cart</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-2xl font-bold text-gray-900">
                E-Commerce MERN
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link to="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
                <Link to="/cart" className="text-blue-600 font-medium">Cart</Link>
                {user && <Link to="/orders" className="text-gray-600 hover:text-gray-900">Orders</Link>}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
              <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Shopping Cart</h1>
          <p className="text-gray-600">
            {isLoading ? 'Loading cart...' : `${cartData?.summary?.totalItems || 0} items in your cart`}
          </p>
        </div>

        {isLoading ? (
          // Loading State
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        ) : !cartData?.items || cartData.items.length === 0 ? (
          // Empty Cart State
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <Link
              to="/products"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors inline-flex items-center"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l-1 12H6L5 9z" />
              </svg>
              Start Shopping
            </Link>
          </div>
        ) : (
          // Cart Items
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items List */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Cart Items</h2>
                  <button
                    onClick={handleClearCart}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear Cart
                  </button>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {cartData.items.map((item: CartItem) => (
                    <div key={item.product._id} className="p-6">
                      <div className="flex items-center space-x-4">
                                                 {/* Product Image */}
                         <div className="flex-shrink-0 w-20 h-20">
                           <img
                             src={
                               item.product.image.includes('via.placeholder.com') 
                                 ? `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K`
                                 : item.product.image
                             }
                             alt={item.product.name}
                             className="w-full h-full object-cover rounded-md"
                             onError={(e) => {
                               const target = e.target as HTMLImageElement;
                               target.src = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K`;
                             }}
                           />
                         </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${item.product._id}`}
                            className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {item.product.description}
                          </p>
                          <p className="text-lg font-bold text-gray-900 mt-2">
                            {formatPrice(item.product.price)}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center border border-gray-300 rounded-md">
                            <button
                              onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                              disabled={item.quantity <= 1 || updatingItems[item.product._id]}
                              className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <span className="px-4 py-1 text-gray-900 min-w-[3rem] text-center">
                              {updatingItems[item.product._id] ? (
                                <svg className="animate-spin h-4 w-4 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                              ) : (
                                item.quantity
                              )}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                              disabled={updatingItems[item.product._id]}
                              className="px-3 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveItem(item.product._id)}
                            disabled={removingItems[item.product._id]}
                            className="text-red-600 hover:text-red-800 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {removingItems[item.product._id] ? (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items ({cartData.summary.totalItems})</span>
                    <span className="font-medium">{formatPrice(cartData.summary.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">Free</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-medium text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(cartData.summary.totalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors text-center block"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    to="/products"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-md transition-colors text-center block"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart; 