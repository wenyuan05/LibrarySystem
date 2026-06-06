import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { useNotifications } from '../../context/notificationHooks';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  if (!user) return null;

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h3>Library System</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="user-info">
        <h4>{user?.name || 'User'}</h4>
        <p>
          {user?.role === 'admin' ? 'Administrator' : 
           user?.role === 'librarian' ? 'Librarian' : 'Reader'}
        </p>
        <p>{user?.email || ''}</p>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {/* 个人信息链接 - 非管理员可见 */}
          {user.role !== 'admin' && (
            <li className={location.pathname === '/profile' ? 'active' : ''}>
              <Link to="/profile" onClick={onClose}>
                <span className="nav-icon"><img src="/用户.svg" alt="User" /></span>
                <span className="nav-text">My Profile</span>
              </Link>
            </li>
          )}
          
          {/* 公告链接 - 非管理员可见 */}
          {user.role !== 'admin' && (
            <li className={location.pathname === '/announcements' ? 'active' : ''}>
              <Link to="/announcements" onClick={onClose}>
                <span className="nav-icon"><img src="/公告.svg" alt="Announcements" /></span>
                <span className="nav-text">Announcements</span>
              </Link>
            </li>
          )}
          
          {user.role !== 'admin' && user.role !== 'librarian' && (
            <li className={location.pathname === '/' || location.pathname === '/books' ? 'active' : ''}>
              <Link to="/books" onClick={onClose}>
                <span className="nav-icon"><img src="/图书 (1).svg" alt="Books" /></span>
                <span className="nav-text">Books</span>
              </Link>
            </li>
          )}
          
          {user.role === 'user' && (
            <>
              <li className={location.pathname === '/notifications' ? 'active' : ''}>
                <Link to="/notifications" onClick={onClose}>
                <span className="nav-icon nav-icon-badge">
                  <img src="/公告.svg" alt="Notifications" />
                  {unreadCount > 0 && <span className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
                </span>
                <span className="nav-text">Notifications</span>
              </Link>
              </li>
              <li className={location.pathname === '/borrow-records' ? 'active' : ''}>
                <Link to="/borrow-records" onClick={onClose}>
                <span className="nav-icon"><img src="/书.svg" alt="Borrows" /></span>
                <span className="nav-text">My Borrows</span>
              </Link>
              </li>
              <li className={location.pathname === '/reservations' ? 'active' : ''}>
                <Link to="/reservations" onClick={onClose}>
                <span className="nav-icon"><img src="/_预约订单.svg" alt="Reservations" /></span>
                <span className="nav-text">My Reservations</span>
              </Link>
              </li>
            </>
          )}
          
          {(user.role === 'admin' || user.role === 'librarian') && (
            <>
              {user.role !== 'admin' && (
                <li className={location.pathname === '/stats' ? 'active' : ''}>
                  <Link to="/stats" onClick={onClose}>
                <span className="nav-icon"><img src="/统计.svg" alt="Statistics" /></span>
                <span className="nav-text">Statistics</span>
              </Link>
                </li>
              )}
              <li className={location.pathname === '/income-dashboard' ? 'active' : ''}>
                <Link to="/income-dashboard" onClick={onClose}>
                <span className="nav-icon"><img src="/统计.svg" alt="Income Dashboard" /></span>
                <span className="nav-text">Income Dashboard</span>
              </Link>
              </li>
              {user.role !== 'admin' && (
                <li className={location.pathname === '/book-management' ? 'active' : ''}>
                  <Link to="/book-management" onClick={onClose}>
                <span className="nav-icon"><img src="/图书 (1).svg" alt="Book Management" /></span>
                <span className="nav-text">Book Management</span>
              </Link>
                </li>
              )}
              {user.role !== 'admin' && (
                <li className={location.pathname === '/return-approval' ? 'active' : ''}>
                  <Link to="/return-approval" onClick={onClose}>
                <span className="nav-icon"><img src="/归还.svg" alt="Return Approval" /></span>
                <span className="nav-text">Return Approval</span>
              </Link>
                </li>
              )}
              {user.role !== 'admin' && (
                <li className={location.pathname === '/category-management' ? 'active' : ''}>
                  <Link to="/category-management" onClick={onClose}>
                <span className="nav-icon"><img src="/分类.svg" alt="Category Management" /></span>
                <span className="nav-text">Category Management</span>
              </Link>
                </li>
              )}
              <li className={location.pathname === '/users' ? 'active' : ''}>
                <Link to="/users" onClick={onClose}>
                <span className="nav-icon"><img src="/用户.svg" alt="User Management" /></span>
                <span className="nav-text">User Management</span>
              </Link>
              </li>
              {user.role === 'admin' && (
                <>
                  <li className={location.pathname === '/announcement-management' ? 'active' : ''}>
                    <Link to="/announcement-management" onClick={onClose}>
                    <span className="nav-icon"><img src="/公告.svg" alt="Announcement Management" /></span>
                    <span className="nav-text">Announcement Management</span>
                  </Link>
                  </li>
                  <li className={location.pathname === '/logs' ? 'active' : ''}>
                    <Link to="/logs" onClick={onClose}>
                    <span className="nav-icon"><img src="/日志.svg" alt="System Logs" /></span>
                    <span className="nav-text">System Logs</span>
                  </Link>
                  </li>
                  <li className={location.pathname === '/system-settings' ? 'active' : ''}>
                    <Link to="/system-settings" onClick={onClose}>
                    <span className="nav-icon"><img src="/设置.svg" alt="System Settings" /></span>
                    <span className="nav-text">System Settings</span>
                  </Link>
                  </li>
                </>
              )}
            </>
          )}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={logout}>
          <span className="nav-icon"><img src="/退出.svg" alt="Logout" /></span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
