import React, { useState, useEffect, useRef } from 'react';
import { categoryAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import './CategoryManagementPage.css';

const CategoryManagementPage = () => {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const inputRef = useRef(null);

  // Get all categories
  const fetchCategories = async () => {
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
  };

  // Fetch categories on initialization
  useEffect(() => {
    fetchCategories();
  }, []);

  // Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await categoryAPI.create({ name: newCategory.trim() });
      showToast('Category created successfully', 'success');
      setNewCategory('');
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
          </div>

          {/* Category List */}
          <div className="category-list card">
            <h3>Category List</h3>
            {categories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📁</div>
                <p>No categories yet</p>
                <p>Click on the left to create your first category</p>
              </div>
            ) : (
              <div className="category-items">
                {categories.map((category) => (
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
                        <span>{category.name}</span>
                        <div className="actions">
                          <button onClick={() => handleEditCategory(category)} className="action-btn edit-btn">
                            ✏️ Edit
                          </button>
                          <button onClick={() => handleDeleteCategory(category.id)} className="action-btn delete-btn">
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagementPage;