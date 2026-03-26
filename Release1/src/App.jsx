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
import ReturnApprovalPage from './pages/ReturnApprovalPage';
import BookDetailsPage from './pages/BookDetailsPage';
import privacyConfig from './config/privacy';
import releaseConfig from './config/releaseConfig';
import './styles/global.css';

// 主应用组件
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="app-container">
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><MainLayout><BooksPage /></MainLayout></ProtectedRoute>} />
              <Route path="/books" element={<ProtectedRoute requiredRole="user"><MainLayout><BooksPage /></MainLayout></ProtectedRoute>} />
              <Route path="/books/:id" element={<ProtectedRoute requiredRole="user"><MainLayout><BookDetailsPage /></MainLayout></ProtectedRoute>} />
              <Route path="/borrow-records" element={<ProtectedRoute><MainLayout><BorrowRecordsPage /></MainLayout></ProtectedRoute>} />
              <Route path="/book-management" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><BookManagementPage /></MainLayout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><UserManagementPage /></MainLayout></ProtectedRoute>} />
              <Route path="/return-approval" element={<ProtectedRoute requiredRole={['admin', 'librarian']}><MainLayout><ReturnApprovalPage /></MainLayout></ProtectedRoute>} />
            </Routes>
          </Router>
          <footer className="app-footer">
            <div className="footer-content">
              <p>{privacyConfig.website.copyright}</p>
              <p>
                <a href={privacyConfig.icp.url} target="_blank" rel="noopener noreferrer">
                  {privacyConfig.icp.number}
                </a>
              </p>
            </div>
          </footer>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;