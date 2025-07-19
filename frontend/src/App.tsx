import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { AdminProvider } from './contexts/AdminContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminCategories from './pages/AdminCategories';

// Home component for unauthenticated users
const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Redirect to dashboard if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">E-Commerce MERN</h1>
            <div className="space-x-4">
              <a
                href="/products"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Products
              </a>
              <a
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </a>
              <a
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                Register
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your E-Commerce Store
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Built with React + TypeScript + Tailwind CSS v4
          </p>
          
          {/* Authentication CTA */}
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 mb-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Get Started</h3>
            <p className="text-gray-600 mb-6">
              Sign in to access your dashboard and start shopping!
            </p>
            <div className="space-y-3">
              <a
                href="/products"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 block"
              >
                Browse Products
              </a>
              <a
                href="/register"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 block"
              >
                Create Account
              </a>
              <a
                href="/login"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded transition-colors duration-200 block"
              >
                Sign In
              </a>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🔐 Authentication</h3>
              <p className="text-gray-600">JWT-based secure login & registration</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">🛒 Shopping Cart</h3>
              <p className="text-gray-600">Add products, manage quantities</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📦 Orders</h3>
              <p className="text-gray-600">Complete checkout & order tracking</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <CartProvider>
          <Router>
            <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route 
            path="/cart" 
            element={<Cart />}
          />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProducts />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/categories/new" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Router>
        </CartProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;
