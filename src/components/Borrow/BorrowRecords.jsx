import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI, booksAPI } from '../../utils/api';
import './Borrow.css';

const BorrowRecords = () => {
  const [records, setRecords] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // 加载借阅记录和书籍数据
  useEffect(() => {
    fetchBorrowRecords();
    fetchBooks();
  }, []);

  const fetchBorrowRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await usersAPI.getBorrowRecords(user.id);
      setRecords(data);
    } catch (err) {
      setError('Failed to load borrow records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const data = await booksAPI.getAll();
      setBooks(data);
    } catch (err) {
      console.error('Failed to load books:', err);
    }
  };

  // 处理归还书籍
  const handleReturnBook = async (record) => {
    try {
      const book = books.find(b => b.title === record.title);
      if (!book) {
        throw new Error('Book not found');
      }
      
      await borrowAPI.return(user.id, book.id);
      
      // 更新借阅记录
      setRecords(records.map(r => 
        r.id === record.id ? { ...r, return_date: new Date().toISOString().split('T')[0] } : r
      ));
      
      // 更新书籍状态
      setBooks(books.map(b => 
        b.id === book.id ? { ...b, status: 'available' } : b
      ));
      
      showToast('Book returned successfully', 'success');
    } catch (err) {
      setError('Failed to return book');
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading borrow records...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={fetchBorrowRecords} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="borrow-records">
      <h3>My Borrow Records</h3>
      {records.length === 0 ? (
        <div className="empty-state">
          <p>No borrow records found.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Borrow Date</th>
              <th>Return Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => (
              <tr key={record.id} className="fade-in">
                <td>{record.id}</td>
                <td>{record.title}</td>
                <td>{record.author}</td>
                <td>{record.borrow_date}</td>
                <td>{record.return_date || 'Not returned'}</td>
                <td className={record.return_date ? 'status-returned' : 'status-borrowed'}>
                  {record.return_date ? 'Returned' : 'Borrowed'}
                </td>
                <td>
                  {!record.return_date && (
                    <button 
                      className="btn-info"
                      onClick={() => handleReturnBook(record)}
                    >
                      Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BorrowRecords;