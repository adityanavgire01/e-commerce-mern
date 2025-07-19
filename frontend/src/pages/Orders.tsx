import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderApi, type Order } from '../services/api';

const Orders: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const userOrders = await orderApi.getUserOrders();
        setOrders(userOrders);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view orders</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access your order history.</p>
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
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
              <Link to="/" className="text-2xl font-bold text-gray-900">E-Commerce MERN</Link>
              <nav className="hidden md:flex space-x-6">
                <Link to="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
                <Link to="/cart" className="text-gray-600 hover:text-gray-900">Cart</Link>
                <span className="text-blue-600 font-medium">Orders</span>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">
            {isLoading ? 'Loading orders...' : `${orders.length} order${orders.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {isLoading ? (
          // Loading State
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded w-20"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping to see your orders here.</p>
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
          // Orders List
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">Placed on {formatDate(order.createdAt)}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="px-6 py-4">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Items */}
                    <div className="lg:w-2/3">
                      <h4 className="font-medium text-gray-900 mb-3">Items ({order.totalItems})</h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-sm text-gray-600">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                            </div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatPrice(item.total)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Summary & Shipping */}
                    <div className="lg:w-1/3">
                      <div className="space-y-4">
                        {/* Order Total */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Order Total</h4>
                          <div className="flex justify-between text-lg font-bold text-gray-900">
                            <span>Total</span>
                            <span>{formatPrice(order.totalAmount)}</span>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                          <div className="text-sm text-gray-600">
                            <p className="font-medium">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.address}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                            <p>{order.shippingAddress.country}</p>
                          </div>
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Order Notes</h4>
                            <p className="text-sm text-gray-600">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Orders; 