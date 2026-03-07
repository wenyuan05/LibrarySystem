import React from 'react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose, activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Library System</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="user-info">
        <h4>{user.name}</h4>
        <p>{user.role === 'admin' ? 'Administrator' : 'User'}</p>
        <p>{user.email}</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li className={activeTab === 'books' ? 'active' : ''}>
            <button onClick={() => onTabChange('books')}>
              <span className="nav-icon">📚</span>
              <span className="nav-text">Books</span>
            </button>
          </li>
          
          {user.role === 'user' && (
            <li className={activeTab === 'borrow' ? 'active' : ''}>
              <button onClick={() => onTabChange('borrow')}>
                <span className="nav-icon">📖</span>
                <span className="nav-text">My Borrows</span>
              </button>
            </li>
          )}
          
          {user.role === 'admin' && (
            <>
              <li className={activeTab === 'book-management' ? 'active' : ''}>
                <button onClick={() => onTabChange('book-management')}>
                  <span className="nav-icon">📚</span>
                  <span className="nav-text">Book Management</span>
                </button>
              </li>
              <li className={activeTab === 'users' ? 'active' : ''}>
                <button onClick={() => onTabChange('users')}>
                  <span className="nav-icon">👥</span>
                  <span className="nav-text">User Management</span>
                </button>
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