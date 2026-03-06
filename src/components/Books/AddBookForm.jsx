import React, { useState } from 'react';
import { booksAPI } from '../../utils/api';
import './Books.css';

const AddBookForm = ({ onBookAdded }) => {
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      const newBook = await booksAPI.add(formData);
      setSuccess('Book added successfully!');
      // 重置表单
      setFormData({ title: '', author: '', isbn: '' });
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