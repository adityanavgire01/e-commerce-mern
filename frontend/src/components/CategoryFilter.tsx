import React from 'react';
import { type Category } from '../services/api';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  isLoading?: boolean;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  isLoading = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filter by Category</h3>
        {selectedCategory && (
          <button
            onClick={() => onCategoryChange(null)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filter
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-500">Loading categories...</span>
        </div>
      ) : (
        <>
          {/* All Products Option */}
          <div className="mb-3">
            <button
              onClick={() => onCategoryChange(null)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === null
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">All Products</span>
                {selectedCategory === null && (
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          {/* Category Options */}
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No categories available</p>
            ) : (
              categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => onCategoryChange(category._id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category._id
                      ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{category.name}</span>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                      )}
                    </div>
                    {selectedCategory === category._id && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Mobile Dropdown Alternative */}
          <div className="md:hidden mt-4">
            <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Category
            </label>
            <select
              id="category-select"
              value={selectedCategory || ''}
              onChange={(e) => onCategoryChange(e.target.value || null)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Products</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryFilter; 