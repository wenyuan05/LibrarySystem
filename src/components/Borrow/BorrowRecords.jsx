import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI } from '../../utils/api';
import './Borrow.css';

const BorrowRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // 加载借阅记录
  useEffect(() => {
    fetchBorrowRecords();
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

  // 处理归还书籍
  const handleReturnBook = async (record) => {
    try {
      if (!record.book_id) {
        throw new Error('Book ID not found in record');
      }
      
      const result = await borrowAPI.return(user.id, record.book_id);
      
      // 更新借阅记录
      setRecords(records.map(r => 
        r.id === record.id ? { ...r, return_date: new Date().toISOString().split('T')[0], status: 'returning' } : r
      ));
      
      showToast(result.message, 'success');
    } catch (err) {
      setError('Failed to submit return request');
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理续借书籍
  const handleRenewBook = async (record) => {
    try {
      if (!record.book_id) {
        throw new Error('Book ID not found in record');
      }
      
      const result = await borrowAPI.renew(user.id, record.book_id);
      
      // 更新借阅记录
      setRecords(records.map(r => 
        r.id === record.id ? { ...r, due_date: result.new_due_date, renew_count: result.renew_count } : r
      ));
      
      showToast(result.message, 'success');
    } catch (err) {
      setError('Failed to renew book');
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
              <th>Borrow Date</th>
              <th>Due Date</th>
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
                <td>{record.borrow_date}</td>
                <td>{record.due_date}</td>
                <td>{record.return_date || 'Not returned'}</td>
                <td className={record.status === 'returned' ? 'status-returned' : record.status === 'returning' ? 'status-returning' : record.status === 'borrowing' ? 'status-borrowing' : 'status-borrowed'}>
                  {record.status === 'returned' ? 'Returned' : record.status === 'returning' ? 'Returning' : record.status === 'borrowing' ? 'Borrowing' : 'Borrowed'}
                </td>
                <td>
                  {record.status === 'borrowed' && (
                    <div className="action-buttons">
                      <button 
                        className="btn-info"
                        onClick={() => handleReturnBook(record)}
                      >
                        Return
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => handleRenewBook(record)}
                      >
                        Renew
                      </button>
                    </div>
                  )}
                  {record.status === 'borrowing' && (
                    <span className="status-pending">Pending confirmation</span>
                  )}
                  {record.status === 'returning' && (
                    <span className="status-pending">Pending approval</span>
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