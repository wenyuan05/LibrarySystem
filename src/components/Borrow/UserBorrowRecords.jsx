import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI, booksAPI } from '../../utils/api';
import { DEFAULT_HISTORY_PAGE_SIZE, paginateRecords, sortBorrowRecords } from '../../utils/historyList';
import Barcode from '../Barcode';
import './Borrow.css';

const getFineAmount = (fine) => Number(fine) || 0;

const UserBorrowRecords = () => {
  const { userId } = useParams();
  const [records, setRecords] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmCopies, setConfirmCopies] = useState([]);
  const [selectedCopyId, setSelectedCopyId] = useState('');
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
      
      // 获取用户信息
      const userData = await usersAPI.getById(userId);
      setUser(userData);
      
      // 获取用户借阅记录
      const recordsData = await usersAPI.getBorrowRecords(userId);
      setRecords(recordsData.records);
      setPage(1);
      setOverdueCount(recordsData.overdue_count || 0);
    } catch (err) {
      showToast('Failed to load user borrow records', 'error');
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

  // 打开确认借阅弹窗
  const openConfirmModal = async (record) => {
    try {
      const copies = await booksAPI.getCopies(record.book_id);
      const availableCopies = copies.filter(
        copy => copy.status === 'available' || copy.id === record.copy_id
      );
      setConfirmRecord(record);
      setConfirmCopies(availableCopies);
      setSelectedCopyId(availableCopies[0]?.id || '');
      setShowConfirmModal(true);
    } catch (err) {
      showToast('Failed to load book copies', 'error');
      console.error(err);
    }
  };

  // 处理确认借阅
  const handleConfirmBorrow = async () => {
    try {
      if (!confirmRecord?.id || !selectedCopyId) {
        throw new Error('Please select a copy before confirming');
      }

      const result = await borrowAPI.confirmBorrow(confirmRecord.id, Number(selectedCopyId));

      // 更新借阅记录
      setRecords(prevRecords => prevRecords.map(r => 
        r.id === confirmRecord.id ? { ...r, status: 'borrowed' } : r
      ));

      setShowConfirmModal(false);
      setConfirmRecord(null);
      setConfirmCopies([]);
      setSelectedCopyId('');
      fetchUserAndRecords();
      showToast(result.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading borrow records...</div>;
  }

  const sortedRecords = sortBorrowRecords(records, sortOrder);
  const {
    pageItems: visibleRecords,
    totalPages,
    safePage: currentPage
  } = paginateRecords(sortedRecords, page, DEFAULT_HISTORY_PAGE_SIZE);

  return (
    <div className="borrow-records-page fade-in">
      <div className="borrow-records">
        <div className="borrow-records-header">
          <h3>User Borrow Records</h3>
          <div className="borrow-records-header-actions">
            {overdueCount > 0 && (
              <div className="overdue-count">
                <span className="overdue-badge">{overdueCount}</span>
                <span className="overdue-text">Overdue Books</span>
              </div>
            )}
            <button
              className="btn-secondary view-fines-button"
              onClick={handleBackToUsers}
            >
              Back to Users
            </button>
          </div>
        </div>

        {user && (
          <div className="borrow-user-summary">
            <strong>{user.name} ({user.username})</strong>
            <span>{user.email}</span>
          </div>
        )}

        {records.length === 0 ? (
          <div className="empty-state">
            <p>No borrow records found for this user.</p>
          </div>
        ) : (
          <>
            <div className="history-toolbar">
              <span>{records.length} records</span>
              <button
                type="button"
                className="btn-secondary history-sort-button"
                onClick={() => {
                  setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                  setPage(1);
                }}
              >
                {sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}
              </button>
            </div>
            <div className="borrow-records-table-wrap">
              <table className="borrow-records-table">
                <colgroup>
                  <col className="col-id" />
                  <col className="col-title" />
                  <col className="col-barcode" />
                  <col className="col-date" />
                  <col className="col-date" />
                  <col className="col-date" />
                  <col className="col-status" />
                  <col className="col-fine" />
                  <col className="col-action" />
                </colgroup>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Barcode</th>
                    <th>Borrow Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map(record => (
                    <tr key={record.id} className="fade-in">
                      <td>{record.id}</td>
                      <td className="title-cell">{record.title}</td>
                      <td className="barcode-cell">
                        {record.status !== 'borrowing' && record.copy_code && (
                          <Barcode code={record.copy_code} width={1.5} height={36} />
                        )}
                      </td>
                      <td className="date-cell">{record.borrow_date}</td>
                      <td className="date-cell">{record.due_date}</td>
                      <td className="date-cell">{record.return_date || 'Not returned'}</td>
                      <td>
                        <span className={
                          `borrow-status-badge ${
                            record.status === 'returned' ? 'status-returned' :
                            record.status === 'returning' ? 'status-returning' :
                            record.status === 'borrowing' ? 'status-borrowing' :
                            record.status === 'overdue' ? 'status-overdue' : 'status-borrowed'
                          }`
                        }>
                          {record.status === 'returned' ? 'Returned' :
                           record.status === 'returning' ? 'Returning' :
                           record.status === 'borrowing' ? 'Borrowing' :
                           record.status === 'overdue' ? 'Overdue' : 'Borrowed'}
                        </span>
                      </td>
                      <td className={getFineAmount(record.fine) > 0 ? 'borrow-fine-amount' : 'borrow-fine-empty'}>
                        {getFineAmount(record.fine) > 0 ? `¥${getFineAmount(record.fine).toFixed(2)}` : '-'}
                      </td>
                      <td className="borrow-action-cell">
                        {(record.status === 'borrowed' || record.status === 'overdue') && (
                          <div className="action-buttons">
                            <button
                              className="btn-info"
                              onClick={() => handleReturnBook(record)}
                            >
                              Return
                            </button>
                          </div>
                        )}
                        {record.status === 'borrowing' && (
                          <div className="action-buttons">
                            <button
                              className="btn-info"
                              onClick={() => openConfirmModal(record)}
                            >
                              Confirm
                            </button>
                          </div>
                        )}
                        {record.status === 'returning' && (
                          <span className="status-pending">Pending approval</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {records.length > DEFAULT_HISTORY_PAGE_SIZE && (
              <div className="history-pagination">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showConfirmModal && confirmRecord && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Confirm Borrowing</h3>
              <button
                className="modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p><strong>User:</strong> {user?.name}</p>
              <p><strong>Book:</strong> {confirmRecord.title}</p>
              <div className="copy-selection">
                <label>Select Copy:</label>
                <select
                  value={selectedCopyId}
                  onChange={(e) => setSelectedCopyId(e.target.value)}
                >
                  {confirmCopies.map(copy => (
                    <option key={copy.id} value={copy.id}>
                      {copy.copy_code || `Copy #${copy.id}`} ({copy.status === 'available' ? 'Available' : 'Previously selected'})
                    </option>
                  ))}
                </select>
              </div>
              {selectedCopyId && confirmCopies.find(copy => copy.id === Number(selectedCopyId))?.copy_code && (
                <div className="selected-copy-barcode">
                  <Barcode
                    code={confirmCopies.find(copy => copy.id === Number(selectedCopyId)).copy_code}
                    width={2}
                    height={50}
                  />
                </div>
              )}
              {confirmCopies.length === 0 && (
                <p>No available copies found.</p>
              )}
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmBorrow}
                disabled={!selectedCopyId}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBorrowRecords;
