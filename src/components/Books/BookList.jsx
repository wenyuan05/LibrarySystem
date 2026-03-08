import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { booksAPI, borrowAPI, usersAPI } from '../../utils/api';
import './Books.css';

const BookList = ({ books = [], loading = false, onBookUpdated, onBookDeleted, showEditButton = false, onEditBook }) => {
  const [error, setError] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [borrowRecords, setBorrowRecords] = useState([]);
  const { user } = useAuth();
  const { showToast } = useToast();

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
        const updatedBook = { ...book, status: 'borrowed' };
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
        const updatedBook = { ...book, status: 'available' };
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
    return <div className="loading">Loading books...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="book-list">
      <h3>Books</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Author</th>
            <th>ISBN</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map(book => (
            <tr key={book.id} className="fade-in">
              <td>{book.id}</td>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.isbn}</td>
              <td className={`status-${book.status}`}>{book.status}</td>
              <td>
                {user.role === 'user' ? (
                  book.status === 'available' ? (
                    <button 
                      className="btn-warning"
                      onClick={() => handleBorrowBook(book.id)}
                    >
                      Borrow
                    </button>
                  ) : (
                    // 只有当用户有对应的未归还借阅记录时才显示归还按钮
                    borrowRecords.some(record => record.book_id === book.id) && (
                      <button 
                        className="btn-info"
                        onClick={() => handleReturnBook(book.id)}
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
                        onClick={() => onEditBook && onEditBook(book)}
                      >
                        Edit
                      </button>
                    )}
                    <button 
                      className="btn-success"
                      onClick={() => handleUpdateStatus(book.id, book.status)}
                    >
                      {book.status === 'available' ? 'Mark Borrowed' : 'Mark Available'}
                    </button>
                    <button 
                      className="btn-danger"
                      onClick={() => handleDeleteBook(book.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookList;