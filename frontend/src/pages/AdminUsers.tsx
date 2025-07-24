import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { adminApi, type AdminUser, type Order, type OrderItem } from '../services/api';

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { isAdmin, canAccessAdmin } = useAdmin();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showUserOrders, setShowUserOrders] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{newPassword?: string; confirmPassword?: string}>({});
  const [userOrders, setUserOrders] = useState<{ user: AdminUser; orders: Order[]; totalSpent: number; totalOrders: number } | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        setIsLoading(true);
        setError(null);
        const usersData = await adminApi.getAllUsers();
        setUsers(usersData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const openUserDetail = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserDetail(true);
  };

  const handleStatusToggle = async (user: AdminUser) => {
    if (user._id === currentUser?.id) {
      setError('You cannot change your own account status');
      return;
    }

    try {
      setIsUpdatingStatus(user._id);
      const updatedUser = await adminApi.updateUserStatus(user._id, !user.isActive);
      setUsers(prev => prev.map(u => u._id === user._id ? updatedUser : u));
      setSuccessMessage(`User account ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status';
      setError(errorMessage);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const openDeleteConfirmation = (user: AdminUser) => {
    if (user._id === currentUser?.id) {
      setError('You cannot delete your own account');
      return;
    }
    if (user.isActive) {
      setError('User must be deactivated before deletion');
      return;
    }
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.deleteUser(selectedUser._id);
      setUsers(prev => prev.filter(u => u._id !== selectedUser._id));
      setSuccessMessage(`User ${selectedUser.username} has been permanently deleted`);
      setShowDeleteConfirm(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
    }
  };

  const openPasswordReset = (user: AdminUser) => {
    if (user._id === currentUser?.id) {
      setError('You cannot reset your own password from this interface');
      return;
    }
    setSelectedUser(user);
    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setShowPasswordReset(true);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    // Validate passwords
    const errors: {newPassword?: string; confirmPassword?: string} = {};
    
    if (!resetPasswordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (resetPasswordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(resetPasswordForm.newPassword)) {
      errors.newPassword = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      await adminApi.resetUserPassword(selectedUser._id, resetPasswordForm.newPassword);
      setSuccessMessage(`Password reset successfully for ${selectedUser.username}`);
      setShowPasswordReset(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
    }
  };

  const openUserOrders = async (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserOrders(true);
    setIsLoadingOrders(true);
    
    try {
      const orderData = await adminApi.getUserOrders(user._id);
      setUserOrders(orderData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user orders';
      setError(errorMessage);
    } finally {
      setIsLoadingOrders(false);
    }
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'user': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = !filterStatus || 
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive);
    const matchesSearch = !searchTerm || 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRole && matchesStatus && matchesSearch;
  });

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    regularUsers: users.filter(u => u.role === 'user').length
  };

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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Users</h2>
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
              <h1 className="text-xl font-bold text-gray-900">User Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Admin: {currentUser?.username}</span>
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
        {/* Page Header & Stats */}
        <div className="mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{userStats.inactive}</p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{userStats.admins}</p>
                <p className="text-sm text-gray-600">Admins</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{userStats.regularUsers}</p>
                <p className="text-sm text-gray-600">Regular Users</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Users
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Username, email, name..."
                />
              </div>

              {/* Role Filter */}
              <div>
                <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Role
                </label>
                <select
                  id="roleFilter"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterRole('');
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
                      <div className="h-4 bg-gray-300 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="flex space-x-2">
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                      <div className="h-6 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Users Table
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {filteredUsers.length === users.length 
                  ? `All Users (${users.length})` 
                  : `Filtered Users (${filteredUsers.length} of ${users.length})`}
              </h2>
            </div>
            
            {filteredUsers.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  {users.length === 0 
                    ? "No users are registered yet" 
                    : "No users match your current filters"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <div className="flex-shrink-0 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                            </svg>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <p className="text-lg font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(user.role)}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(user.isActive)}`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {user._id === currentUser?.id && (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full border bg-yellow-100 text-yellow-800 border-yellow-200">
                                  Current User
                                </span>
                              )}
                            </div>
                            
                            <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                              <p><span className="font-medium">Username:</span> {user.username}</p>
                              <p><span className="font-medium">Email:</span> {user.email}</p>
                              <p><span className="font-medium">Joined:</span> {formatDate(user.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* View Details Button */}
                        <button
                          onClick={() => openUserDetail(user)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                        
                        {/* Admin Actions */}
                        {user._id !== currentUser?.id && (
                          <div className="flex flex-col space-y-2">
                            {/* Status Toggle and Delete (for inactive users) */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleStatusToggle(user)}
                                disabled={isUpdatingStatus === user._id}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                                  user.isActive
                                    ? 'bg-red-100 hover:bg-red-200 text-red-800'
                                    : 'bg-green-100 hover:bg-green-200 text-green-800'
                                } disabled:opacity-50`}
                              >
                                {isUpdatingStatus === user._id ? '...' : user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              
                              {/* Delete Button - Only shown for inactive users */}
                              {!user.isActive && (
                                <button
                                  onClick={() => openDeleteConfirmation(user)}
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                  title="Delete user permanently"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            
                            {/* Reset Password */}
                            <button
                              onClick={() => openPasswordReset(user)}
                              className="px-3 py-1 text-xs font-medium rounded bg-orange-100 hover:bg-orange-200 text-orange-800 transition-colors"
                            >
                              Reset Password
                            </button>
                            
                            {/* View Orders */}
                            <button
                              onClick={() => openUserOrders(user)}
                              className="px-3 py-1 text-xs font-medium rounded bg-purple-100 hover:bg-purple-200 text-purple-800 transition-colors"
                            >
                              View Orders
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  User Details
                </h3>
                {selectedUser._id === currentUser?.id && (
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full border bg-yellow-100 text-yellow-800 border-yellow-200">
                    Current User
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowUserDetail(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* User Avatar & Basic Info */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h4>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full border ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedUser.isActive)}`}>
                      {selectedUser.isActive ? 'Active Account' : 'Inactive Account'}
                    </span>
                  </div>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">Account Information</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-medium text-gray-900">{selectedUser._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Username:</span>
                      <span className="font-medium text-gray-900">{selectedUser.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-3">Account Status</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedUser.isActive)}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedUser.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Actions Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-2">Available Admin Actions</h5>
                <div className="text-sm text-blue-800">
                  <p className="mb-2">For this user, you can:</p>
                  {selectedUser._id !== currentUser?.id ? (
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Activate/Deactivate account status</li>
                      <li>Reset user password</li>
                      <li>View complete order history</li>
                    </ul>
                  ) : (
                    <p className="text-blue-700 italic">
                      This is your own account. Use profile settings to make changes.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowUserDetail(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordReset && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <form onSubmit={handlePasswordReset}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Reset Password for {selectedUser.username}
                </h3>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) => setResetPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This will immediately change the user's password. 
                    The user will need to use this new password to log in.
                  </p>
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Orders Modal */}
      {showUserOrders && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Order History - {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <button
                onClick={() => setShowUserOrders(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="px-6 py-4">
              {isLoadingOrders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading order history...</p>
                </div>
              ) : userOrders ? (
                <>
                  {/* Order Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-600">{userOrders.totalOrders}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">
                        ${userOrders.totalSpent.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {userOrders.totalOrders > 0 ? (userOrders.totalSpent / userOrders.totalOrders).toFixed(2) : '0.00'}
                      </p>
                      <p className="text-sm text-gray-600">Average Order</p>
                    </div>
                  </div>

                  {/* Orders List */}
                  {userOrders.orders.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                      <p className="text-gray-600">This user hasn't placed any orders yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {userOrders.orders.map((order: Order) => (
                        <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="font-medium text-gray-900">
                                Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold text-gray-900">
                                ${order.totalAmount.toFixed(2)}
                              </p>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                                order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <p>{order.totalItems} item{order.totalItems !== 1 ? 's' : ''}</p>
                            {order.items && order.items.length > 0 && (
                              <p className="truncate">
                                Items: {order.items.map((item: OrderItem) => 
                                  typeof item.product === 'object' ? item.product.name : item.name
                                ).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">Failed to load order history.</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowUserOrders(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete User Account
                </h3>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  You are about to permanently delete the user account for:
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Username: {selectedUser.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {selectedUser.email}
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">
                      ⚠️ Warning: This action cannot be undone!
                    </h4>
                    <div className="mt-2 text-sm text-red-700">
                      <p>This will permanently delete:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>The user's account and profile information</li>
                        <li>All associated user data</li>
                        <li>Order history and related records</li>
                        <li>Any other data linked to this user</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers; 