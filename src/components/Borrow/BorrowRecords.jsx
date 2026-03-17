import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI } from '../../utils/api';
import './Borrow.css';

const BorrowRecords = () => {
  const [records, setRecords] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // 加载借阅记录和预约记录
  useEffect(() => {
    fetchBorrowRecords();
    fetchReservations();
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

  const fetchReservations = async () => {
    try {
      const data = await borrowAPI.getReservations(user.id);
      setReservations(data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
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
                <td className={record.status === 'returned' ? 'status-returned' : record.status === 'returning' ? 'status-returning' : 'status-borrowed'}>
                  {record.status === 'returned' ? 'Returned' : record.status === 'returning' ? 'Returning' : 'Borrowed'}
                </td>
                <td>
                  {record.status === 'borrowed' && (
                    <button 
                      className="btn-info"
                      onClick={() => handleReturnBook(record)}
                    >
                      Return
                    </button>
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

      <h3 style={{ marginTop: '30px' }}>My Reservations</h3>
      {reservations.length === 0 ? (
        <div className="empty-state">
          <p>No reservations found.</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Author</th>
              <th>Reserve Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(reservation => (
              <tr key={reservation.id} className="fade-in">
                <td>{reservation.id}</td>
                <td>{reservation.title}</td>
                <td>{reservation.author}</td>
                <td>{reservation.reserve_date}</td>
                <td className={reservation.status === 'active' ? 'status-active' : 'status-inactive'}>
                  {reservation.status === 'active' ? 'Active' : 'Inactive'}
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