import React, { useState } from 'react';
import { usersAPI } from '../../utils/api';
import './Users.css';

const AddUserForm = ({ onUserAdded }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    role: 'user', 
    name: '', 
    email: '' 
  });
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
    if (!formData.username.trim()) {
      setError('Username is required');
      setIsSubmitting(false);
      return;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      setIsSubmitting(false);
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      setIsSubmitting(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }
    if (!formData.name.trim()) {
      setError('Name is required');
      setIsSubmitting(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setIsSubmitting(false);
      return;
    }
    // 邮箱格式检查
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      setError('Invalid email format');
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = await usersAPI.add(formData);
      setSuccess('User added successfully!');
      // 重置表单
      setFormData({ 
        username: '', 
        password: '', 
        role: 'user', 
        name: '', 
        email: '' 
      });
      // 通知父组件刷新用户列表
      if (onUserAdded) {
        onUserAdded(newUser);
      }
      // 3秒后清除成功消息
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add user. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-user-form card">
      <h3>Add New User</h3>
      
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
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role:</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="user">User</option>
            <option value="librarian">Librarian</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
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
          {isSubmitting ? 'Adding...' : 'Add User'}
        </button>
      </form>
    </div>
  );
};

export default AddUserForm;