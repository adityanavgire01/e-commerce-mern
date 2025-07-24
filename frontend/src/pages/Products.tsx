import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { type Product, type Category, productApi, categoryApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  
  const { user } = useAuth();
  const { cartItemCount } = useCart();

  // Fetch products and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both products and categories in parallel
        const [productsData, categoriesData] = await Promise.all([
          productApi.getAllProducts(),
          categoryApi.getAllCategories()
        ]);
        
        setProducts(productsData);
        setCategories(categoriesData);
        setFilteredProducts(productsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoadingProducts(false);
        setIsLoadingCategories(false);
      }
    };

    fetchData();
  }, []);

  // Filter and search products
  useEffect(() => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        if (typeof product.category === 'string') {
          return product.category === selectedCategory;
        }
        return product.category._id === selectedCategory;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description.toLowerCase().includes(search)
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return a.price - b.price;
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchTerm, sortBy]);

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleAddToCart = (productId: string) => {
    // You could add toast notification here
    console.log('Product added to cart:', productId);
  };

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSearchTerm('');
    setSortBy('newest');
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Products</h2>
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
                <Link to="/products" className="text-blue-600 font-medium">Products</Link>
                {user && (
                  <>
                    <Link to="/cart" className="text-gray-600 hover:text-gray-900">Cart</Link>
                    <Link to="/orders" className="text-gray-600 hover:text-gray-900">Orders</Link>
                  </>
                )}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user.username}</span>
                  <Link 
                    to="/cart" 
                    className="relative bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/dashboard" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                  <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">Discover our amazing collection of products</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:w-1/4">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              isLoading={isLoadingCategories}
            />

            {/* Search */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Products</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory || searchTerm) && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Active Filters</h3>
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2">
                  {selectedCategory && (
                    <div className="flex items-center justify-between bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                      <span className="text-sm">
                        Category: {categories.find(c => c._id === selectedCategory)?.name || 'Unknown'}
                      </span>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {searchTerm && (
                    <div className="flex items-center justify-between bg-green-100 text-green-800 px-3 py-2 rounded-lg">
                      <span className="text-sm">Search: "{searchTerm}"</span>
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-green-600 hover:text-green-800"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Content - Products */}
          <div className="lg:w-3/4">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 font-medium">
                    {isLoadingProducts ? 'Loading...' : `${filteredProducts.length} Products`}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-600">Sort by:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'newest')}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="price">Price Low to High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                    <div className="aspect-square bg-gray-300"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <div className="flex-1 h-8 bg-gray-200 rounded"></div>
                        <div className="flex-1 h-8 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || selectedCategory
                    ? "Try adjusting your filters or search terms"
                    : "No products are currently available"}
                </p>
                {(searchTerm || selectedCategory) && (
                  <button
                    onClick={clearAllFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Products; 