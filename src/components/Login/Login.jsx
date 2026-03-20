import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../utils/api';
import privacyConfig from '../../config/privacy';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', password: '', name: '', email: '' });
  const [resetData, setResetData] = useState({ email: '', phone: '' });
  const [newPasswordData, setNewPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [resetToken, setResetToken] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 检查URL中是否有重置令牌
  React.useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setIsForgotPasswordMode(false);
      setIsResetPasswordMode(true);
    }
  }, [searchParams]);

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

  const validateLoginForm = () => {
    if (!formData.username.trim()) {
      setLoginError('Username is required');
      return false;
    }
    if (formData.username.length < 3 || formData.username.length > 20) {
      setLoginError('Username must be between 3 and 20 characters');
      return false;
    }
    if (!formData.password) {
      setLoginError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setLoginError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    
    if (!validateLoginForm()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      await login(formData.username, formData.password);
      // 登录成功后导航到首页
      navigate('/');
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateRegisterForm = () => {
    if (!registerData.username.trim()) {
      setLoginError('Username is required');
      return false;
    }
    if (registerData.username.length < 3 || registerData.username.length > 20) {
      setLoginError('Username must be between 3 and 20 characters');
      return false;
    }
    if (!registerData.password) {
      setLoginError('Password is required');
      return false;
    }
    if (registerData.password.length < 6) {
      setLoginError('Password must be at least 6 characters');
      return false;
    }
    if (!registerData.name.trim()) {
      setLoginError('Name is required');
      return false;
    }
    if (registerData.name.length < 2 || registerData.name.length > 50) {
      setLoginError('Name must be between 2 and 50 characters');
      return false;
    }
    if (!registerData.email.trim()) {
      setLoginError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setLoginError('Invalid email format');
      return false;
    }
    return true;
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewPasswordChange = (e) => {
    const { name, value } = e.target;
    setNewPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateResetForm = () => {
    if (!resetData.email.trim() && !resetData.phone.trim()) {
      setLoginError('Email or phone is required');
      return false;
    }
    if (resetData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetData.email)) {
        setLoginError('Invalid email format');
        return false;
      }
    }
    return true;
  };

  const validateNewPasswordForm = () => {
    if (!newPasswordData.newPassword) {
      setLoginError('New password is required');
      return false;
    }
    if (newPasswordData.newPassword.length < 6) {
      setLoginError('New password must be at least 6 characters');
      return false;
    }
    if (newPasswordData.newPassword !== newPasswordData.confirmPassword) {
      setLoginError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    
    if (!validateResetForm()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      const response = await authAPI.requestPasswordReset(resetData);
      setResetToken(response.token);
      setFoundUser(response.user);
      setIsForgotPasswordMode(false);
      setIsResetPasswordMode(true);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginError('');
    
    if (!validateNewPasswordForm()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      // 使用本地存储的token
      const token = resetToken || searchParams.get('token');
      await authAPI.resetPassword(token, newPasswordData.newPassword);
      setResetSuccess(true);
      // 3秒后返回登录页
      setTimeout(() => {
        setIsResetPasswordMode(false);
        setResetSuccess(false);
        setResetToken('');
        setFoundUser(null);
        setNewPasswordData({ newPassword: '', confirmPassword: '' });
      }, 3000);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form card fade-in">
        <h1>{privacyConfig.website.name}</h1>
        <h2>{isRegisterMode ? 'Register' : 'Login'}</h2>
        
        {loginError && (
          <div className="error-message">
            {loginError}
          </div>
        )}
        
        {!isRegisterMode && !isForgotPasswordMode && !isResetPasswordMode && (
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
              <button
                type="button"
                className="btn-link forgot-password"
                onClick={() => setIsForgotPasswordMode(true)}
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
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

        {isForgotPasswordMode && (
          <form onSubmit={handleForgotPasswordSubmit}>
            <h3>Forgot Password</h3>
            <p>Enter your email or phone number to find your account</p>
            <div className="form-group">
              <label htmlFor="email">Email (optional):</label>
              <input
                type="email"
                id="email"
                name="email"
                value={resetData.email}
                onChange={handleResetChange}
                disabled={isSubmitting}
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone (optional):</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={resetData.phone}
                onChange={handleResetChange}
                disabled={isSubmitting}
                placeholder="Enter your phone number"
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Finding account...' : 'Find Account'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsForgotPasswordMode(false);
                setResetData({ email: '', phone: '' });
              }}
              disabled={isSubmitting}
            >
              Back to Login
            </button>
          </form>
        )}

        {isResetPasswordMode && (
          <form onSubmit={handleResetPasswordSubmit}>
            <h3>Reset Password</h3>
            {resetSuccess ? (
              <div className="success-message">
                <p>Password reset successfully!</p>
                <p>You will be redirected to login page in 3 seconds...</p>
              </div>
            ) : (
              <>
                {foundUser && (
                  <div className="success-message">
                    <p>Account found:</p>
                    <p><strong>Username:</strong> {foundUser.username}</p>
                    <p><strong>Name:</strong> {foundUser.name}</p>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="newPassword">New Password:</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPasswordData.newPassword}
                    onChange={handleNewPasswordChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password:</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={newPasswordData.confirmPassword}
                    onChange={handleNewPasswordChange}
                    required
                    disabled={isSubmitting}
                    placeholder="Confirm your new password"
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setIsResetPasswordMode(false);
                    setResetToken('');
                    setFoundUser(null);
                    setNewPasswordData({ newPassword: '', confirmPassword: '' });
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </>
            )}
          </form>
        )}

        {isRegisterMode && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsSubmitting(true);
              setLoginError('');
              
              if (!validateRegisterForm()) {
                setIsSubmitting(false);
                return;
              }
              
              try {
                await register(registerData);
                // 注册成功后导航到首页
                navigate('/');
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
                // 重置 registerData 状态，避免在切换模式时保留数据
                setRegisterData({ username: '', password: '', name: '', email: '' });
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