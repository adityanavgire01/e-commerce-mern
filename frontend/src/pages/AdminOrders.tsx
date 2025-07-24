import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import api, { adminApi, type Order } from '../services/api';

const AdminOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin, canAccessAdmin } = useAdmin();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!canAccessAdmin) {
      navigate('/dashboard');
      return;
    }
  }, [isAuthenticated, canAccessAdmin, navigate]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAdmin) return;

      try {
        setIsLoading(true);
        setError(null);
        // Use admin endpoint to get all orders
        const response = await api.get('/api/orders/admin/all');
        const ordersData = response.data.data;
        setOrders(ordersData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAdmin]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      setIsUpdatingStatus(orderId);
      const updatedOrder = await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(order => 
        order._id === orderId ? updatedOrder : order
      ));
      setSuccessMessage(`Order status updated to ${newStatus}`);
      
      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      setError(errorMessage);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusOptions = (currentStatus: Order['status']) => {
    const allStatuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    return allStatuses.filter(status => status !== currentStatus);
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = !filterStatus || order.status === filterStatus;
    
    // Get customer info for search - handle deleted users (null customer)
    const customerName = (typeof order.customer === 'object' && order.customer !== null)
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : order.shippingAddress.fullName;
    const customerEmail = (typeof order.customer === 'object' && order.customer !== null)
      ? order.customer.email
      : '';
    
    const matchesSearch = !searchTerm || 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (!isAuthenticated || !canAccessAdmin) {
    return null; // Will redirect in useEffect
  }

  if (error && !successMessage) {
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
              <Link to="/admin" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                ← Admin Dashboard
              </Link>
              <div className="h-4 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin: {user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-2 text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header & Filters */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
              <p className="text-gray-600">Manage and track customer orders</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Orders
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Order ID, customer name, email..."
                />
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="statusFilter"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('');
                  }}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          // Loading State
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="px-6 py-4 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Orders Table
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredOrders.length === orders.length 
                  ? `All Orders (${orders.length})` 
                  : `Filtered Orders (${filteredOrders.length} of ${orders.length})`}
              </h2>
            </div>
            
            {filteredOrders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {orders.length === 0 
                    ? "No orders have been placed yet" 
                    : "No orders match your current filters"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <p className="text-sm font-medium text-gray-900">
                            Order #{order._id.slice(-8).toUpperCase()}
                          </p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p className="font-medium text-gray-900">Customer</p>
                            <p>
                              {(typeof order.customer === 'object' && order.customer !== null)
                                ? `${order.customer.firstName} ${order.customer.lastName}`
                                : order.shippingAddress.fullName}
                            </p>
                            <p>
                              {(typeof order.customer === 'object' && order.customer !== null)
                                ? order.customer.email
                                : 'N/A'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">Order Date</p>
                            <p>{formatDate(order.createdAt)}</p>
                            <p>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-gray-900">Total Amount</p>
                            <p className="text-lg font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Status Update Dropdown */}
                        <div className="relative">
                          <select
                            value=""
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value as Order['status'])}
                            disabled={isUpdatingStatus === order._id}
                            className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            <option value="">Update Status</option>
                            {getStatusOptions(order.status).map(status => (
                              <option key={status} value={status}>
                                Mark as {status.charAt(0).toUpperCase() + status.slice(1)}
                              </option>
                            ))}
                          </select>
                          {isUpdatingStatus === order._id && (
                            <div className="absolute right-2 top-1.5">
                              <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* View Details Button */}
                        <button
                          onClick={() => openOrderDetail(order)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Order Details - #{selectedOrder._id.slice(-8).toUpperCase()}
              </h3>
              <button
                onClick={() => setShowOrderDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Order Status & Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Status</h4>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Order Date</h4>
                  <p className="text-sm text-gray-600">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Total Amount</h4>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(selectedOrder.totalAmount)}</p>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {
                        (typeof selectedOrder.customer === 'object' && selectedOrder.customer !== null)
                          ? `${selectedOrder.customer.firstName} ${selectedOrder.customer.lastName}`
                          : selectedOrder.shippingAddress.fullName
                      }</p>
                      <p><span className="font-medium">Email:</span> {
                        (typeof selectedOrder.customer === 'object' && selectedOrder.customer !== null)
                          ? selectedOrder.customer.email
                          : 'N/A'
                      }</p>
                    </div>
                  </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                  <div className="text-sm">
                    <p>{selectedOrder.shippingAddress.address}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                      <div className="col-span-6">Product</div>
                      <div className="col-span-2 text-center">Price</div>
                      <div className="col-span-2 text-center">Quantity</div>
                      <div className="col-span-2 text-right">Subtotal</div>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="px-4 py-3">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-6 flex items-center space-x-3">
                            <img
                              src={
                                typeof item.product === 'object' && item.product.image.includes('via.placeholder.com')
                                  ? `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCI+Tm88L3RleHQ+Cjwvc3ZnPgo=`
                                  : typeof item.product === 'object' ? item.product.image : ''
                              }
                              alt={typeof item.product === 'object' ? item.product.name : 'Product'}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {typeof item.product === 'object' ? item.product.name : 'Unknown Product'}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-2 text-center text-sm">
                            {formatCurrency(item.price)}
                          </div>
                          <div className="col-span-2 text-center text-sm">
                            {item.quantity}
                          </div>
                          <div className="col-span-2 text-right text-sm font-medium">
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowOrderDetail(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders; 