import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({
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
        <h2>{isRegisterMode ? 'Register' : 'Login'}</h2>
        
        {loginError && (
          <div className="error-message">
            {loginError}
          </div>
        )}
        
        {!isRegisterMode && (
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
        )}

        {isRegisterMode && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              setLoginError('');
              try {
                await register(registerData);
              } catch (error) {
                setLoginError(error.message);
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="form-group">
              <label htmlFor="reg-username">Username:</label>
              <input
                type="text"
                id="reg-username"
                name="username"
                value={registerData.username}
                onChange={handleRegisterChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Password:</label>
              <input
                type="password"
                id="reg-password"
                name="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-name">Name:</label>
              <input
                type="text"
                id="reg-name"
                name="name"
                value={registerData.name}
                onChange={handleRegisterChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email:</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
        
        <div className="login-info">
          <p>
            {isRegisterMode ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setLoginError('');
                setIsRegisterMode(!isRegisterMode);
              }}
              disabled={isSubmitting}
            >
              {isRegisterMode ? 'Back to Login' : 'Register now'}
            </button>
          </p>
          <p>Sample accounts:</p>
          <p>Admin: admin / admin123</p>
          <p>User: user1 / user123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;