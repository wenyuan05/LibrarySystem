import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { usersAPI, borrowAPI, booksAPI } from '../../utils/api';
import { DEFAULT_HISTORY_PAGE_SIZE, paginateRecords, sortBorrowRecords, sortFineRecords } from '../../utils/historyList';
import Barcode from '../Barcode';
import './Borrow.css';

const getFineAmount = (fine) => Number(fine) || 0;

const BorrowRecords = () => {
  const [records, setRecords] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFineModal, setShowFineModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmRecord, setConfirmRecord] = useState(null);
  const [confirmCopies, setConfirmCopies] = useState([]);
  const [selectedCopyId, setSelectedCopyId] = useState('');
  const [fines, setFines] = useState([]);
  const [totalFine, setTotalFine] = useState(0);
  const [recordSortOrder, setRecordSortOrder] = useState('desc');
  const [recordPage, setRecordPage] = useState(1);
  const [fineSortOrder, setFineSortOrder] = useState('desc');
  const [finePage, setFinePage] = useState(1);
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
      setRecordPage(1);
      setOverdueCount(data.overdue_count || 0);
      
      // 如果有逾期记录，计算预估罚款并显示提醒
      if (data.overdue_count > 0) {
        const overdueFines = data.records
          .filter(r => r.status === 'overdue' && r.fine > 0)
          .reduce((sum, r) => sum + r.fine, 0);
        const msg = overdueFines > 0
          ? `您有 ${data.overdue_count} 本图书已逾期，预估罚款 ¥${overdueFines.toFixed(2)}，请及时归还！`
          : `您有 ${data.overdue_count} 本图书已逾期，请及时归还！`;
        showToast(msg, 'warning');
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
      setRecords(records.map(r => 
        r.id === confirmRecord.id ? { ...r, status: 'borrowed' } : r
      ));
      
      setShowConfirmModal(false);
      setConfirmRecord(null);
      setConfirmCopies([]);
      setSelectedCopyId('');
      fetchBorrowRecords();
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
      const fineRecords = Array.isArray(data) ? data : [];
      setFines(fineRecords);
      setFinePage(1);
      setTotalFine(
        fineRecords
          .filter(fine => fine.fine_status === 'unpaid')
          .reduce((sum, fine) => sum + (Number(fine.fine) || 0), 0)
      );
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

  const sortedRecords = sortBorrowRecords(records, recordSortOrder);
  const {
    pageItems: visibleRecords,
    totalPages: recordTotalPages,
    safePage: currentRecordPage
  } = paginateRecords(sortedRecords, recordPage, DEFAULT_HISTORY_PAGE_SIZE);
  const sortedFines = sortFineRecords(fines, fineSortOrder);
  const {
    pageItems: visibleFines,
    totalPages: fineTotalPages,
    safePage: currentFinePage
  } = paginateRecords(sortedFines, finePage, DEFAULT_HISTORY_PAGE_SIZE);

  return (
    <div className="borrow-records">
      <div className="borrow-records-header">
        <h3>My Borrow Records</h3>
        <div className="borrow-records-header-actions">
          {overdueCount > 0 && (
            <div className="overdue-count">
              <span className="overdue-badge">{overdueCount}</span>
              <span className="overdue-text">Overdue Books</span>
            </div>
          )}
          {user.role === 'user' && (
            <button
              className="btn-warning view-fines-button"
              onClick={handleGetFines}
            >
              View Fines
            </button>
          )}
        </div>
      </div>
      {records.length === 0 ? (
        <div className="empty-state">
          <p>No borrow records found.</p>
        </div>
      ) : (
        <>
          <div className="history-toolbar">
            <span>{records.length} records</span>
            <button
              type="button"
              className="btn-secondary history-sort-button"
              onClick={() => {
                setRecordSortOrder(recordSortOrder === 'desc' ? 'asc' : 'desc');
                setRecordPage(1);
              }}
            >
              {recordSortOrder === 'desc' ? 'Oldest First' : 'Newest First'}
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
                onClick={() => setRecordPage(Math.max(1, currentRecordPage - 1))}
                disabled={currentRecordPage === 1}
              >
                Previous
              </button>
              <span>Page {currentRecordPage} of {recordTotalPages}</span>
              <button
                type="button"
                onClick={() => setRecordPage(Math.min(recordTotalPages, currentRecordPage + 1))}
                disabled={currentRecordPage === recordTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* 确认借阅弹窗 */}
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
                  <div className="history-toolbar">
                    <span>{fines.length} records</span>
                    <button
                      type="button"
                      className="btn-secondary history-sort-button"
                      onClick={() => {
                        setFineSortOrder(fineSortOrder === 'desc' ? 'asc' : 'desc');
                        setFinePage(1);
                      }}
                    >
                      {fineSortOrder === 'desc' ? 'Oldest First' : 'Newest First'}
                    </button>
                  </div>
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
                      {visibleFines.map(fine => {
                        const dueDate = new Date(fine.due_date);
                        const returnDate = fine.return_date ? new Date(fine.return_date) : new Date();
                        const overdueDays = Math.max(
                          0,
                          Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24))
                        );

                        return (
                        <tr key={fine.id}>
                          <td>{fine.id}</td>
                          <td>{fine.title}</td>
                          <td>{overdueDays}</td>
                          <td>¥{(Number(fine.fine) || 0).toFixed(2)}</td>
                          <td className={fine.fine_status === 'paid' ? 'status-paid' : 'status-unpaid'}>
                            {fine.fine_status === 'paid' ? 'Paid' : 'Unpaid'}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="total-fine">
                    <strong>Total Fine: ¥{totalFine.toFixed(2)}</strong>
                  </div>
                  {fines.length > DEFAULT_HISTORY_PAGE_SIZE && (
                    <div className="history-pagination">
                      <button
                        type="button"
                        onClick={() => setFinePage(Math.max(1, currentFinePage - 1))}
                        disabled={currentFinePage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {currentFinePage} of {fineTotalPages}</span>
                      <button
                        type="button"
                        onClick={() => setFinePage(Math.min(fineTotalPages, currentFinePage + 1))}
                        disabled={currentFinePage === fineTotalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
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
