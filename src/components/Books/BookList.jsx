import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { booksAPI, borrowAPI } from '../../utils/api';
import './Books.css';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // 加载书籍数据
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (err) {
      setError('Failed to load books');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 处理书籍状态更新（管理员）
  const handleUpdateStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'available' ? 'borrowed' : 'available';
      await booksAPI.updateStatus(id, newStatus);
      setBooks(books.map(book => 
        book.id === id ? { ...book, status: newStatus } : book
      ));
    } catch (err) {
      setError('Failed to update book status');
      console.error(err);
    }
  };

  // 处理书籍删除（管理员）
  const handleDeleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await booksAPI.delete(id);
        setBooks(books.filter(book => book.id !== id));
      } catch (err) {
        setError('Failed to delete book');
        console.error(err);
      }
    }
  };

  // 处理借阅书籍（用户）
  const handleBorrowBook = async (bookId) => {
    try {
      await borrowAPI.borrow(user.id, bookId);
      setBooks(books.map(book => 
        book.id === bookId ? { ...book, status: 'borrowed' } : book
      ));
      alert('Book borrowed successfully');
    } catch (err) {
      setError('Failed to borrow book');
      alert(err.message);
      console.error(err);
    }
  };

  // 处理归还书籍（用户）
  const handleReturnBook = async (bookId) => {
    try {
      await borrowAPI.return(user.id, bookId);
      setBooks(books.map(book => 
        book.id === bookId ? { ...book, status: 'available' } : book
      ));
      alert('Book returned successfully');
    } catch (err) {
      setError('Failed to return book');
      alert(err.message);
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
        <button onClick={fetchBooks} className="btn-primary">Retry</button>
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
                    <button 
                      className="btn-info"
                      onClick={() => handleReturnBook(book.id)}
                    >
                      Return
                    </button>
                  )
                ) : (
                  <>
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