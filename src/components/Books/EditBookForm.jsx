import React, { useState, useEffect, useRef } from 'react';
import { booksAPI } from '../../utils/api';
import './Books.css';

const EditBookForm = ({ book, onEditComplete, onCancel }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    author: '', 
    isbn: '',
    publisher: '',
    publication_date: '',
    description: '',
    total_copies: 1,
    available_copies: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const titleInputRef = useRef(null);

  // 初始化表单数据和焦点管理
  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        isbn: book.isbn || '',
        publisher: book.publisher || '',
        publication_date: book.publication_date || '',
        description: book.description || '',
        total_copies: book.total_copies || 1,
        available_copies: book.available_copies || 1
      });
      // 聚焦到标题输入框
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
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
            <label htmlFor="publication_date">Publication Date:</label>
            <input
              type="date"
              id="publication_date"
              name="publication_date"
              value={formData.publication_date}
              onChange={handleChange}
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
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="total_copies">Total Copies:</label>
              <input
                type="number"
                id="total_copies"
                name="total_copies"
                value={formData.total_copies}
                onChange={handleChange}
                min="1"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="available_copies">Available Copies:</label>
              <input
                type="number"
                id="available_copies"
                name="available_copies"
                value={formData.available_copies}
                onChange={handleChange}
                min="0"
                required
                disabled={isSubmitting}
              />
            </div>
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