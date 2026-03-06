import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { login } = useAuth();

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
    setLoginError('');
    
    try {
      await login(formData.username, formData.password);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form card fade-in">
        <h1>Library Management System</h1>
        <h2>Login</h2>
        
        {loginError && (
          <div className="error-message">
            {loginError}
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
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-info">
          <p>Sample accounts:</p>
          <p>Admin: admin / admin123</p>
          <p>User: user1 / user123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;