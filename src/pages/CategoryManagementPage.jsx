import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { categoryAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './CategoryManagementPage.css';

const CategoryManagementPage = () => {
  const CATEGORIES_PER_PAGE = 8;
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const inputRef = useRef(null);

  // Get all categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await categoryAPI.getAll();
      setCategories(data);
    } catch (error) {
      showToast('Failed to fetch categories', 'error');
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Fetch categories on initialization
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await categoryAPI.create({ name: newCategory.trim() });
      showToast('Category created successfully', 'success');
      setNewCategory('');
      setCurrentPage(1);
      fetchCategories();
    } catch (error) {
      showToast('Failed to create category', 'error');
      console.error('Error creating category:', error);
    }
  };

  // Start editing category
  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
    // Focus input in next render cycle
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Save edited category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      await categoryAPI.update(editingCategory.id, { name: editingCategory.name.trim() });
      showToast('Category updated successfully', 'success');
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      showToast('Failed to update category', 'error');
      console.error('Error updating category:', error);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await categoryAPI.delete(id);
      showToast('Category deleted successfully', 'success');
      fetchCategories();
    } catch (error) {
      showToast('Failed to delete category', 'error');
      console.error('Error deleting category:', error);
    }
  };

  const filteredCategories = useMemo(() => {
    const keyword = categorySearch.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter(category => String(category.name || '').toLowerCase().includes(keyword));
  }, [categories, categorySearch]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / CATEGORIES_PER_PAGE));
  const pagedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * CATEGORIES_PER_PAGE;
    return filteredCategories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  }, [filteredCategories, currentPage]);
  const pageStart = filteredCategories.length === 0 ? 0 : (currentPage - 1) * CATEGORIES_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * CATEGORIES_PER_PAGE, filteredCategories.length);

  useEffect(() => {
    setCurrentPage(prev => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const handleSearchCategories = (e) => {
    e.preventDefault();
    setCategorySearch(categorySearchInput);
    setCurrentPage(1);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="category-management">
      <div className="category-content">
        <h2>Category Management</h2>
        
        <div className="category-grid">
          {/* Create Category Form */}
          <div className="category-form card">
            <h3>Create New Category</h3>
            <form onSubmit={handleCreateCategory}>
              <input
                type="text"
                placeholder="Enter category name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
            <div className="category-search-panel">
              <h3>Search Categories</h3>
              <form className="category-search-form" onSubmit={handleSearchCategories}>
                <input
                  type="search"
                  placeholder="Search category name"
                  value={categorySearchInput}
                  onChange={(e) => setCategorySearchInput(e.target.value)}
                />
                <button type="submit" className="category-search-button" aria-label="Search categories">
                  <img src="/放大镜.svg" alt="" aria-hidden="true" />
                </button>
              </form>
              {(categorySearch || categorySearchInput) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setCategorySearchInput('');
                    setCategorySearch('');
                    setCurrentPage(1);
                  }}
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>

          {/* Category List */}
          <div className="category-list card">
            <h3>Category List</h3>
            {filteredCategories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <p>{categories.length === 0 ? 'No categories yet' : 'No matching categories'}</p>
                <p>{categories.length === 0 ? 'Click on the left to create your first category' : 'Try a different search keyword'}</p>
              </div>
            ) : (
              <div className="category-items">
                {pagedCategories.map((category) => (
                  <div key={category.id} className="category-item">
                    {editingCategory && editingCategory.id === category.id ? (
                      <form onSubmit={handleSaveCategory} className="edit-form">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editingCategory.name}
                          onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                          required
                        />
                        <button type="submit" className="btn btn-primary">Save</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setEditingCategory(null)}>Cancel</button>
                        </form>
                      ) : (
                        <>
                        <span title={category.name}>{category.name}</span>
                          <div className="actions">
                          <button type="button" onClick={() => handleEditCategory(category)} className="action-btn edit-btn">
                            ✏️ Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteCategory(category.id)} className="action-btn delete-btn">
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {filteredCategories.length > 0 && (
              <div className="category-pagination" aria-label="Category pagination">
                <span>Showing {pageStart}-{pageEnd} of {filteredCategories.length}</span>
                <div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <strong>Page {currentPage} of {totalPages}</strong>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage;
