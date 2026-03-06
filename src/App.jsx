import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import BookList from './components/Books/BookList';
import AddBookForm from './components/Books/AddBookForm';
import BorrowRecords from './components/Borrow/BorrowRecords';
import UserList from './components/Users/UserList';
import AddUserForm from './components/Users/AddUserForm';
import './styles/global.css';

// 主应用内容组件
const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('books');

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return <Login />;
  }

  // 处理标签切换
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <div className="app-container">
      {/* 侧边栏 */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 主内容 */}
      <div className="main-content">
        {/* 顶部导航 */}
        <header className="header">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <h1>Library Management System</h1>
          <div className="user-menu">
            <span>{user.name}</span>
          </div>
        </header>

        {/* 内容区域 */}
        <div className="content">
          {/* 书籍管理 */}
          {activeTab === 'books' && (
            <div className="books-section card fade-in">
              <h2>Books Management</h2>
              
              {/* 添加书籍表单（仅管理员） */}
              {user.role === 'admin' && (
                <AddBookForm />
              )}

              {/* 书籍列表 */}
              <BookList />
            </div>
          )}

          {/* 借阅记录 */}
          {activeTab === 'borrow' && user.role === 'user' && (
            <div className="borrow-section card fade-in">
              <h2>My Borrow Records</h2>
              <BorrowRecords />
            </div>
          )}

          {/* 用户管理（管理员） */}
          {activeTab === 'users' && user.role === 'admin' && (
            <div className="users-section card fade-in">
              <h2>User Management</h2>
              
              {/* 添加用户表单 */}
              <AddUserForm />

              {/* 用户列表 */}
              <UserList />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 主应用组件，使用AuthProvider包装
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App