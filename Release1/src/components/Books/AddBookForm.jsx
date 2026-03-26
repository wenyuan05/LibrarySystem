import React, { useState, useEffect, useRef } from 'react';
import { booksAPI, categoryAPI } from '../../utils/api';
import './Books.css';

const AddBookForm = ({ onBookAdded }) => {
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', publisher: '', publish_date: '', language: 'Chinese', page_count: '', total_copies: '1' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const dropdownRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }));
  };

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const data = await categoryAPI.getAll();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 关闭下拉菜单当点击外部
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const dropdownMenu = document.querySelector('.category-dropdown-menu');
        if (dropdownMenu) {
          dropdownMenu.classList.remove('show');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    if (!formData.title || typeof formData.title !== 'string' || !formData.title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }
    if (formData.title.length > 100) {
      setError('Title must be less than 100 characters');
      setIsSubmitting(false);
      return;
    }
    if (!formData.author || typeof formData.author !== 'string' || !formData.author.trim()) {
      setError('Author is required');
      setIsSubmitting(false);
      return;
    }
    if (formData.author.length > 50) {
      setError('Author must be less than 50 characters');
      setIsSubmitting(false);
      return;
    }
    if (!formData.isbn || typeof formData.isbn !== 'string' || !formData.isbn.trim()) {
      setError('ISBN is required');
      setIsSubmitting(false);
      return;
    }
    // 严格的ISBN格式检查
    const isbnPattern = /^\d{10}(?:\d{3})?$/;
    if (!isbnPattern.test(formData.isbn)) {
      setError('ISBN must be 10 or 13 digits');
      setIsSubmitting(false);
      return;
    }
    if (!formData.total_copies || typeof formData.total_copies !== 'string' && typeof formData.total_copies !== 'number') {
      setError('Total copies is required');
      setIsSubmitting(false);
      return;
    }
    const totalCopies = parseInt(formData.total_copies);
    if (isNaN(totalCopies) || totalCopies < 1 || totalCopies > 100) {
      setError('Total copies must be between 1 and 100');
      setIsSubmitting(false);
      return;
    }
    if (formData.publisher && typeof formData.publisher !== 'string') {
      setError('Publisher must be a string');
      setIsSubmitting(false);
      return;
    }
    if (formData.publisher && formData.publisher.length > 50) {
      setError('Publisher must be less than 50 characters');
      setIsSubmitting(false);
      return;
    }
    if (formData.page_count && (typeof formData.page_count !== 'string' && typeof formData.page_count !== 'number')) {
      setError('Page count must be a number');
      setIsSubmitting(false);
      return;
    }
    if (formData.page_count) {
      const pageCount = parseInt(formData.page_count);
      if (isNaN(pageCount) || pageCount < 1 || pageCount > 10000) {
        setError('Page count must be between 1 and 10000');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const newBook = await booksAPI.add(formData);
      
      // 关联分类
      if (selectedCategories.length > 0) {
        for (const categoryId of selectedCategories) {
          await categoryAPI.addBookCategory(newBook.id, categoryId);
        }
      }
      
      setSuccess('Book added successfully!');
      // 重置表单
      setFormData({ title: '', author: '', isbn: '', publisher: '', publish_date: '', language: 'Chinese', page_count: '', total_copies: '1' });
      setSelectedCategories([]);
      // 通知父组件刷新书籍列表
      if (onBookAdded) {
        onBookAdded(newBook);
      }
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add book. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-book-form card">
      <h3>Add New Book</h3>
      
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
          <label htmlFor="publisher">Publisher:</label>
          <input
            type="text"
            id="publisher"
            name="publisher"
            value={formData.publisher}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="publish_date">Publish Date:</label>
          <input
            type="date"
            id="publish_date"
            name="publish_date"
            value={formData.publish_date}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="language">Language:</label>
          <select
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="Chinese">Chinese</option>
            <option value="English">English</option>
            <option value="Japanese">Japanese</option>
            <option value="Korean">Korean</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="page_count">Page Count:</label>
          <input
            type="number"
            id="page_count"
            name="page_count"
            value={formData.page_count}
            onChange={handleChange}
            min="1"
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="total_copies">Total Copies:</label>
          <input
            type="number"
            id="total_copies"
            name="total_copies"
            value={formData.total_copies}
            onChange={handleChange}
            min="1"
            max="100"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label>Categories:</label>
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : categories.length === 0 ? (
            <p>No categories available</p>
          ) : (
            <div className="category-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className="category-dropdown-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  const dropdownMenu = document.querySelector('.category-dropdown-menu');
                  if (dropdownMenu) {
                    dropdownMenu.classList.toggle('show');
                  }
                }}
                disabled={isSubmitting}
              >
                {selectedCategories.length > 0 ? 
                  `${selectedCategories.length} selected` : 
                  'Select categories'}
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className="category-dropdown-menu">
                {categories.map(category => (
                  <button
                    type="button"
                    key={category.id}
                    className={`dropdown-item ${selectedCategories.includes(category.id) ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryChange(category.id);
                    }}
                    disabled={isSubmitting}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Book'}
        </button>
      </form>
    </div>
  );
};

export default AddBookForm;