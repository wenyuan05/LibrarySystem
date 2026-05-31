import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

// 创建认证上下文
const AuthContext = createContext();

// 认证提供者组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 登录函数
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authAPI.login(username, password);
      setUser(userData);
      // 存储用户信息到本地存储
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 注册函数（注册成功后自动登录）
  const register = async ({ username, password, name, email, verificationCode }) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await authAPI.register({ username, password, name, email, verificationCode });
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = () => {
    setUser(null);
    // 从本地存储中移除用户信息
    localStorage.removeItem('user');
  };

  // 初始化时检查本地存储中的用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // 上下文值
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
