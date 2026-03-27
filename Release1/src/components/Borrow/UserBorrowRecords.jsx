import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI } from '../../utils/api';
import './Borrow.css';

const UserBorrowRecords = () => {
  const { userId } = useParams();
  const [records, setRecords] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // 处理返回用户列表
  const handleBackToUsers = () => {
    navigate('/users');
  };

  // 加载用户信息和借阅记录
  useEffect(() => {
    fetchUserAndRecords();
  }, [userId]);

  const fetchUserAndRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 获取用户信息
      const userData = await usersAPI.getById(userId);
      setUser(userData);
      
      // 获取用户借阅记录
      const recordsData = await usersAPI.getBorrowRecords(userId);
      setRecords(recordsData.records);
      setOverdueCount(recordsData.overdue_count || 0);
    } catch (err) {
      setError('Failed to load user borrow records');
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
      
      await borrowAPI.return(Number(userId), record.book_id);
      
      // 更新借阅记录
      setRecords(prevRecords => prevRecords.map(r => 
        r.id === record.id ? { ...r, return_date: new Date().toISOString().split('T')[0] } : r
      ));
      
      showToast('Book returned successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 处理确认借阅
  const handleConfirmBorrow = async (record) => {
    try {
      if (!record.id || !record.copy_id) {
        throw new Error('Record ID or Copy ID not found');
      }
      
      const result = await borrowAPI.confirmBorrow(record.id, record.copy_id);
      
      // 更新借阅记录
      setRecords(prevRecords => prevRecords.map(r => 
        r.id === record.id ? { ...r, status: 'borrowed' } : r
      ));
      
      showToast(result.message, 'success');
    } catch (err) {
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
        <button onClick={fetchUserAndRecords} className="btn-primary">Retry</button>
      </div>
    );
  }

  return (
    <div className="borrow-section card fade-in">
      <div className="action-bar">
        <button 
          className="btn-secondary"
          onClick={handleBackToUsers}
        >
          Back to Readers
        </button>
      </div>
      <h2>Reader Borrow Records</h2>
      {user && (
        <div className="user-info">
          <div className="user-info-header">
            <h3>{user.name} ({user.username})</h3>
            {overdueCount > 0 && (
              <div className="overdue-count">
                  <span className="overdue-badge">{overdueCount}</span>
                  <span className="overdue-text">Overdue Books</span>
                </div>
            )}
          </div>
          <p>Email: {user.email}</p>
        </div>
      )}
      
      <div className="borrow-records">
        {records.length === 0 ? (
          <div className="empty-state">
            <p>No borrow records found for this reader.</p>
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
                  <td className={
                    record.status === 'returned' ? 'status-returned' : 
                    record.status === 'returning' ? 'status-returning' : 
                    record.status === 'borrowing' ? 'status-borrowing' : 
                    record.status === 'overdue' ? 'status-overdue' : 'status-borrowed'
                  }>
                    {record.status === 'returned' ? 'Returned' : 
                     record.status === 'returning' ? 'Returning' : 
                     record.status === 'borrowing' ? 'Borrowing' : 
                     record.status === 'overdue' ? 'Overdue' : 'Borrowed'}
                  </td>
                  <td>
                    {(record.status === 'borrowed' || record.status === 'overdue') && (
                      <button 
                        className="btn-info"
                        onClick={() => handleReturnBook(record)}
                      >
                        Return
                      </button>
                    )}
                    {record.status === 'borrowing' && (
                      <button 
                        className="btn-info"
                        onClick={() => handleConfirmBorrow(record)}
                      >
                        Confirm
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserBorrowRecords;