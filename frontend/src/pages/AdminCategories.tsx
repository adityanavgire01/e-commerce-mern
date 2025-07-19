import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { categoryApi, adminApi, type Category } from '../services/api';

interface CategoryFormData {
  name: string;
  description: string;
}

// CategoryForm component moved outside to prevent re-creation on every render
const CategoryForm: React.FC<{
  isEdit?: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  formData: CategoryFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  formErrors: Partial<CategoryFormData>;
  isSubmitting: boolean;
}> = ({ 
  isEdit = false, 
  onSubmit, 
  onCancel,
  formData,
  handleInputChange,
  formErrors,
  isSubmitting
}) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      <form onSubmit={onSubmit}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Edit Category' : 'Create New Category'}
          </h3>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          {/* Category Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter category name"
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter category description (optional)"
              maxLength={300}
            />
            {formErrors.description && (
              <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/300 characters
            </p>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 flex items-center"
          >
            {isSubmitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEdit ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const AdminCategories: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin, canAccessAdmin } = useAdmin();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<CategoryFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check for new category route and open form
  useEffect(() => {
    if (window.location.pathname === '/admin/categories/new') {
      setFormData({
        name: '',
        description: ''
      });
      setFormErrors({});
      setEditingCategory(null);
      setShowCreateForm(true);
      // Update URL to clean it up
      window.history.replaceState({}, '', '/admin/categories');
    }
  }, []);

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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isAdmin) return;

      try {
        setIsLoading(true);
        setError(null);
        const categoriesData = await categoryApi.getAllCategories();
        setCategories(categoriesData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [isAdmin]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setFormErrors({});
    setEditingCategory(null);
  };

  const validateForm = (): boolean => {
    const errors: Partial<CategoryFormData> = {};

    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }

    if (formData.description && formData.description.length > 300) {
      errors.description = 'Description cannot exceed 300 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name as keyof CategoryFormData]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const newCategory = await adminApi.createCategory({
        ...formData,
        isActive: true
      });
      setCategories(prev => [newCategory, ...prev]);
      setShowCreateForm(false);
      resetForm();
      setSuccessMessage('Category created successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !editingCategory) return;

    try {
      setIsSubmitting(true);
      // Note: Using PUT request since we have update category endpoint in backend
      const updatedCategory = await categoryApi.updateCategory(editingCategory._id, formData);
      setCategories(prev => prev.map(c => c._id === editingCategory._id ? updatedCategory : c));
      setShowEditForm(false);
      resetForm();
      setSuccessMessage('Category updated successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await categoryApi.deleteCategory(category._id);
      setCategories(prev => prev.filter(c => c._id !== category._id));
      setSuccessMessage('Category deleted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category';
      setError(errorMessage);
    }
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowEditForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US');
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Categories</h2>
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
              <h1 className="text-xl font-bold text-gray-900">Category Management</h1>
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

      {/* Error Message */}
      {error && successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-2 text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Categories</h1>
            <p className="text-gray-600">Manage product categories</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            + Add Category
          </button>
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
                      <div className="h-8 bg-gray-300 rounded w-16"></div>
                      <div className="h-8 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Categories Table
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All Categories ({categories.length})
              </h2>
            </div>
            
            {categories.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first category</p>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateForm(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add Category
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <div key={category._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            {category.name}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
                            category.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {category.description ? (
                            <p className="mb-1">{category.description}</p>
                          ) : (
                            <p className="mb-1 text-gray-400 italic">No description</p>
                          )}
                          <p>Created: {formatDate(category.createdAt)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => openEditForm(category)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category)}
                          className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Category Form */}
        {showCreateForm && (
          <CategoryForm
            onSubmit={handleCreateCategory}
            onCancel={() => {
              setShowCreateForm(false);
              resetForm();
            }}
            formData={formData}
            handleInputChange={handleInputChange}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Edit Category Form */}
        {showEditForm && (
          <CategoryForm
            isEdit={true}
            onSubmit={handleEditCategory}
            onCancel={() => {
              setShowEditForm(false);
              resetForm();
            }}
            formData={formData}
            handleInputChange={handleInputChange}
            formErrors={formErrors}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  );
};

export default AdminCategories; 