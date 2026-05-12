import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../Sidebar/Sidebar';

const MainLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app-container">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 主内容 */}
      <div className="main-content">
        {/* 顶部导航 */}
        <header className="header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <h1>Library Management System</h1>
          <div className="user-menu">
            <span className="user-avatar">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
            <span>{user?.name || 'User'}</span>
          </div>
        </header>

        {/* 内容区域 */}
        <div className="content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
