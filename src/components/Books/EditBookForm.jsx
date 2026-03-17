import React, { useState, useEffect, useRef } from 'react';
import { booksAPI, categoryAPI } from '../../utils/api';
import './Books.css';

const EditBookForm = ({ book, onEditComplete, onCancel }) => {
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const titleInputRef = useRef(null);

  // 初始化表单数据和焦点管理
  useEffect(() => {
    const fetchBookCategories = async () => {
      if (book) {
        try {
          // 获取所有分类
          const allCategories = await categoryAPI.getAll();
          setCategories(allCategories);
          
          // 获取书籍的分类
          const bookCategories = await categoryAPI.getBookCategories(book.id);
          const categoryIds = bookCategories.map(cat => cat.id);
          setSelectedCategories(categoryIds);
        } catch (error) {
          console.error('Error fetching categories:', error);
        } finally {
          setCategoriesLoading(false);
        }
      }
    };

    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        description: book.description || '',
        cover_image: book.cover_image || '',
        total_copies: book.total_copies || 1,
        status: book.status || 'available'
      });
      // 聚焦到标题输入框
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      
      // 获取分类数据
      fetchBookCategories();
    }
  }, [book]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleModalClose(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理分类选择
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    // 前端验证
    if (!formData.title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.author.trim()) {
      setError('Author is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.isbn.trim()) {
      setError('ISBN is required');
      setIsSubmitting(false);
      return;
    }
    // 简单的ISBN格式检查
    const isbnPattern = /^\d{10}(?:\d{3})?$/;
    if (!isbnPattern.test(formData.isbn)) {
      setError('ISBN must be 10 or 13 digits');
      setIsSubmitting(false);
      return;
    }

    try {
      // 调用后端 API 更新书籍
      const updatedBook = await booksAPI.update(book.id, formData);
      
      // 获取当前书籍的分类
      const currentCategories = await categoryAPI.getBookCategories(book.id);
      const currentCategoryIds = currentCategories.map(cat => cat.id);
      
      // 移除旧的分类关联
      for (const categoryId of currentCategoryIds) {
        if (!selectedCategories.includes(categoryId)) {
          await categoryAPI.removeBookCategory(book.id, categoryId);
        }
      }
      
      // 添加新的分类关联
      for (const categoryId of selectedCategories) {
        if (!currentCategoryIds.includes(categoryId)) {
          await categoryAPI.addBookCategory(book.id, categoryId);
        }
      }
      
      setSuccess('Book updated successfully!');
      // 通知父组件编辑完成
      if (onEditComplete) {
        onEditComplete(updatedBook);
      }
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update book. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = (e) => {
    e.stopPropagation();
    if (onCancel) {
      onCancel();
    }
  };

  if (!book) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleModalClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h3 id="modal-title">Edit Book</h3>
          <button className="modal-close" onClick={handleModalClose} aria-label="Close modal">×</button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title:</label>
            <input
              ref={titleInputRef}
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="author">Author:</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="isbn">ISBN:</label>
            <input
              type="text"
              id="isbn"
              name="isbn"
              value={formData.isbn}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="cover_image">Cover Image URL:</label>
            <input
              type="text"
              id="cover_image"
              name="cover_image"
              value={formData.cover_image}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="total_copies">Total Copies:</label>
            <input
              type="number"
              id="total_copies"
              name="total_copies"
              min="1"
              value={formData.total_copies}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isSubmitting}
            >
              <option value="available">Available</option>
              <option value="borrowed">Borrowed</option>
              <option value="reserved">Reserved</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="form-group">
            <label>Categories:</label>
            {categoriesLoading ? (
              <p>Loading categories...</p>
            ) : categories.length === 0 ? (
              <p>No categories available</p>
            ) : (
              <div className="category-selector">
                {categories.map(category => (
                  <label key={category.id} className="category-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                      disabled={isSubmitting}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Book'}
            </button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleModalClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBookForm;