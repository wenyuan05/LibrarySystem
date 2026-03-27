import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import releaseConfig from '../../config/releaseConfig';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Library System</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="user-info">
        <h4>{user?.name || 'Reader'}</h4>
        <p>
          {user?.role === 'admin' ? 'Administrator' : 
           user?.role === 'librarian' ? 'Librarian' : 'Reader'}
        </p>
        <p>{user?.email || ''}</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {user.role !== 'admin' && user.role !== 'librarian' && (
            <li className={location.pathname === '/' || location.pathname === '/books' ? 'active' : ''}>
              <Link to="/books" onClick={onClose}>
                <span className="nav-icon">📚</span>
                <span className="nav-text">Books</span>
              </Link>
            </li>
          )}
          
          {user.role === 'user' && (
            <>
              <li className={location.pathname === '/borrow-records' ? 'active' : ''}>
                <Link to="/borrow-records" onClick={onClose}>
                  <span className="nav-icon">📖</span>
                  <span className="nav-text">My Borrows</span>
                </Link>
              </li>
            </>
          )}
          
          {(user.role === 'admin' || user.role === 'librarian') && (
            <>
              {user.role !== 'admin' && (
                <li className={location.pathname === '/book-management' ? 'active' : ''}>
                  <Link to="/book-management" onClick={onClose}>
                    <span className="nav-icon">📚</span>
                    <span className="nav-text">Book Management</span>
                  </Link>
                </li>
              )}
              {user.role !== 'admin' && (
                <li className={location.pathname === '/return-approval' ? 'active' : ''}>
                  <Link to="/return-approval" onClick={onClose}>
                    <span className="nav-icon">🔄</span>
                    <span className="nav-text">Return Approval</span>
                  </Link>
                </li>
              )}
              <li className={location.pathname === '/users' ? 'active' : ''}>
                <Link to="/users" onClick={onClose}>
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">User Management</span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;