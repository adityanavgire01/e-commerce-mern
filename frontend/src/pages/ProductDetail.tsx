import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productApi, type Product } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart, cartItemCount } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Product ID not found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const productData = await productApi.getProductById(id);
        setProduct(productData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load product';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setIsAddingToCart(true);
      await addToCart(product._id, quantity);
      
      // Show success feedback
      setAddToCartSuccess(true);
      setTimeout(() => setAddToCartSuccess(false), 3000);
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
      // You could add toast notification here
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && product && newQuantity <= product.quantity) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getReliablePlaceholder = () => {
    const svg = `<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="45%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="24">No Image</text>
      <text x="50%" y="60%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="18">Available</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Link
            to="/products"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
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
                  {user && <Link to="/cart" className="text-gray-600 hover:text-gray-900">Cart</Link>}
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <span className="text-sm text-gray-600">Welcome, {user.username}</span>
                    <Link to="/cart" className="relative bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md transition-colors">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                      </svg>
                      {cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </Link>
                    <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Dashboard</Link>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                    <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Register</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Loading content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/2">
                <div className="aspect-square bg-gray-300 rounded-lg mb-4"></div>
              </div>
              <div className="lg:w-1/2">
                <div className="h-8 bg-gray-300 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-6"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-6 w-3/4"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Product not found</h2>
          <Link to="/products" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.quantity === 0;
  const isBrokenPlaceholder = product.image.includes('via.placeholder.com');
  const shouldUseImageFallback = imageError || isBrokenPlaceholder;

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
                {user && <Link to="/cart" className="text-gray-600 hover:text-gray-900">Cart</Link>}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.username}</span>
                  <Link to="/cart" className="relative bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Dashboard</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                  <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><Link to="/" className="hover:text-gray-900">Home</Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li><Link to="/products" className="hover:text-gray-900">Products</Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li className="text-gray-900 font-medium truncate">{product.name}</li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Product Image */}
            <div className="lg:w-1/2 p-8">
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={shouldUseImageFallback ? getReliablePlaceholder() : product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => {
                    if (!imageError) {
                      setImageError(true);
                    }
                  }}
                />
                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-4 py-2 rounded-full text-lg font-medium">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="lg:w-1/2 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                {/* Category Badge */}
                {typeof product.category === 'object' && product.category.name && (
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {product.category.name}
                    </span>
                  </div>
                )}
                <p className="text-4xl font-bold text-blue-600 mb-6">{formatPrice(product.price)}</p>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <svg className={`h-5 w-5 ${isOutOfStock ? 'text-red-500' : product.quantity < 10 ? 'text-orange-500' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className={`font-medium ${isOutOfStock ? 'text-red-600' : product.quantity < 10 ? 'text-orange-600' : 'text-green-600'}`}>
                    {isOutOfStock ? 'Out of Stock' : product.quantity < 10 ? `Only ${product.quantity} left in stock!` : 'In Stock'}
                  </span>
                </div>
                {!isOutOfStock && (
                  <p className="text-sm text-gray-600">{product.quantity} available</p>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Add to Cart Section */}
              {!isOutOfStock && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center space-x-4 mb-6">
                    <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
                      Quantity:
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="px-4 py-2 text-gray-900 min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= product.quantity}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className={`flex-1 font-medium py-3 px-6 rounded-lg text-lg transition-all duration-200 ${
                        addToCartSuccess
                          ? 'bg-green-600 text-white'
                          : isAddingToCart
                          ? 'bg-blue-400 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105'
                      }`}
                    >
                      {addToCartSuccess ? (
                        <>
                          <svg className="inline w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Added to Cart!
                        </>
                      ) : isAddingToCart ? (
                        <>
                          <svg className="inline w-5 h-5 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Adding...
                        </>
                      ) : (
                        <>
                          <svg className="inline w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                          </svg>
                          Add to Cart
                        </>
                      )}
                    </button>
                    <Link
                      to="/cart"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg text-lg transition-colors text-center"
                    >
                      View Cart
                    </Link>
                  </div>
                </div>
              )}

              {/* Out of Stock Message */}
              {isOutOfStock && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-red-800">
                        This product is currently out of stock. Check back soon!
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Products */}
        <div className="mt-8 text-center">
          <Link
            to="/products"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to All Products
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail; 