import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login/Login';
import MainLayout from './components/layout/MainLayout';
import BooksPage from './pages/BooksPage';
import BookManagementPage from './pages/BookManagementPage';
import BorrowRecordsPage from './pages/BorrowRecordsPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AnnouncementManagementPage from './pages/AnnouncementManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import StatsPage from './pages/StatsPage';
import LogsPage from './pages/LogsPage';
import UserBorrowRecords from './components/Borrow/UserBorrowRecords';
import ReturnApprovalPage from './pages/ReturnApprovalPage';
import './styles/global.css';

// 主应用组件
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><MainLayout><BooksPage /></MainLayout></ProtectedRoute>} />
            <Route path="/books" element={<ProtectedRoute requiredRole="user"><MainLayout><BooksPage /></MainLayout></ProtectedRoute>} />
            <Route path="/borrow-records" element={<ProtectedRoute><MainLayout><BorrowRecordsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/user-borrow-records/:userId" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><UserBorrowRecords /></MainLayout></ProtectedRoute>} />
            <Route path="/book-management" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><BookManagementPage /></MainLayout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><UserManagementPage /></MainLayout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><MainLayout><AnnouncementsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/announcement-management" element={<ProtectedRoute requiredRole="admin"><MainLayout><AnnouncementManagementPage /></MainLayout></ProtectedRoute>} />
            <Route path="/category-management" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><CategoryManagementPage /></MainLayout></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><MainLayout><StatsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/return-approval" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><ReturnApprovalPage /></MainLayout></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute requiredRole="admin"><MainLayout><LogsPage /></MainLayout></ProtectedRoute>} />
            <Route path="/system-settings" element={<ProtectedRoute requiredRole="admin"><MainLayout><SystemSettingsPage /></MainLayout></ProtectedRoute>} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;