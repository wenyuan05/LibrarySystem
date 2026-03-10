import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login/Login';
import Sidebar from './components/Sidebar/Sidebar';
import BookList from './components/Books/BookList';
import AddBookForm from './components/Books/AddBookForm';
import EditBookForm from './components/Books/EditBookForm';
import BorrowRecords from './components/Borrow/BorrowRecords';
import UserBorrowRecords from './components/Borrow/UserBorrowRecords';
import UserList from './components/Users/UserList';
import { booksAPI } from './utils/api';
import './styles/global.css';

// 主布局组件
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

// 书籍页面
const BooksPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [booksLoading, setBooksLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // 加载书籍数据
  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      setError(null);
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
      const errorMessage = 'Failed to load books. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setBooksLoading(false);
    }
  };

  // 处理书籍更新
  const handleBookUpdated = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // 处理书籍删除
  const handleBookDeleted = (bookId) => {
    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
  };

  // 组件挂载时加载书籍
  useEffect(() => {
    fetchBooks();
  }, []);

  // 处理搜索
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(term.toLowerCase()) ||
        book.author.toLowerCase().includes(term.toLowerCase()) ||
        book.isbn.includes(term)
      );
      setFilteredBooks(filtered);
    }
  };

  // 当书籍列表变化时，更新过滤后的书籍
  useEffect(() => {
    setFilteredBooks(books);
  }, [books]);

  if (error) {
    return (
      <div className="books-section card fade-in">
        <h2>Books</h2>
        <div className="error-message">
          {error}
          <button onClick={fetchBooks} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="books-section card fade-in">
      <h2>Books</h2>
      
      {/* 搜索栏 */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search books by title, author, or ISBN..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      {/* 书籍列表 */}
      <BookList 
        books={filteredBooks}
        loading={booksLoading}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
      />
    </div>
  );
};

// 书籍管理页面（管理员）
const BookManagementPage = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [booksLoading, setBooksLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  // 加载书籍数据
  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      setError(null);
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
      const errorMessage = 'Failed to load books. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setBooksLoading(false);
    }
  };

  // 处理书籍添加
  const handleBookAdded = (newBook) => {
    setBooks(prevBooks => [...prevBooks, newBook]);
  };

  // 处理书籍更新
  const handleBookUpdated = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // 处理书籍删除
  const handleBookDeleted = (bookId) => {
    setBooks(prevBooks => prevBooks.filter(book => book.id !== bookId));
  };

  // 组件挂载时加载书籍
  useEffect(() => {
    fetchBooks();
  }, []);

  // 处理书籍编辑
  const handleBookEdit = (updatedBook) => {
    setBooks(prevBooks => prevBooks.map(book => 
      book.id === updatedBook.id ? updatedBook : book
    ));
  };

  // 处理搜索
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book => 
        book.title.toLowerCase().includes(term.toLowerCase()) ||
        book.author.toLowerCase().includes(term.toLowerCase()) ||
        book.isbn.includes(term)
      );
      setFilteredBooks(filtered);
    }
  };

  // 当书籍列表变化时，更新过滤后的书籍
  useEffect(() => {
    setFilteredBooks(books);
  }, [books]);

  if (error) {
    return (
      <div className="book-management-section card fade-in">
        <h2>Book Management</h2>
        <div className="error-message">
          {error}
          <button onClick={fetchBooks} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-management-section card fade-in">
      <h2>Book Management</h2>
      
      {/* 操作栏 */}
      <div className="action-bar">
        <button 
          className="btn-primary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add New Book'}
        </button>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search books by title, author, or ISBN..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>
      
      {/* 添加书籍表单 */}
      {showAddForm && (
        <AddBookForm 
          onBookAdded={(newBook) => {
            handleBookAdded(newBook);
            setShowAddForm(false);
          }}
        />
      )}
      
      {/* 编辑书籍表单 */}
      {editingBook && (
        <EditBookForm 
          book={editingBook}
          onEditComplete={(updatedBook) => {
            handleBookEdit(updatedBook);
            setEditingBook(null);
          }}
          onCancel={() => setEditingBook(null)}
        />
      )}

      {/* 书籍列表（带编辑功能） */}
      <BookList 
        books={filteredBooks}
        loading={booksLoading}
        onBookUpdated={handleBookUpdated}
        onBookDeleted={handleBookDeleted}
        showEditButton={true}
        onEditBook={setEditingBook}
      />
    </div>
  );
};

// 借阅记录页面
const BorrowRecordsPage = () => {
  return (
    <div className="borrow-section card fade-in">
      <h2>My Borrow Records</h2>
      <BorrowRecords />
    </div>
  );
};

// 用户管理页面（管理员）
const UserManagementPage = () => {
  return (
    <div className="users-section card fade-in">
      <h2>User Management</h2>
      
      {/* 用户列表 */}
      <UserList />
    </div>
  );
};

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
          <Route path="/user-borrow-records/:userId" element={<ProtectedRoute requiredRole="admin"><MainLayout><UserBorrowRecords /></MainLayout></ProtectedRoute>} />
          <Route path="/book-management" element={<ProtectedRoute requiredRole="admin"><MainLayout><BookManagementPage /></MainLayout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute requiredRole="admin"><MainLayout><UserManagementPage /></MainLayout></ProtectedRoute>} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;