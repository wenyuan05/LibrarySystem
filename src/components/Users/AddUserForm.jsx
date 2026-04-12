import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';
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
  const { showToast } = useToast();

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

    // 前端验证
    if (!formData.username.trim()) {
      showToast('Username is required', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.username.length < 3) {
      showToast('Username must be at least 3 characters', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.password) {
      showToast('Password is required', 'error');
      setIsSubmitting(false);
      return;
    }
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      setIsSubmitting(false);
      return;
    }
    if (!formData.email.trim()) {
      showToast('Email is required', 'error');
      setIsSubmitting(false);
      return;
    }
    // 邮箱格式检查
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      showToast('Invalid email format', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const newUser = await usersAPI.add(formData);
      showToast('User added successfully!', 'success');
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
    } catch (err) {
      showToast(err.message || 'Failed to add user. Please try again.', 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-user-form card">
      <h3>Add New User</h3>
      
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