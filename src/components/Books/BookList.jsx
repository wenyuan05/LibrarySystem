import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { booksAPI, borrowAPI, usersAPI } from '../../utils/api';
import SkeletonLoader from './SkeletonLoader';
import './Books.css';

const BookList = ({ books = [], loading = false, onBookUpdated, onBookDeleted, showEditButton = false, onEditBook }) => {
  const [error, setError] = useState(null);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 处理书籍点击，跳转到详情页
  const handleBookClick = (bookId) => {
    navigate(`/books/${bookId}`);
  };

  // 获取用户借阅记录
  useEffect(() => {
    const fetchBorrowRecords = async () => {
      if (user?.id) {
        try {
          const records = await usersAPI.getBorrowRecords(user.id);
          // 过滤出未归还的借阅记录
          const activeRecords = records.filter(record => !record.return_date);
          setBorrowRecords(activeRecords);
        } catch (err) {
          console.error('Failed to fetch borrow records:', err);
        }
      }
    };

    fetchBorrowRecords();
  }, [user]);

  // 处理书籍状态更新（管理员）
  const handleUpdateStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'available' ? 'borrowed' : 'available';
      await booksAPI.updateStatus(id, newStatus);
      const book = books.find(book => book.id === id);
      if (book) {
        const updatedBook = { ...book, status: newStatus };
        if (onBookUpdated) {
          onBookUpdated(updatedBook);
        }
        showToast(`Book status updated to ${newStatus}`, 'success');
      } else {
        throw new Error('Book not found');
      }
    } catch (err) {
      setError('Failed to update book status');
      showToast('Failed to update book status', 'error');
      console.error(err);
    }
  };

  // 处理书籍删除（管理员）
  const handleDeleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksAPI.delete(id);
        if (onBookDeleted) {
          onBookDeleted(id);
        }
        showToast('Book deleted successfully', 'success');
      } catch (err) {
        setError('Failed to delete book');
        showToast('Failed to delete book', 'error');
        console.error(err);
      }
    }
  };

  // 处理借阅书籍（用户）
  const handleBorrowBook = async (bookId) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      const result = await borrowAPI.borrow(user.id, bookId);
      const book = books.find(book => book.id === bookId);
      if (book) {
        const updatedBook = { ...book, available_copies: book.available_copies - 1 };
        if (onBookUpdated) {
          onBookUpdated(updatedBook);
        }
        // 更新借阅记录状态
        setBorrowRecords(prevRecords => [...prevRecords, result]);
        showToast('Book borrowed successfully', 'success');
      } else {
        throw new Error('Book not found');
      }
    } catch (err) {
      setError('Failed to borrow book');
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理归还书籍（用户）
  const handleReturnBook = async (bookId) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      await borrowAPI.return(user.id, bookId);
      const book = books.find(book => book.id === bookId);
      if (book) {
        const updatedBook = { ...book, available_copies: book.available_copies + 1 };
        if (onBookUpdated) {
          onBookUpdated(updatedBook);
        }
        // 更新借阅记录状态
        setBorrowRecords(prevRecords => prevRecords.filter(record => record.book_id !== bookId));
        showToast('Book returned successfully', 'success');
      } else {
        throw new Error('Book not found');
      }
    } catch (err) {
      setError('Failed to return book');
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  if (loading) {
    return <SkeletonLoader count={5} />;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={() => setError(null)} className="btn-primary">Dismiss</button>
      </div>
    );
  }

  // 动画变量
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="book-list">
      <h3>Books</h3>
      <motion.div
        className="book-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {books.map(book => (
          <motion.div 
            key={book.id} 
            variants={itemVariants}
            className="book-card"
            onClick={() => handleBookClick(book.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className="book-card-header">
              <span className={`status-badge ${book.available_copies > 0 ? 'status-available' : 'status-borrowed'}`}>
                {book.available_copies > 0 ? 'Available' : 'Not Available'}
              </span>
              <span className="book-id">ID: {book.id}</span>
            </div>
            <h4 className="book-title">{book.title}</h4>
            <p className="book-author">by {book.author}</p>
            <p className="book-isbn">ISBN: {book.isbn}</p>
            {book.publisher && <p className="book-publisher">Publisher: {book.publisher}</p>}
            {book.publication_date && <p className="book-date">Published: {book.publication_date}</p>}
            <p className="book-copies">Available: {book.available_copies}/{book.total_copies}</p>
            <div className="book-actions">
              {user.role === 'user' ? (
                book.available_copies > 0 ? (
                  <button 
                    className="btn-warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBorrowBook(book.id);
                    }}
                  >
                    Borrow
                  </button>
                ) : (
                  // 只有当用户有对应的未归还借阅记录时才显示归还按钮
                  borrowRecords.some(record => record.book_id === book.id) && (
                    <button 
                      className="btn-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReturnBook(book.id);
                      }}
                    >
                      Return
                    </button>
                  )
                )
              ) : (
                <>
                  {showEditButton && (
                    <button 
                      className="btn-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBook && onEditBook(book);
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button 
                    className="btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteBook(book.id);
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default BookList;