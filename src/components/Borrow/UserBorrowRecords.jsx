import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI } from '../../utils/api';
import './Borrow.css';

const UserBorrowRecords = () => {
  const { userId } = useParams();
  const [records, setRecords] = useState([]);
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
      setRecords(recordsData);
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
      
      await borrowAPI.return(userId, record.book_id);
      
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
          Back to Users
        </button>
      </div>
      <h2>User Borrow Records</h2>
      {user && (
        <div className="user-info">
          <h3>{user.name} ({user.username})</h3>
          <p>Email: {user.email}</p>
        </div>
      )}
      
      <div className="borrow-records">
        {records.length === 0 ? (
          <div className="empty-state">
            <p>No borrow records found for this user.</p>
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
    </div>
  );
};

export default UserBorrowRecords;