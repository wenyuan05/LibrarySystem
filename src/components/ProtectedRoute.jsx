import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const hasRequiredRole = Array.isArray(requiredRole) 
      ? requiredRole.includes(user.role) 
      : user.role === requiredRole;
    
    if (!hasRequiredRole) {
      // 管理员或图书管理员访问需要user角色的路径时的重定向逻辑
      if ((user.role === 'admin' || user.role === 'librarian') && (location.pathname === '/' || location.pathname === '/books')) {
        // 管理员重定向到用户管理页
        if (user.role === 'admin') {
          return <Navigate to="/users" replace />;
        }
        // 图书管理员重定向到书籍管理页
        if (user.role === 'librarian') {
          return <Navigate to="/book-management" replace />;
        }
      }
      return <Navigate to="/" replace />;
    }
  }

  // 管理员或图书管理员用户访问根路径时的重定向逻辑
  if ((user.role === 'admin' || user.role === 'librarian') && location.pathname === '/') {
    // 管理员重定向到用户管理页
    if (user.role === 'admin') {
      return <Navigate to="/users" replace />;
    }
    // 图书管理员重定向到书籍管理页
    if (user.role === 'librarian') {
      return <Navigate to="/book-management" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;