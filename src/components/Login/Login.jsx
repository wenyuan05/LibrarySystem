import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authAPI } from '../../utils/api';
import privacyConfig from '../../config/privacy';
import './Login.css';

const INITIAL_LOGIN_DATA = { username: '', password: '' };
const INITIAL_REGISTER_DATA = {
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
};
const INITIAL_RESET_DATA = { email: '', phone: '' };
const INITIAL_NEW_PASSWORD_DATA = { newPassword: '', confirmPassword: '' };

const Login = () => {
  const [formData, setFormData] = useState(INITIAL_LOGIN_DATA);
  const [registerData, setRegisterData] = useState(INITIAL_REGISTER_DATA);
  const [resetData, setResetData] = useState(INITIAL_RESET_DATA);
  const [newPasswordData, setNewPasswordData] = useState(INITIAL_NEW_PASSWORD_DATA);
  const [resetToken, setResetToken] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
      setLoginError('');
      setIsRegisterMode(false);
      setIsForgotPasswordMode(false);
      setIsResetPasswordMode(true);
    }
  }, [searchParams]);

  const handleChange = (setter) => (event) => {
    const { name, value } = event.target;
    setter((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetRegisterForm = () => {
    setRegisterData(INITIAL_REGISTER_DATA);
  };

  const returnToLogin = () => {
    setLoginError('');
    setResetSuccess(false);
    setIsRegisterMode(false);
    setIsForgotPasswordMode(false);
    setIsResetPasswordMode(false);
    setFoundUser(null);
    setResetToken('');
    setResetData(INITIAL_RESET_DATA);
    setNewPasswordData(INITIAL_NEW_PASSWORD_DATA);
  };

  const switchMode = () => {
    setLoginError('');
    setResetSuccess(false);
    setFoundUser(null);
    setResetToken('');
    setResetData(INITIAL_RESET_DATA);
    setNewPasswordData(INITIAL_NEW_PASSWORD_DATA);
    setIsForgotPasswordMode(false);
    setIsResetPasswordMode(false);
    setIsRegisterMode((prev) => !prev);
    setFormData(INITIAL_LOGIN_DATA);
    resetRegisterForm();
  };

  const validateLoginForm = () => {
    const username = formData.username.trim();

    if (!username) {
      setLoginError('Username is required');
      return false;
    }
    if (username.length < 3 || username.length > 20) {
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

  const validateRegisterForm = () => {
    const username = registerData.username.trim();
    const name = registerData.name.trim();
    const email = registerData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username) {
      setLoginError('Username is required');
      return false;
    }
    if (username.length < 3 || username.length > 20) {
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
    if (!registerData.confirmPassword) {
      setLoginError('Please confirm your password');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setLoginError('Passwords do not match');
      return false;
    }
    if (!name) {
      setLoginError('Name is required');
      return false;
    }
    if (name.length < 2 || name.length > 50) {
      setLoginError('Name must be between 2 and 50 characters');
      return false;
    }
    if (!email) {
      setLoginError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setLoginError('Invalid email format');
      return false;
    }

    return true;
  };

  const validateResetForm = () => {
    if (!resetData.email.trim() && !resetData.phone.trim()) {
      setLoginError('Email or phone is required');
      return false;
    }

    if (resetData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetData.email.trim())) {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    if (!validateLoginForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      await login(formData.username.trim(), formData.password);
      navigate('/');
    } catch (error) {
      setLoginError(error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    if (!validateRegisterForm()) {
      setIsSubmitting(false);
      return;
    }

    const payload = {
      username: registerData.username.trim(),
      password: registerData.password,
      name: registerData.name.trim(),
      email: registerData.email.trim(),
    };

    try {
      await register(payload);
      showToast('Reader account created successfully.', 'success');
      resetRegisterForm();
      navigate('/');
    } catch (error) {
      setLoginError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    if (!validateResetForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await authAPI.requestPasswordReset({
        email: resetData.email.trim(),
        phone: resetData.phone.trim(),
      });
      setResetToken(response.token);
      setFoundUser(response.user);
      setIsForgotPasswordMode(false);
      setIsResetPasswordMode(true);
    } catch (error) {
      setLoginError(error.message || 'Unable to find the account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setLoginError('');

    if (!validateNewPasswordForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const token = resetToken || searchParams.get('token');
      await authAPI.resetPassword(token, newPasswordData.newPassword);
      setResetSuccess(true);
      showToast('Password reset successfully.', 'success');

      setTimeout(() => {
        returnToLogin();
      }, 3000);
    } catch (error) {
      setLoginError(error.message || 'Password reset failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isRegisterMode
    ? 'Create Reader Account'
    : isForgotPasswordMode
      ? 'Recover Account'
      : isResetPasswordMode
        ? 'Reset Password'
        : 'Login';

  const subtitle = isRegisterMode
    ? 'Register your own reader account and start using the library system right away.'
    : isForgotPasswordMode
      ? 'Enter your email or phone number to locate your account.'
      : isResetPasswordMode
        ? 'Set a new password to regain access to your account.'
        : 'Sign in with an existing account or create a new reader account.';

  return (
    <div className="login-container">
      <div className={`login-form card fade-in ${isRegisterMode ? 'register-active' : ''}`}>
        <div className="login-header">
          <span className="login-badge">
            {isRegisterMode ? 'Reader Registration' : 'Library Portal'}
          </span>
          <h1>{privacyConfig.website.name}</h1>
          <h2>{title}</h2>
          <p className="login-subtitle">{subtitle}</p>
        </div>

        {loginError && (
          <div className="error-message login-feedback" role="alert" aria-live="polite">
            {loginError}
          </div>
        )}

        {!isRegisterMode && !isForgotPasswordMode && !isResetPasswordMode && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange(setFormData)}
                required
                disabled={isSubmitting}
                autoComplete="username"
                placeholder="Enter your username"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange(setFormData)}
                required
                disabled={isSubmitting}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="btn-link forgot-password"
                onClick={() => {
                  setLoginError('');
                  setIsForgotPasswordMode(true);
                }}
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>
            <button type="submit" className="btn-primary auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {isForgotPasswordMode && (
          <form onSubmit={handleForgotPasswordSubmit}>
            <div className="form-panel">
              <div className="form-panel-title">Account recovery</div>
              <p className="form-panel-text">
                Enter either your email address or phone number. The system will verify your account before resetting the password.
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email (optional)</label>
              <input
                type="email"
                id="email"
                name="email"
                value={resetData.email}
                onChange={handleChange(setResetData)}
                disabled={isSubmitting}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone (optional)</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={resetData.phone}
                onChange={handleChange(setResetData)}
                disabled={isSubmitting}
                placeholder="Enter your phone number"
                autoComplete="tel"
              />
            </div>
            <div className="auth-actions">
              <button type="submit" className="btn-primary auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Finding account...' : 'Find Account'}
              </button>
              <button
                type="button"
                className="btn-secondary auth-secondary"
                onClick={returnToLogin}
                disabled={isSubmitting}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {isResetPasswordMode && (
          <form onSubmit={handleResetPasswordSubmit}>
            {resetSuccess ? (
              <div className="success-message login-feedback" role="status" aria-live="polite">
                <p>Password reset successfully.</p>
                <p>You will be redirected to the login page in 3 seconds.</p>
              </div>
            ) : (
              <>
                {foundUser && (
                  <div className="success-message login-feedback">
                    <p>Account found</p>
                    <p><strong>Username:</strong> {foundUser.username}</p>
                    <p><strong>Name:</strong> {foundUser.name}</p>
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={newPasswordData.newPassword}
                    onChange={handleChange(setNewPasswordData)}
                    required
                    disabled={isSubmitting}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={newPasswordData.confirmPassword}
                    onChange={handleChange(setNewPasswordData)}
                    required
                    disabled={isSubmitting}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                </div>
                <div className="auth-actions">
                  <button type="submit" className="btn-primary auth-submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary auth-secondary"
                    onClick={returnToLogin}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {isRegisterMode && (
          <form onSubmit={handleRegisterSubmit}>
            <div className="form-panel register-panel">
              <div className="form-panel-title">Registration checklist</div>
              <p className="form-panel-text">
                Use a unique username, a password with at least 6 characters, and a valid email address. The account will be created as a reader account.
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <input
                type="text"
                id="reg-username"
                name="username"
                value={registerData.username}
                onChange={handleChange(setRegisterData)}
                required
                disabled={isSubmitting}
                autoComplete="username"
                placeholder="Choose a username"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-password">Password</label>
                <input
                  type="password"
                  id="reg-password"
                  name="password"
                  value={registerData.password}
                  onChange={handleChange(setRegisterData)}
                  required
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="form-group">
                <label htmlFor="reg-confirm-password">Confirm Password</label>
                <input
                  type="password"
                  id="reg-confirm-password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleChange(setRegisterData)}
                  required
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-name">Name</label>
              <input
                type="text"
                id="reg-name"
                name="name"
                value={registerData.name}
                onChange={handleChange(setRegisterData)}
                required
                disabled={isSubmitting}
                autoComplete="name"
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input
                type="email"
                id="reg-email"
                name="email"
                value={registerData.email}
                onChange={handleChange(setRegisterData)}
                required
                disabled={isSubmitting}
                autoComplete="email"
                placeholder="Enter your email address"
              />
            </div>
            <div className="auth-actions">
              <button type="submit" className="btn-primary auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Create Account'}
              </button>
              <button
                type="button"
                className="btn-secondary auth-secondary"
                onClick={switchMode}
                disabled={isSubmitting}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        <div className="login-info">
          {!isRegisterMode && !isForgotPasswordMode && !isResetPasswordMode ? (
            <>
              <p className="login-switch-text">
                Do not have an account yet?
                <button
                  type="button"
                  className="btn-link"
                  onClick={switchMode}
                  disabled={isSubmitting}
                >
                  Register now
                </button>
              </p>
              <div className="sample-account-box">
                <p className="sample-account-title">Sample accounts</p>
                <p>Admin: admin / admin123</p>
                <p>User: user1 / user123</p>
              </div>
            </>
          ) : isRegisterMode ? (
            <p className="register-footnote">
              The system will create your account with the default reader role and sign you in automatically after success.
            </p>
          ) : (
            <p className="register-footnote">
              After the password reset is complete, you can return here to sign in again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
