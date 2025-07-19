import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { orderApi, type ShippingAddress, type CheckoutData, type Order } from '../services/api';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cartData, isLoading: isCartLoading, refreshCart } = useCart();
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    country: ''
  });
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Redirect if cart is empty (but not if we just completed an order)
  useEffect(() => {
    if (!isCartLoading && cartData && cartData.items.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [cartData, isCartLoading, navigate, orderSuccess]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Full Name validation
    if (!shippingAddress.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (shippingAddress.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (shippingAddress.fullName.trim().length > 100) {
      newErrors.fullName = 'Full name cannot exceed 100 characters';
    }

    // Address validation
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (shippingAddress.address.trim().length < 10) {
      newErrors.address = 'Address must be at least 10 characters';
    } else if (shippingAddress.address.trim().length > 200) {
      newErrors.address = 'Address cannot exceed 200 characters';
    }

    // City validation
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required';
    } else if (shippingAddress.city.trim().length < 2) {
      newErrors.city = 'City must be at least 2 characters';
    } else if (shippingAddress.city.trim().length > 50) {
      newErrors.city = 'City cannot exceed 50 characters';
    }

    // Postal Code validation
    if (!shippingAddress.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    } else if (shippingAddress.postalCode.trim().length < 4) {
      newErrors.postalCode = 'Postal code must be at least 4 characters';
    } else if (shippingAddress.postalCode.trim().length > 10) {
      newErrors.postalCode = 'Postal code cannot exceed 10 characters';
    }

    // Country validation
    if (!shippingAddress.country.trim()) {
      newErrors.country = 'Country is required';
    } else if (shippingAddress.country.trim().length < 2) {
      newErrors.country = 'Country must be at least 2 characters';
    } else if (shippingAddress.country.trim().length > 50) {
      newErrors.country = 'Country cannot exceed 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsProcessing(true);
      setErrors({});

      const checkoutData: CheckoutData = {
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          postalCode: shippingAddress.postalCode.trim(),
          country: shippingAddress.country.trim()
        },
        notes: notes.trim() || undefined
      };

      const order = await orderApi.checkout(checkoutData);
      
      // Refresh cart (should be empty now)
      await refreshCart();
      
      // Show success state
      setOrderSuccess(order);

    } catch (error) {
      console.error('Checkout error:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Checkout failed. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Loading state
  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  // Order success state
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-4">Thank you for your order. We'll process it shortly.</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">Order Number</p>
              <p className="text-lg font-bold text-gray-900">{orderSuccess.orderNumber}</p>
            </div>

            <div className="space-y-3">
              <Link
                to="/orders"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                View My Orders
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
                <span className="text-blue-600 font-medium">Checkout</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <nav className="text-sm text-gray-600">
            <Link to="/cart" className="hover:text-gray-900">Cart</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Checkout</span>
          </nav>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout Form */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Shipping Information</h2>

              {/* General Error */}
              {errors.submit && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={shippingAddress.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fullName ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={shippingAddress.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter your street address"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter your city"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    id="postalCode"
                    value={shippingAddress.postalCode}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.postalCode ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter postal code"
                  />
                  {errors.postalCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
                  )}
                </div>

                {/* Country */}
                <div className="md:col-span-2">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={shippingAddress.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.country ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Enter your country"
                  />
                  {errors.country && (
                    <p className="mt-1 text-sm text-red-600">{errors.country}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special instructions or comments..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-between">
                <Link
                  to="/cart"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-md transition-colors"
                >
                  Back to Cart
                </Link>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`font-medium py-3 px-8 rounded-md transition-colors ${
                    isProcessing
                      ? 'bg-blue-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="inline w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              {cartData && cartData.items.length > 0 && (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3 mb-6">
                    {cartData.items.map((item) => (
                      <div key={item.product._id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-12 h-12">
                          <img
                            src={
                              item.product.image.includes('via.placeholder.com') 
                                ? `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCI+Tm88L3RleHQ+Cjwvc3ZnPgo=`
                                : item.product.image
                            }
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal ({cartData.summary.totalItems} items)</span>
                      <span className="font-medium">{formatPrice(cartData.summary.totalPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between text-base font-medium text-gray-900 pt-2 border-t">
                      <span>Total</span>
                      <span>{formatPrice(cartData.summary.totalPrice)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout; 