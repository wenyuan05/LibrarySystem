import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI } from '../../utils/api';
import './Borrow.css';

const BorrowRecords = () => {
  const [records, setRecords] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFineModal, setShowFineModal] = useState(false);
  const [fines, setFines] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const { user } = useAuth();
  const { showToast } = useToast();

  // 加载借阅记录
  useEffect(() => {
    fetchBorrowRecords();
  }, []);

  const fetchBorrowRecords = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getBorrowRecords(user.id);
      setRecords(data.records);
      setOverdueCount(data.overdue_count || 0);
      
      // 如果有逾期记录，显示提醒
      if (data.overdue_count > 0) {
        showToast(`您有 ${data.overdue_count} 本图书已逾期，请及时归还！`, 'warning');
      }
    } catch (err) {
      showToast('Failed to load borrow records', 'error');
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
      setRecords(records.map(r => 
        r.id === record.id ? { ...r, status: 'borrowed' } : r
      ));
      
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  // 获取用户罚款记录
  const handleGetFines = async () => {
    try {
      const data = await borrowAPI.getUserFines(user.id);
      setFines(data.fines || []);
      setTotalFine(data.total_fine || 0);
      setShowFineModal(true);
    } catch (err) {
      showToast('Failed to load fines', 'error');
      console.error(err);
    }
  };

  // 支付罚款
  const handlePayFine = async () => {
    try {
      const result = await borrowAPI.payFine(user.id);
      showToast(result.message, 'success');
      setShowFineModal(false);
      // 重新加载借阅记录
      fetchBorrowRecords();
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading borrow records...</div>;
  }

  return (
    <div className="borrow-records">
      <div className="borrow-records-header">
        <h3>My Borrow Records</h3>
        {overdueCount > 0 && (
          <div className="overdue-count">
            <span className="overdue-badge">{overdueCount}</span>
            <span className="overdue-text">Overdue Books</span>
          </div>
        )}
        {user.role === 'user' && (
          <button 
            className="btn-warning"
            onClick={handleGetFines}
          >
            View Fines
          </button>
        )}
      </div>
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
                    <div className="action-buttons">
                      <button 
                        className="btn-info"
                        onClick={() => handleReturnBook(record)}
                      >
                        Return
                      </button>
                      {record.status === 'borrowed' && (
                        <button 
                          className="btn-secondary"
                          onClick={() => handleRenewBook(record)}
                        >
                          Renew
                        </button>
                      )}
                    </div>
                  )}
                  {record.status === 'borrowing' && (
                    <button 
                      className="btn-info"
                      onClick={() => handleConfirmBorrow(record)}
                    >
                      Confirm
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

      {/* 罚款信息弹窗 */}
      {showFineModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>My Fines</h3>
              <button 
                className="modal-close"
                onClick={() => setShowFineModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {fines.length === 0 ? (
                <p>No fines found.</p>
              ) : (
                <div>
                  <table className="fines-table">
                    <thead>
                      <tr>
                        <th>Record ID</th>
                        <th>Book Title</th>
                        <th>Overdue Days</th>
                        <th>Fine Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fines.map(fine => (
                        <tr key={fine.record_id}>
                          <td>{fine.record_id}</td>
                          <td>{fine.title}</td>
                          <td>{fine.overdue_days}</td>
                          <td>${fine.fine_amount.toFixed(2)}</td>
                          <td className={fine.fine_status === 'paid' ? 'status-paid' : 'status-unpaid'}>
                            {fine.fine_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="total-fine">
                    <strong>Total Fine: ${totalFine.toFixed(2)}</strong>
                  </div>
                  {totalFine > 0 && (
                    <button 
                      className="btn-danger"
                      onClick={handlePayFine}
                    >
                      Pay Fine
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowRecords;